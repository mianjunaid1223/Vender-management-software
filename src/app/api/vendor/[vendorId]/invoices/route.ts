import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import mongoose from 'mongoose';

// Define Invoice schema if not already defined
const invoiceSchema = new mongoose.Schema({
  invoiceNumber: { type: String, required: true, unique: true },
  vendorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Vendor', required: true },
  companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
  amount: { type: Number, required: true },
  currency: { type: String, default: 'USD' },
  status: { 
    type: String, 
    enum: ['draft', 'sent', 'pending', 'paid', 'overdue', 'cancelled'],
    default: 'draft'
  },
  issueDate: { type: Date, required: true },
  dueDate: { type: Date, required: true },
  description: String,
  items: [{
    description: String,
    quantity: Number,
    unitPrice: Number,
    total: Number
  }],
  paidDate: Date,
  notes: String,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const Invoice = mongoose.models.Invoice || mongoose.model('Invoice', invoiceSchema);

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ vendorId: string }> }
) {
  try {
    await connectDB();
    const { vendorId } = await params;

    if (!vendorId) {
      return NextResponse.json({ error: 'Vendor ID is required' }, { status: 400 });
    }

    // Convert vendorId to ObjectId
    let vendorObjectId;
    try {
      vendorObjectId = new mongoose.Types.ObjectId(vendorId);
    } catch (error) {
      return NextResponse.json({ error: 'Invalid vendor ID format' }, { status: 400 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const status = searchParams.get('status');
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    // Build query
    const query: any = { vendorId: vendorObjectId };
    if (status && status !== 'all') {
      query.status = status;
    }

    // Build sort object
    const sort: any = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Get total count for pagination
    const totalInvoices = await Invoice.countDocuments(query);

    // Get invoices with pagination
    const invoices = await Invoice.find(query)
      .populate('companyId', 'name email')
      .populate('vendorId', 'name email')
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    // Calculate pagination info
    const totalPages = Math.ceil(totalInvoices / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    // Get summary statistics
    const stats = await Invoice.aggregate([
      { $match: { vendorId: vendorObjectId } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalAmount: { $sum: '$amount' }
        }
      }
    ]);

    const statusSummary = {
      draft: { count: 0, totalAmount: 0 },
      sent: { count: 0, totalAmount: 0 },
      pending: { count: 0, totalAmount: 0 },
      paid: { count: 0, totalAmount: 0 },
      overdue: { count: 0, totalAmount: 0 },
      cancelled: { count: 0, totalAmount: 0 }
    };

    stats.forEach(stat => {
      if (statusSummary[stat._id as keyof typeof statusSummary]) {
        statusSummary[stat._id as keyof typeof statusSummary] = {
          count: stat.count,
          totalAmount: stat.totalAmount
        };
      }
    });

    const totalAmount = stats.reduce((sum, stat) => sum + stat.totalAmount, 0);

    return NextResponse.json({
      invoices: invoices.map(invoice => ({
        id: invoice._id,
        invoiceNumber: invoice.invoiceNumber,
        amount: invoice.amount,
        currency: invoice.currency,
        status: invoice.status,
        issueDate: invoice.issueDate,
        dueDate: invoice.dueDate,
        paidDate: invoice.paidDate,
        description: invoice.description,
        notes: invoice.notes,
        company: invoice.companyId,
        items: invoice.items || [],
        createdAt: invoice.createdAt,
        updatedAt: invoice.updatedAt
      })),
      pagination: {
        currentPage: page,
        totalPages,
        totalInvoices,
        hasNextPage,
        hasPrevPage,
        limit
      },
      summary: {
        totalInvoices,
        totalAmount,
        statusBreakdown: statusSummary
      }
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
  { params }: { params: Promise<{ vendorId: string }> }
) {
  try {
    await connectDB();
    const { vendorId } = await params;
    const body = await request.json();

    if (!vendorId) {
      return NextResponse.json({ error: 'Vendor ID is required' }, { status: 400 });
    }

    // Convert vendorId to ObjectId
    let vendorObjectId;
    try {
      vendorObjectId = new mongoose.Types.ObjectId(vendorId);
    } catch (error) {
      return NextResponse.json({ error: 'Invalid vendor ID format' }, { status: 400 });
    }

    // Generate invoice number if not provided
    if (!body.invoiceNumber) {
      const lastInvoice = await Invoice.findOne().sort({ createdAt: -1 });
      const lastNumber = lastInvoice ? parseInt(lastInvoice.invoiceNumber.split('-')[1] || '0') : 0;
      body.invoiceNumber = `INV-${String(lastNumber + 1).padStart(6, '0')}`;
    }

    // Calculate total amount from items if provided
    if (body.items && Array.isArray(body.items)) {
      body.amount = body.items.reduce((total: number, item: any) => {
        return total + (item.quantity * item.unitPrice);
      }, 0);
    }

    const invoiceData = {
      ...body,
      vendorId: vendorObjectId,
      companyId: new mongoose.Types.ObjectId(body.companyId),
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const invoice = new Invoice(invoiceData);
    await invoice.save();

    const populatedInvoice = await Invoice.findById(invoice._id)
      .populate('companyId', 'name email')
      .populate('vendorId', 'name email')
      .lean();

    return NextResponse.json({
      success: true,
      invoice: {
        id: populatedInvoice!._id,
        invoiceNumber: populatedInvoice!.invoiceNumber,
        amount: populatedInvoice!.amount,
        currency: populatedInvoice!.currency,
        status: populatedInvoice!.status,
        issueDate: populatedInvoice!.issueDate,
        dueDate: populatedInvoice!.dueDate,
        description: populatedInvoice!.description,
        company: populatedInvoice!.companyId,
        vendor: populatedInvoice!.vendorId,
        items: populatedInvoice!.items || [],
        createdAt: populatedInvoice!.createdAt
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
