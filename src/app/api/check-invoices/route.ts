import { getDb } from '@/lib/database/queries';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const db = await getDb();
    
    const allInvoices = await db.collection('invoices').find({}).toArray();
    const unpaidInvoices = await db.collection('invoices').find({ 
      status: { $in: ['Unpaid', 'Pending'] },
      invoiceDueDate: { $exists: true }
    }).toArray();
    
    return NextResponse.json({
      totalInvoices: allInvoices.length,
      unpaidInvoices: unpaidInvoices.length,
      invoices: allInvoices.map(inv => ({
        invoiceNumber: inv.invoiceNumber,
        invoiceDueDate: inv.invoiceDueDate,
        status: inv.status,
        id: inv._id?.toString()
      }))
    });
    
  } catch (error) {
    console.error('Error checking invoices:', error);
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
