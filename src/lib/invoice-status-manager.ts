'use server';

import { getDb } from '@/lib/data';
import { Invoice } from '@/lib/types';
import { sendOverdueNotification, sendUpcomingPaymentNotification } from '@/lib/email-notifications';

export interface InvoiceAlert {
  id: string;
  type: 'overdue' | 'upcoming' | 'due_today';
  severity: 'high' | 'medium' | 'low';
  message: string;
  invoiceId: string;
  invoiceNumber: string;
  amount: number;
  dueDate: Date;
  daysOverdue?: number;
  daysToDue?: number;
}

export async function updateInvoiceStatuses(): Promise<{
  updated: number;
  overdueInvoices: Invoice[];
  upcomingPayments: Invoice[];
  alerts: InvoiceAlert[];
}> {
  const db = await getDb();
  if (!db) {
    throw new Error('Database connection failed. Cannot update invoice statuses.');
  }

  try {
    const invoicesCollection = db.collection('invoices');
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Find all unpaid invoices
    const unpaidInvoices = await invoicesCollection
      .find({ 
        status: { $in: ['Unpaid', 'Pending'] },
        invoiceDueDate: { $exists: true }
      })
      .toArray();

    const overdueInvoices: Invoice[] = [];
    const upcomingPayments: Invoice[] = [];
    const alerts: InvoiceAlert[] = [];
    let updatedCount = 0;

    for (const invoice of unpaidInvoices) {
      const dueDate = new Date(invoice.invoiceDueDate);
      dueDate.setHours(0, 0, 0, 0);
      
      const diffTime = dueDate.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      // Convert MongoDB document to Invoice type
      const { _id, ...invoiceRest } = invoice;
      const invoiceData: Invoice = {
        ...invoiceRest,
        id: _id.toString(),
      } as Invoice;

      // Check if invoice is overdue
      if (diffDays < 0) {
        if (invoice.status !== 'Overdue') {
          // Update status to overdue
          await invoicesCollection.updateOne(
            { _id: invoice._id },
            { 
              $set: { 
                status: 'Overdue',
                lastStatusUpdate: new Date()
              }
            }
          );
          updatedCount++;
          
          // Process overdue notification (in-app only)
          await sendOverdueNotification(invoiceData, Math.abs(diffDays));
        }
        
        overdueInvoices.push({ ...invoiceData, status: 'Overdue' });
        
        // Create overdue alert
        alerts.push({
          id: `overdue-${invoice._id}`,
          type: 'overdue',
          severity: 'high',
          message: `Invoice #${invoice.invoiceNumber} is ${Math.abs(diffDays)} days overdue`,
          invoiceId: invoice._id.toString(),
          invoiceNumber: invoice.invoiceNumber,
          amount: invoice.invoiceAmount,
          dueDate: dueDate,
          daysOverdue: Math.abs(diffDays)
        });
      }
      // Check if payment is due today
      else if (diffDays === 0) {
        alerts.push({
          id: `due-today-${invoice._id}`,
          type: 'due_today',
          severity: 'high',
          message: `Invoice #${invoice.invoiceNumber} is due today`,
          invoiceId: invoice._id.toString(),
          invoiceNumber: invoice.invoiceNumber,
          amount: invoice.invoiceAmount,
          dueDate: dueDate,
          daysToDue: 0
        });
      }
      // Check for upcoming payments (1-3 days)
      else if (diffDays >= 1 && diffDays <= 3) {
        upcomingPayments.push(invoiceData);
        
        const severity = diffDays === 1 ? 'medium' : 'low';
        
        alerts.push({
          id: `upcoming-${invoice._id}`,
          type: 'upcoming',
          severity,
          message: `Invoice #${invoice.invoiceNumber} is due in ${diffDays} day${diffDays > 1 ? 's' : ''}`,
          invoiceId: invoice._id.toString(),
          invoiceNumber: invoice.invoiceNumber,
          amount: invoice.invoiceAmount,
          dueDate: dueDate,
          daysToDue: diffDays
        });

        // Send upcoming payment notification (1 day before)
        if (diffDays === 1) {
          // Process upcoming payment notification (in-app only)
          await sendUpcomingPaymentNotification(invoiceData, diffDays);
        }
      }
    }

    return {
      updated: updatedCount,
      overdueInvoices,
      upcomingPayments,
      alerts
    };

  } catch (error) {
    console.error('Error updating invoice statuses:', error);
    return { updated: 0, overdueInvoices: [], upcomingPayments: [], alerts: [] };
  }
}

export async function getInvoiceAlerts(): Promise<InvoiceAlert[]> {
  const result = await updateInvoiceStatuses();
  return result.alerts;
}

export async function markInvoiceAsPaid(invoiceId: string): Promise<boolean> {
  const db = await getDb();
  if (!db) throw new Error('Database connection failed.');

  try {
    const result = await db.collection('invoices').updateOne(
      { _id: new (require('mongodb')).ObjectId(invoiceId) },
      { 
        $set: { 
          status: 'Paid',
          paidDate: new Date(),
          lastStatusUpdate: new Date()
        }
      }
    );

    return result.modifiedCount > 0;
  } catch (error) {
    console.error('Error marking invoice as paid:', error);
    return false;
  }
}

export async function getOverdueInvoices(): Promise<Invoice[]> {
  const db = await getDb();
  if (!db) throw new Error('Database connection failed.');

  try {
    const invoices = await db.collection('invoices')
      .find({ status: 'Overdue' })
      .sort({ invoiceDueDate: 1 })
      .toArray();

    return invoices.map(invoice => {
      const { _id, ...rest } = invoice;
      return {
        ...rest,
        id: _id.toString(),
      };
    }) as Invoice[];
  } catch (error) {
    console.error('Error fetching overdue invoices:', error);
    throw new Error('Failed to fetch overdue invoices.');
  }
}

export async function getUpcomingPayments(): Promise<Invoice[]> {
  const db = await getDb();
  if (!db) throw new Error('Database connection failed.');

  try {
    const today = new Date();
    const threeDaysFromNow = new Date();
    threeDaysFromNow.setDate(today.getDate() + 3);

    const invoices = await db.collection('invoices')
      .find({ 
        status: { $in: ['Unpaid', 'Pending'] },
        invoiceDueDate: { 
          $gte: today,
          $lte: threeDaysFromNow
        }
      })
      .sort({ invoiceDueDate: 1 })
      .toArray();

    return invoices.map(invoice => {
      const { _id, ...rest } = invoice;
      return {
        ...rest,
        id: _id.toString(),
      };
    }) as Invoice[];
  } catch (error) {
    console.error('Error fetching upcoming payments:', error);
    throw new Error('Failed to fetch upcoming payments.');
  }
}
