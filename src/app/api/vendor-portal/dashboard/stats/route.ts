import { NextRequest, NextResponse } from 'next/server';
import { getVendorSession } from '@/lib/auth/vendor-auth';
import { getDb } from '@/lib/data';
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
      // Get invoice statistics
      const invoices = await db.collection('invoices').find({
        vendorId: vendorSession.vendorId,
        companyId: vendorSession.companyId
      }).toArray();

      stats.totalInvoices = invoices.length;
      stats.pendingInvoices = invoices.filter(inv => inv.status === 'pending').length;
      stats.paidInvoices = invoices.filter(inv => inv.status === 'paid').length;
      stats.totalAmount = invoices.reduce((sum, inv) => sum + (inv.amount || 0), 0);
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
