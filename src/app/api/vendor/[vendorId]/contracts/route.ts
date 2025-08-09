import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import mongoose from 'mongoose';

// Define Contract schema if not already defined
const contractSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: String,
  vendorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Vendor', required: true },
  companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
  value: { type: Number, required: true },
  currency: { type: String, default: 'USD' },
  status: { 
    type: String, 
    enum: ['draft', 'active', 'completed', 'terminated', 'expired'],
    default: 'draft'
  },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  terms: String,
  deliverables: [{
    title: String,
    description: String,
    dueDate: Date,
    status: {
      type: String,
      enum: ['pending', 'in_progress', 'completed', 'overdue'],
      default: 'pending'
    },
    completedDate: Date
  }],
  paymentTerms: {
    schedule: {
      type: String,
      enum: ['milestone', 'monthly', 'quarterly', 'upon_completion'],
      default: 'upon_completion'
    },
    milestones: [{
      title: String,
      amount: Number,
      dueDate: Date,
      status: {
        type: String,
        enum: ['pending', 'paid'],
        default: 'pending'
      },
      paidDate: Date
    }]
  },
  documents: [{
    name: String,
    url: String,
    uploadDate: { type: Date, default: Date.now }
  }],
  signedDate: Date,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const Contract = mongoose.models.Contract || mongoose.model('Contract', contractSchema);

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
    const totalContracts = await Contract.countDocuments(query);

    // Get contracts with pagination
    const contracts = await Contract.find(query)
      .populate('companyId', 'name email')
      .populate('vendorId', 'name email')
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    // Calculate pagination info
    const totalPages = Math.ceil(totalContracts / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    // Get summary statistics
    const stats = await Contract.aggregate([
      { $match: { vendorId: vendorObjectId } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalValue: { $sum: '$value' }
        }
      }
    ]);

    const statusSummary = {
      draft: { count: 0, totalValue: 0 },
      active: { count: 0, totalValue: 0 },
      completed: { count: 0, totalValue: 0 },
      terminated: { count: 0, totalValue: 0 },
      expired: { count: 0, totalValue: 0 }
    };

    stats.forEach(stat => {
      if (statusSummary[stat._id as keyof typeof statusSummary]) {
        statusSummary[stat._id as keyof typeof statusSummary] = {
          count: stat.count,
          totalValue: stat.totalValue
        };
      }
    });

    const totalValue = stats.reduce((sum, stat) => sum + stat.totalValue, 0);

    // Calculate contract performance metrics
    const now = new Date();
    const activeContracts = contracts.filter(c => c.status === 'active');
    const expiringContracts = activeContracts.filter(c => {
      const endDate = new Date(c.endDate);
      const daysUntilExpiry = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      return daysUntilExpiry <= 30 && daysUntilExpiry > 0;
    });

    return NextResponse.json({
      contracts: contracts.map(contract => ({
        id: contract._id,
        title: contract.title,
        description: contract.description,
        value: contract.value,
        currency: contract.currency,
        status: contract.status,
        startDate: contract.startDate,
        endDate: contract.endDate,
        signedDate: contract.signedDate,
        terms: contract.terms,
        company: contract.companyId,
        deliverables: contract.deliverables || [],
        paymentTerms: contract.paymentTerms || {},
        documents: contract.documents || [],
        createdAt: contract.createdAt,
        updatedAt: contract.updatedAt
      })),
      pagination: {
        currentPage: page,
        totalPages,
        totalContracts,
        hasNextPage,
        hasPrevPage,
        limit
      },
      summary: {
        totalContracts,
        totalValue,
        statusBreakdown: statusSummary,
        expiringCount: expiringContracts.length,
        activeCount: statusSummary.active.count
      }
    });

  } catch (error) {
    console.error('Error fetching vendor contracts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch contracts' },
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

    const contractData = {
      ...body,
      vendorId: vendorObjectId,
      companyId: new mongoose.Types.ObjectId(body.companyId),
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const contract = new Contract(contractData);
    await contract.save();

    const populatedContract = await Contract.findById(contract._id)
      .populate('companyId', 'name email')
      .populate('vendorId', 'name email')
      .lean();

    return NextResponse.json({
      success: true,
      contract: {
        id: populatedContract!._id,
        title: populatedContract!.title,
        description: populatedContract!.description,
        value: populatedContract!.value,
        currency: populatedContract!.currency,
        status: populatedContract!.status,
        startDate: populatedContract!.startDate,
        endDate: populatedContract!.endDate,
        terms: populatedContract!.terms,
        company: populatedContract!.companyId,
        vendor: populatedContract!.vendorId,
        deliverables: populatedContract!.deliverables || [],
        paymentTerms: populatedContract!.paymentTerms || {},
        documents: populatedContract!.documents || [],
        createdAt: populatedContract!.createdAt
      }
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating contract:', error);
    return NextResponse.json(
      { error: 'Failed to create contract' },
      { status: 500 }
    );
  }
}
