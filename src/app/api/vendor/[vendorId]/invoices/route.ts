import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/database/queries';
import { fetchInvoicesByVendor } from '@/lib/database/queries';
import { vendorAuthMiddleware } from '@/lib/auth/vendor-auth';
import { ObjectId } from 'mongodb';

export async function GET(
  request: NextRequest,
  context: any
) {
  try {
    // Authenticate vendor
    const authResponse = await vendorAuthMiddleware(request);
    if (!authResponse.isAuthenticated) {
      return NextResponse.json({ error: authResponse.error }, { status: 401 });
    }

  const { params } = context;
  const invoices = await fetchInvoicesByVendor(params.vendorId);
    
    return NextResponse.json({
      success: true,
      invoices
    });

  } catch (error) {
    console.error('Error fetching vendor invoices:', error);
    return NextResponse.json(
      { error: 'Failed to fetch invoices' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  context: any
) {
  try {
    // Authenticate vendor
    const authResponse = await vendorAuthMiddleware(request);
    if (!authResponse.isAuthenticated) {
      return NextResponse.json({ error: authResponse.error }, { status: 401 });
    }

  const body = await request.json();
  const { params } = context;
    const { invoiceNumber, amount, currency = 'USD', issueDate, dueDate, description, items } = body;

    if (!invoiceNumber || !amount || !issueDate || !dueDate) {
      return NextResponse.json(
        { error: 'Missing required fields: invoiceNumber, amount, issueDate, dueDate' },
        { status: 400 }
      );
    }

    const db = await getDb();
    
    const invoiceData = {
      invoiceNumber,
  vendorId: params.vendorId,
      companyId: body.companyId,
      amount: Number(amount),
      currency,
      status: 'Draft',
      issueDate,
      dueDate,
      description,
      items: items || [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const result = await db.collection('invoices').insertOne(invoiceData);
    
    const newInvoice = await db.collection('invoices').findOne({ _id: result.insertedId });
    
    if (!newInvoice) {
      throw new Error('Failed to create invoice');
    }

    const { _id, ...invoiceResponse } = newInvoice;
    
    return NextResponse.json({
      success: true,
      invoice: {
        ...invoiceResponse,
        id: _id.toString()
      }
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating invoice:', error);
    return NextResponse.json(
      { error: 'Failed to create invoice' },
      { status: 500 }
    );
  }
}
