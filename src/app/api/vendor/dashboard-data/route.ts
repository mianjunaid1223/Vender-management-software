import { NextRequest, NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import clientPromise from '@/lib/database/mongodb';

// GET /api/vendor/dashboard-data
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const vendorId = searchParams.get('vendorId');
    const vendorEmail = searchParams.get('email');

    if (!vendorId && !vendorEmail) {
      return NextResponse.json({ error: 'Vendor ID or email is required' }, { status: 400 });
    }

    const client = await clientPromise;
    if (!client) {
      return NextResponse.json({ error: 'Database connection failed' }, { status: 500 });
    }
    
    const db = client.db('vendorverse');

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

    // Get vendor's company information
    const company = await db.collection('companies').findOne({ _id: new ObjectId(vendor.companyId) });

    // Get vendor's invoices
    const invoices = await db.collection('invoices').find({ 
      vendorId: new ObjectId(vendor._id) 
    }).sort({ createdAt: -1 }).limit(20).toArray();

    // Get vendor's contracts
    const contracts = await db.collection('contracts').find({ 
      vendorId: new ObjectId(vendor._id) 
    }).sort({ createdAt: -1 }).toArray();

    // Calculate dashboard metrics
    const totalInvoices = await db.collection('invoices').countDocuments({ vendorId: new ObjectId(vendor._id) });
    const pendingInvoices = await db.collection('invoices').countDocuments({ 
      vendorId: new ObjectId(vendor._id), 
      status: { $in: ['pending', 'submitted', 'under_review'] }
    });
    const approvedInvoices = await db.collection('invoices').countDocuments({ 
      vendorId: new ObjectId(vendor._id), 
      status: 'approved'
    });
    const paidInvoices = await db.collection('invoices').countDocuments({ 
      vendorId: new ObjectId(vendor._id), 
      status: 'paid'
    });

    // Calculate total amounts
    const totalAmountPending = await db.collection('invoices').aggregate([
      { $match: { vendorId: new ObjectId(vendor._id), status: { $in: ['pending', 'submitted', 'under_review', 'approved'] } } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]).toArray();

    const totalAmountPaid = await db.collection('invoices').aggregate([
      { $match: { vendorId: new ObjectId(vendor._id), status: 'paid' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]).toArray();

    // Get recent activities (invoice status changes, contract updates, etc.)
    const recentActivities = await db.collection('activities').find({
      $or: [
        { vendorId: new ObjectId(vendor._id) },
        { 'metadata.vendorId': new ObjectId(vendor._id) }
      ]
    }).sort({ createdAt: -1 }).limit(10).toArray();

    // Get upcoming payments
    const upcomingPayments = await db.collection('invoices').find({
      vendorId: new ObjectId(vendor._id),
      status: 'approved',
      dueDate: { $gte: new Date() }
    }).sort({ dueDate: 1 }).limit(5).toArray();

    const dashboardData = {
      vendor: {
        id: vendor._id,
        name: vendor.name,
        email: vendor.email,
        phone: vendor.phone,
        address: vendor.address,
        status: vendor.status,
        joinedDate: vendor.createdAt,
        pin: vendor.pin
      },
      company: company ? {
        id: company._id,
        name: company.name,
        email: company.email,
        logo: company.logo
      } : null,
      metrics: {
        totalInvoices,
        pendingInvoices,
        approvedInvoices,
        paidInvoices,
        totalAmountPending: totalAmountPending[0]?.total || 0,
        totalAmountPaid: totalAmountPaid[0]?.total || 0
      },
      recentInvoices: invoices.slice(0, 5).map((invoice: any) => ({
        id: invoice._id,
        number: invoice.number || `INV-${invoice._id.toString().slice(-6)}`,
        amount: invoice.amount,
        status: invoice.status,
        dueDate: invoice.dueDate,
        createdAt: invoice.createdAt,
        description: invoice.description
      })),
      contracts: contracts.map((contract: any) => ({
        id: contract._id,
        title: contract.title,
        status: contract.status,
        startDate: contract.startDate,
        endDate: contract.endDate,
        value: contract.value,
        createdAt: contract.createdAt
      })),
      recentActivities: recentActivities.map((activity: any) => ({
        id: activity._id,
        type: activity.type,
        title: activity.title,
        description: activity.description,
        createdAt: activity.createdAt,
        metadata: activity.metadata
      })),
      upcomingPayments: upcomingPayments.map((payment: any) => ({
        id: payment._id,
        number: payment.number || `INV-${payment._id.toString().slice(-6)}`,
        amount: payment.amount,
        dueDate: payment.dueDate,
        description: payment.description
      }))
    };

    return NextResponse.json(dashboardData);
  } catch (error) {
    console.error('Error fetching vendor dashboard data:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch dashboard data',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
