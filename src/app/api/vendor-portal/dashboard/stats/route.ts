import { NextRequest, NextResponse } from 'next/server';
import { getVendorSession } from '@/core/auth/vendor-auth';
import { getDb } from '@/shared/lib/data';
import { ObjectId } from 'mongodb';

export async function GET(request: NextRequest) {
  try {
    const vendorSession = await getVendorSession();
    
    if (!vendorSession) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const db = await getDb();

    // Get company and vendor portal access settings
    const company = await db.collection('companies').findOne({
      _id: new ObjectId(vendorSession.companyId)
    });

    if (!company) {
      return NextResponse.json({
        totalInvoices: 0,
        pendingInvoices: 0,
        paidInvoices: 0,
        totalAmount: 0,
        activeContracts: 0,
        complianceScore: 0
      });
    }

    // Find portal access for this vendor
    const portalAccess = company.vendorPortalAccess?.find(
      (access: any) => access.vendorId === vendorSession.vendorId && access.enabled
    );

    if (!portalAccess) {
      return NextResponse.json({
        totalInvoices: 0,
        pendingInvoices: 0,
        paidInvoices: 0,
        totalAmount: 0,
        activeContracts: 0,
        complianceScore: 0
      });
    }

    const allowedFeatures = portalAccess.features || {};
    const stats: any = {
      totalInvoices: 0,
      pendingInvoices: 0,
      paidInvoices: 0,
      totalAmount: 0,
      activeContracts: 0,
      complianceScore: 95
    };

    // Only fetch stats for features the vendor has access to
    if (allowedFeatures.viewInvoices) {
      // Get invoice statistics using aggregation
      const invoiceStats = await db.collection('invoices').aggregate([
        {
          $match: {
            vendorId: vendorSession.vendorId,
            companyId: vendorSession.companyId
          }
        },
        {
          $group: {
            _id: null,
            totalInvoices: { $sum: 1 },
            pendingInvoices: {
              $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] }
            },
            paidInvoices: {
              $sum: { $cond: [{ $eq: ['$status', 'paid'] }, 1, 0] }
            },
            totalAmount: { $sum: { $ifNull: ['$amount', 0] } }
          }
        }
      ]).toArray();

      const invoiceData = invoiceStats[0] || {
        totalInvoices: 0,
        pendingInvoices: 0,
        paidInvoices: 0,
        totalAmount: 0
      };

      stats.totalInvoices = invoiceData.totalInvoices;
      stats.pendingInvoices = invoiceData.pendingInvoices;
      stats.paidInvoices = invoiceData.paidInvoices;
      stats.totalAmount = invoiceData.totalAmount;
    }

    if (allowedFeatures.viewContracts) {
      // Get contract statistics
      const contracts = await db.collection('contracts').find({
        vendorId: vendorSession.vendorId,
        companyId: vendorSession.companyId,
        status: 'active'
      }).toArray();

      stats.activeContracts = contracts.length;
    }

    return NextResponse.json(stats);

  } catch (error) {
    console.error('Error fetching vendor dashboard stats:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
