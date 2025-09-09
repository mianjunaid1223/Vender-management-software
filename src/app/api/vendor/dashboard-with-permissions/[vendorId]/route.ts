import { NextRequest, NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import clientPromise from '@/lib/database/mongodb';
import { getVendorPermissions } from '@/lib/database/vendor-permissions';
import { vendorAuthMiddleware } from '@/lib/auth/vendor-auth';
import { getSession } from '@/lib/auth';

// GET /api/vendor/dashboard-with-permissions/[vendorId] - Get vendor dashboard with permissions
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ vendorId: string }> }
) {
  try {
    const { vendorId } = await params;

    if (!vendorId || !ObjectId.isValid(vendorId)) {
      return NextResponse.json({ 
        error: 'Invalid vendor ID',
        code: 'INVALID_VENDOR_ID'
      }, { status: 400 });
    }

    const client = await clientPromise;
    if (!client) {
      return NextResponse.json({ 
        error: 'Database connection failed',
        code: 'DB_CONNECTION_FAILED'
      }, { status: 500 });
    }
    
    const db = client.db('vendorverse');

    // Find the vendor first
    const vendor = await db.collection('vendors').findOne({ 
      _id: new ObjectId(vendorId),
      status: { $regex: /^(active|approved)$/i }
    });

    if (!vendor) {
      return NextResponse.json({ 
        error: 'Vendor not found or inactive',
        code: 'VENDOR_NOT_FOUND'
      }, { status: 404 });
    }

    // Check authentication - dual mode support
    let isAuthorized = false;
    const isDashboardAuth = request.headers.get('X-Dashboard-Auth') === 'true';
    
    if (isDashboardAuth) {
      // For company dashboard access, verify user session and email match
      const userSession = await getSession();
      if (userSession && userSession.email === vendor.email) {
        isAuthorized = true;
      }
    } else {
      // Regular vendor token authentication
      const authResult = await vendorAuthMiddleware(request);
      if (authResult.isAuthenticated && authResult.vendor && authResult.vendor.id === vendorId) {
        isAuthorized = true;
      }
    }

    if (!isAuthorized) {
      return NextResponse.json({ 
        error: 'Access denied',
        code: 'ACCESS_DENIED'
      }, { status: 403 });
    }

    // Get vendor permissions
    const permissions = await getVendorPermissions(vendorId);

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

    // Get vendor's invoices
    const invoices = await db.collection('invoices').find({ 
      vendorId: new ObjectId(vendor._id) 
    }).sort({ createdAt: -1 }).limit(20).toArray();

    // Get vendor's contracts
    const contracts = await db.collection('contracts').find({ 
      vendorId: new ObjectId(vendor._id) 
    }).sort({ createdAt: -1 }).toArray();

    // Calculate dashboard metrics
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

    // Get recent notifications
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
      permissions,
      stats: {
        totalContracts,
        activeContracts,
        totalInvoices,
        paidInvoices,
        pendingInvoices,
        overdueInvoices,
        totalRevenue,
        pendingPayments,
        averagePaymentTime: 28, // Mock data
        paymentSuccessRate: totalInvoices > 0 ? Math.round((paidInvoices / totalInvoices) * 100) : 0
      },
      recentInvoices: invoices.map(invoice => ({
        id: invoice._id.toString(),
        invoiceNumber: invoice.invoiceNumber || 'N/A',
        amount: invoice.amount || 0,
        currency: invoice.currency || 'USD',
        status: invoice.status || 'pending',
        dueDate: invoice.dueDate || invoice.createdAt,
        issueDate: invoice.createdAt,
        description: invoice.description || 'No description',
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
    console.error('Error fetching vendor dashboard with permissions:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch dashboard data',
      code: 'INTERNAL_ERROR'
    }, { status: 500 });
  }
}