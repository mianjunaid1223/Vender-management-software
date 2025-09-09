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

    // Get notifications for this vendor
    const notifications = [];

    // Get company and portal access settings
    const company = await db.collection('companies').findOne({
      _id: new ObjectId(vendorSession.companyId)
    });

    if (!company) {
      return NextResponse.json([]);
    }

    // Find portal access for this vendor
    const portalAccess = company.vendorPortalAccess?.find(
      (access: any) => access.vendorId === vendorSession.vendorId && access.enabled
    );

    if (portalAccess?.features?.viewInvoices) {
      const pendingInvoices = await db.collection('invoices').find({
        'vendor.id': vendorSession.vendorId,
        companyId: vendorSession.companyId,
        status: 'pending'
      }).limit(5).toArray();

      if (pendingInvoices.length > 0) {
        notifications.push({
          id: 'pending-invoices',
          title: 'Pending Invoices',
          message: `You have ${pendingInvoices.length} pending invoice(s) requiring attention.`,
          type: 'info',
          priority: 'medium',
          timestamp: new Date().toISOString(),
          actionUrl: '/vendor-portal/invoices'
        });
      }
    }

    // Check for expiring contracts (if vendor has access)
    if (portalAccess?.features?.viewContracts) {
      const oneMonthFromNow = new Date();
      oneMonthFromNow.setMonth(oneMonthFromNow.getMonth() + 1);

      const expiringContracts = await db.collection('contracts').find({
        $or: [
          { 'partyA.id': vendorSession.vendorId },
          { 'partyB.id': vendorSession.vendorId }
        ],
        companyId: vendorSession.companyId,
        endDate: { $lte: oneMonthFromNow.toISOString() },
        status: 'active'
      }).limit(3).toArray();

      if (expiringContracts.length > 0) {
        notifications.push({
          id: 'expiring-contracts',
          title: 'Contracts Expiring Soon',
          message: `${expiringContracts.length} contract(s) will expire within 30 days.`,
          type: 'warning',
          priority: 'high',
          timestamp: new Date().toISOString(),
          actionUrl: '/vendor-portal/contracts'
        });
      }
    }

    // Welcome message for new users
    const vendorUser = await db.collection('vendor_users').findOne({
      _id: new ObjectId(vendorSession.id),
      vendorId: vendorSession.vendorId
    });

    if (vendorUser?.loginCount <= 1) {
      notifications.push({
        id: 'welcome',
        title: 'Welcome to the Vendor Portal',
        message: 'Explore your dashboard to manage invoices, contracts, and profile information.',
        type: 'success',
        priority: 'low',
        timestamp: new Date().toISOString(),
        actionUrl: '/vendor-portal/profile'
      });
    }

    return NextResponse.json(notifications);

  } catch (error) {
    console.error('Error fetching vendor notifications:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
