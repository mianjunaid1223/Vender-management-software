import { NextRequest, NextResponse } from 'next/server';
import { getVendorSession } from '@/lib/auth/vendor-auth';
import { getDb } from '@/lib/data';
import { ObjectId } from 'mongodb';

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
    const permissions = {
      profile_management: {
        read: vendorAccess.features?.profileManagement?.read || false,
        edit: vendorAccess.features?.profileManagement?.edit || false,
        create: vendorAccess.features?.profileManagement?.create || false
      },
      company_information: {
        read: vendorAccess.features?.companyInformation?.read || false,
        edit: vendorAccess.features?.companyInformation?.edit || false,
        create: vendorAccess.features?.companyInformation?.create || false
      },
      vendor_management: {
        read: vendorAccess.features?.vendorManagement?.read || false,
        edit: vendorAccess.features?.vendorManagement?.edit || false,
        create: vendorAccess.features?.vendorManagement?.create || false
      },
      contract_management: {
        read: vendorAccess.features?.contractManagement?.read || false,
        edit: vendorAccess.features?.contractManagement?.edit || false,
        create: vendorAccess.features?.contractManagement?.create || false
      },
      invoice_management: {
        read: vendorAccess.features?.invoiceManagement?.read || false,
        edit: vendorAccess.features?.invoiceManagement?.edit || false,
        create: vendorAccess.features?.invoiceManagement?.create || false
      },
      contact_management: {
        read: vendorAccess.features?.contactManagement?.read || false,
        edit: vendorAccess.features?.contactManagement?.edit || false,
        create: vendorAccess.features?.contactManagement?.create || false
      },
      document_management: {
        read: vendorAccess.features?.documentManagement?.read || false,
        edit: vendorAccess.features?.documentManagement?.edit || false,
        create: vendorAccess.features?.documentManagement?.create || false
      },
      reports: {
        read: vendorAccess.features?.reports?.read || false,
        edit: vendorAccess.features?.reports?.edit || false,
        create: vendorAccess.features?.reports?.create || false
      }
    };

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
