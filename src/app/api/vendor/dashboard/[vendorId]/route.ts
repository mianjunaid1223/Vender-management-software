import { NextRequest, NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import clientPromise from '@/lib/mongodb';
import { vendorAuthMiddleware, createUnauthorizedResponse } from '@/lib/vendor-auth-middleware';

// GET /api/vendor/dashboard/[vendorId] - Secure vendor dashboard data by vendorId
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ vendorId: string }> }
) {
  try {
    const { vendorId } = await params;

    if (!vendorId) {
      return NextResponse.json({ 
        error: 'Vendor ID is required',
        code: 'VENDOR_ID_REQUIRED'
      }, { status: 400 });
    }

    const authResult = await vendorAuthMiddleware(request);
    if (!authResult.isAuthenticated || !authResult.vendor) {
      return createUnauthorizedResponse(authResult.error);
    }
    if (authResult.vendor.id !== vendorId) {
      return NextResponse.json({ 
        error: 'Access denied. You can only view your own dashboard.',
        code: 'ACCESS_DENIED'
      }, { status: 403 });
    }

    // Validate ObjectId format
    if (!ObjectId.isValid(vendorId)) {
      console.error('Invalid vendor ID format:', vendorId);
      return NextResponse.json({ 
        error: 'Invalid vendor ID format',
        code: 'INVALID_VENDOR_ID'
      }, { status: 400 });
    }

    console.log('🔍 Dashboard request for vendor ID:', vendorId);

    const client = await clientPromise;
    if (!client) {
      return NextResponse.json({ 
        error: 'Database connection failed',
        code: 'DB_CONNECTION_FAILED'
      }, { status: 500 });
    }
    
    const db = client.db('vendorverse');

    // Find the vendor with proper error handling
    const vendor = await db.collection('vendors').findOne({ 
      _id: new ObjectId(vendorId),
      status: { $regex: /^active$/i } // Case-insensitive status check
    });

    console.log('🔍 Vendor lookup result:', vendor ? `Found vendor: ${vendor.name}` : 'No vendor found');

    if (!vendor) {
      return NextResponse.json({ 
        error: 'Vendor not found or inactive',
        code: 'VENDOR_NOT_FOUND'
      }, { status: 404 });
    }

    // Get vendor's company information
    const company = await db.collection('companies').findOne({ 
      _id: new ObjectId(vendor.companyId) 
    });

    if (!company) {
      return NextResponse.json({ 
        error: 'Associated company not found',
        code: 'COMPANY_NOT_FOUND'
      }, { status: 404 });
    }

    // Get vendor's invoices with proper aggregation
    const invoices = await db.collection('invoices').find({ 
      vendorId: new ObjectId(vendor._id) 
    }).sort({ createdAt: -1 }).limit(20).toArray();

    // Get vendor's contracts
    const contracts = await db.collection('contracts').find({ 
      vendorId: new ObjectId(vendor._id) 
    }).sort({ createdAt: -1 }).toArray();

    // Calculate dashboard metrics with proper error handling
    const [
      totalInvoices,
      pendingInvoices,
      paidInvoices,
      overdueInvoices,
      totalContracts,
      activeContracts
    ] = await Promise.all([
      db.collection('invoices').countDocuments({ vendorId: new ObjectId(vendor._id) }),
      db.collection('invoices').countDocuments({ 
        vendorId: new ObjectId(vendor._id), 
        status: { $in: ['pending', 'submitted', 'processing'] }
      }),
      db.collection('invoices').countDocuments({ 
        vendorId: new ObjectId(vendor._id), 
        status: 'paid' 
      }),
      db.collection('invoices').countDocuments({ 
        vendorId: new ObjectId(vendor._id), 
        status: 'overdue' 
      }),
      db.collection('contracts').countDocuments({ vendorId: new ObjectId(vendor._id) }),
      db.collection('contracts').countDocuments({ 
        vendorId: new ObjectId(vendor._id), 
        status: 'active' 
      })
    ]);

    // Calculate financial metrics
    const paidInvoiceAggregation = await db.collection('invoices').aggregate([
      { $match: { vendorId: new ObjectId(vendor._id), status: 'paid' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]).toArray();

    const pendingPaymentAggregation = await db.collection('invoices').aggregate([
      { 
        $match: { 
          vendorId: new ObjectId(vendor._id), 
          status: { $in: ['pending', 'submitted', 'processing', 'approved'] }
        } 
      },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]).toArray();

    const totalRevenue = paidInvoiceAggregation[0]?.total || 0;
    const pendingPayments = pendingPaymentAggregation[0]?.total || 0;

    // Get recent notifications/messages
    const notifications = await db.collection('vendorNotifications').find({ 
      vendorId: new ObjectId(vendor._id) 
    }).sort({ createdAt: -1 }).limit(10).toArray();

    // Format response data
    const dashboardData = {
      vendor: {
        id: vendor._id.toString(),
        name: vendor.name,
        email: vendor.email,
        status: vendor.status,
        company: {
          name: company.name,
          id: company._id.toString()
        }
      },
      stats: {
        totalContracts,
        activeContracts,
        totalInvoices,
        paidInvoices,
        pendingInvoices,
        overdueInvoices,
        totalRevenue,
        pendingPayments
      },
      recentInvoices: invoices.map(invoice => ({
        id: invoice._id.toString(),
        invoiceNumber: invoice.invoiceNumber || 'N/A',
        amount: invoice.amount || 0,
        currency: invoice.currency || 'USD',
        status: invoice.status || 'pending',
        dueDate: invoice.dueDate || invoice.createdAt,
        issueDate: invoice.createdAt,
        companyName: company.name
      })),
      contracts: contracts.map(contract => ({
        id: contract._id.toString(),
        title: contract.title || contract.name || 'Untitled Contract',
        status: contract.status || 'active',
        startDate: contract.startDate || contract.createdAt,
        endDate: contract.endDate,
        value: contract.value || contract.amount || 0,
        currency: contract.currency || 'USD',
        companyName: company.name
      })),
      notifications: notifications.map(notification => ({
        id: notification._id.toString(),
        type: notification.type || 'info',
        message: notification.message,
        date: notification.createdAt,
        read: notification.read || false
      }))
    };

    return NextResponse.json(dashboardData);

  } catch (error) {
    console.error('Error fetching vendor dashboard data:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch dashboard data',
      code: 'INTERNAL_ERROR'
    }, { status: 500 });
  }
}
