import { NextRequest, NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import clientPromise from '@/lib/database/mongodb';

// GET /api/vendor/invoices
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const vendorId = searchParams.get('vendorId');
    const vendorEmail = searchParams.get('email');
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');

    if (!vendorId && !vendorEmail) {
      return NextResponse.json({ error: 'Vendor ID or email is required' }, { status: 400 });
    }

    const client = await clientPromise;
    if (!client) {
      return NextResponse.json({ error: 'Database connection failed' }, { status: 500 });
    }
    
    const db = client.db('vendorManagement');

    // Find the vendor
    let vendor: any;
    if (vendorId) {
      vendor = await db.collection('vendors').findOne({ _id: new ObjectId(vendorId) });
    } else if (vendorEmail) {
      vendor = await db.collection('vendors').findOne({ email: vendorEmail });
    }

    if (!vendor) {
      return NextResponse.json({ error: 'Vendor not found' }, { status: 404 });
    }

    // Build query filter
    const filter: any = { vendorId: new ObjectId(vendor._id) };
    if (status) {
      filter.status = status;
    }

    // Get total count for pagination
    const totalInvoices = await db.collection('invoices').countDocuments(filter);

    // Get invoices with pagination
    const invoices = await db.collection('invoices')
      .find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .toArray();

    // Get company information for each invoice
    const invoicesWithDetails = await Promise.all(
      invoices.map(async (invoice: any) => {
        const company = await db.collection('companies').findOne({ _id: new ObjectId(invoice.companyId || vendor.companyId) });
        return {
          id: invoice._id,
          number: invoice.number || `INV-${invoice._id.toString().slice(-6)}`,
          amount: invoice.amount,
          currency: invoice.currency || 'USD',
          status: invoice.status,
          dueDate: invoice.dueDate,
          createdAt: invoice.createdAt,
          updatedAt: invoice.updatedAt,
          description: invoice.description,
          items: invoice.items || [],
          attachments: invoice.attachments || [],
          notes: invoice.notes,
          company: company ? {
            name: company.name,
            email: company.email
          } : null
        };
      })
    );

    const result = {
      invoices: invoicesWithDetails,
      pagination: {
        page,
        limit,
        total: totalInvoices,
        totalPages: Math.ceil(totalInvoices / limit),
        hasNext: page < Math.ceil(totalInvoices / limit),
        hasPrev: page > 1
      }
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching vendor invoices:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch invoices',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// POST /api/vendor/invoices - Create new invoice
export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const vendorId = searchParams.get('vendorId');
    const vendorEmail = searchParams.get('email');

    if (!vendorId && !vendorEmail) {
      return NextResponse.json({ error: 'Vendor ID or email is required' }, { status: 400 });
    }

    const body = await request.json();
    const { amount, description, dueDate, items, notes } = body;

    if (!amount || !description) {
      return NextResponse.json({ error: 'Amount and description are required' }, { status: 400 });
    }

    const client = await clientPromise;
    if (!client) {
      return NextResponse.json({ error: 'Database connection failed' }, { status: 500 });
    }
    
    const db = client.db('vendorManagement');

    // Find the vendor
    let vendor: any;
    if (vendorId) {
      vendor = await db.collection('vendors').findOne({ _id: new ObjectId(vendorId) });
    } else if (vendorEmail) {
      vendor = await db.collection('vendors').findOne({ email: vendorEmail });
    }

    if (!vendor) {
      return NextResponse.json({ error: 'Vendor not found' }, { status: 404 });
    }

    // Create invoice
    const invoice = {
      vendorId: new ObjectId(vendor._id),
      companyId: new ObjectId(vendor.companyId),
      amount: parseFloat(amount),
      currency: body.currency || 'USD',
      description,
      dueDate: dueDate ? new Date(dueDate) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      status: 'pending',
      items: items || [],
      notes,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await db.collection('invoices').insertOne(invoice);

    // Log activity
    await db.collection('activities').insertOne({
      type: 'invoice_created',
      title: 'New Invoice Created',
      description: `Invoice for $${amount} created by ${vendor.name}`,
      vendorId: new ObjectId(vendor._id),
      companyId: new ObjectId(vendor.companyId),
      metadata: {
        invoiceId: result.insertedId,
        amount
      },
      createdAt: new Date()
    });

    return NextResponse.json({ 
      message: 'Invoice created successfully',
      invoiceId: result.insertedId 
    });
  } catch (error) {
    console.error('Error creating invoice:', error);
    return NextResponse.json({ 
      error: 'Failed to create invoice',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
