import { NextRequest, NextResponse } from 'next/server';
import { getVendorSession } from '@/core/auth/vendor-auth';
import { getDb } from '@/shared/lib/data';
import { ObjectId } from 'mongodb';
import { mapVendorPermissions } from '@/features/vendors/lib/vendor-permissions';

export async function GET(request: NextRequest) {
  try {
    const session = await getVendorSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const db = await getDb();
    
    // Get the company's vendor portal access configuration
    const company = await db.collection('companies').findOne({
      _id: new ObjectId(session.companyId)
    });

    if (!company) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 });
    }

    // Find this vendor's portal access configuration
    const vendorAccess = company.vendorPortalAccess?.find(
      (access: any) => access.vendorId === session.vendorId
    );

    if (!vendorAccess || !vendorAccess.enabled) {
      return NextResponse.json({ error: 'Portal access not enabled' }, { status: 403 });
    }

    // Check if access has expired
    if (vendorAccess.expiresAt && new Date() > new Date(vendorAccess.expiresAt)) {
      return NextResponse.json({ error: 'Portal access has expired' }, { status: 403 });
    }

    // Map the 8 core features to permissions with access levels
    const permissions = mapVendorPermissions(vendorAccess.features);

    return NextResponse.json({
      vendorId: session.vendorId,
      companyId: session.companyId,
      permissions,
      accessExpiresAt: vendorAccess.expiresAt,
      sessionTimeout: vendorAccess.sessionTimeout || 480,
      mfaRequired: vendorAccess.mfaRequired || false
    });

  } catch (error) {
    console.error('Error fetching vendor permissions:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
