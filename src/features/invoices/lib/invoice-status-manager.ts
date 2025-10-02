'use server';

import { getDb } from '@/shared/lib/data';
import { Invoice } from '@/shared/types/types';
import { sendOverdueNotification, sendUpcomingPaymentNotification } from '@/core/services/email-notifications';
import { calculateDaysDifference, formatDaysDifference, getPaymentStatus, getAlertSeverity } from '@/core/utils/date-utils';
import { getSession } from '@/core/auth/auth';

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

  // Get current user's company ID to filter invoices
  const user = await getSession();
  const companyId = user?.companyId;
  
  if (!companyId) {
    return {
      updated: 0,
      overdueInvoices: [],
      upcomingPayments: [],
      alerts: []
    };
  }

  try {
    const invoicesCollection = db.collection('invoices');
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Find unpaid invoices for current user's company only
    const unpaidInvoices = await invoicesCollection
      .find({ 
        companyId,  // Filter by company ID
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
      const diffDays = calculateDaysDifference(dueDate);
      const paymentStatus = getPaymentStatus(diffDays);

      // Convert MongoDB document to Invoice type
      const { _id, ...invoiceRest } = invoice;
      const invoiceData: Invoice = {
        ...invoiceRest,
        id: _id.toString(),
      } as Invoice;

      // Check if invoice is overdue
      if (paymentStatus === 'overdue') {
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
          severity: getAlertSeverity(diffDays),
          message: `Invoice #${invoice.invoiceNumber} is ${formatDaysDifference(diffDays)}`,
          invoiceId: invoice._id.toString(),
          invoiceNumber: invoice.invoiceNumber,
          amount: invoice.invoiceAmount,
          dueDate: dueDate,
          daysOverdue: Math.abs(diffDays)
        });
      }
      // Check if payment is due today
      else if (paymentStatus === 'due_today') {
        alerts.push({
          id: `due-today-${invoice._id}`,
          type: 'due_today',
          severity: getAlertSeverity(diffDays),
          message: `Invoice #${invoice.invoiceNumber} is ${formatDaysDifference(diffDays)}`,
          invoiceId: invoice._id.toString(),
          invoiceNumber: invoice.invoiceNumber,
          amount: invoice.invoiceAmount,
          dueDate: dueDate,
          daysToDue: 0
        });
      }
      // Check for upcoming payments (1-3 days)
      else if (paymentStatus === 'upcoming') {
        upcomingPayments.push(invoiceData);
        
        alerts.push({
          id: `upcoming-${invoice._id}`,
          type: 'upcoming',
          severity: getAlertSeverity(diffDays),
          message: `Invoice #${invoice.invoiceNumber} is ${formatDaysDifference(diffDays)}`,
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

  // Get current user's company ID to ensure they can only update their company's invoices
  const user = await getSession();
  const companyId = user?.companyId;
  
  if (!companyId) {
    return false;
  }

  try {
    const result = await db.collection('invoices').updateOne(
      { 
        _id: new (require('mongodb')).ObjectId(invoiceId),
        companyId  // Ensure user can only update their company's invoices
      },
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

  // Get current user's company ID to filter invoices
  const user = await getSession();
  const companyId = user?.companyId;
  
  if (!companyId) {
    return [];
  }

  try {
    const invoices = await db.collection('invoices')
      .find({ 
        companyId,  // Filter by company ID
        status: 'Overdue' 
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
    console.error('Error fetching overdue invoices:', error);
    throw new Error('Failed to fetch overdue invoices.');
  }
}

export async function getUpcomingPayments(): Promise<Invoice[]> {
  const db = await getDb();
  if (!db) throw new Error('Database connection failed.');

  // Get current user's company ID to filter invoices
  const user = await getSession();
  const companyId = user?.companyId;
  
  if (!companyId) {
    return [];
  }

  try {
    const today = new Date();
    const threeDaysFromNow = new Date();
    threeDaysFromNow.setDate(today.getDate() + 3);

    const invoices = await db.collection('invoices')
      .find({ 
        companyId,  // Filter by company ID
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
