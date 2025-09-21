import { NextRequest, NextResponse } from 'next/server';
import { enableVendorPortalAccess, disableVendorPortalAccess } from '@/lib/auth/vendor-auth';
import { getSession } from '@/lib/auth';
import { ObjectId } from 'mongodb';
import { getDb } from '@/lib/data';

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || (session.role !== 'company_admin' && session.role !== 'admin')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { vendorId, features, mfaRequired, sessionTimeout, restrictions } = body;

    if (!vendorId || !features) {
      return NextResponse.json(
        { error: 'Vendor ID and features are required' },
        { status: 400 }
      );
    }

    await enableVendorPortalAccess(
      vendorId,
      session.companyId,
      features,
      session.id,
      {
        mfaRequired,
        sessionTimeout,
        restrictions
      }
    );

    return NextResponse.json({
      success: true,
      message: 'Vendor portal access enabled successfully'
    });

  } catch (error) {
    console.error('Error enabling vendor portal access:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || (session.role !== 'company_admin' && session.role !== 'admin')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const vendorId = searchParams.get('vendorId');
    const reason = searchParams.get('reason') || 'disabled_by_admin';

    if (!vendorId) {
      return NextResponse.json(
        { error: 'Vendor ID is required' },
        { status: 400 }
      );
    }

    await disableVendorPortalAccess(
      vendorId,
      session.companyId,
      session.id,
      reason
    );

    return NextResponse.json({
      success: true,
      message: 'Vendor portal access disabled successfully'
    });

  } catch (error) {
    console.error('Error disabling vendor portal access:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    
    if (!session || (session.role !== 'company_admin' && session.role !== 'admin')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const vendorId = searchParams.get('vendorId');

    if (!vendorId) {
      return NextResponse.json(
        { error: 'Vendor ID is required' },
        { status: 400 }
      );
    }

    const db = await getDb();

    // Get the current portal access status from the company document
    const company = await db.collection('companies').findOne(
      { _id: new ObjectId(session.companyId) },
      { projection: { vendorPortalAccess: 1 } }
    );

    if (!company) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 });
    }

    // Find the vendor's portal access in the array
    const vendorAccess = company.vendorPortalAccess?.find((access: any) => access.vendorId === vendorId);

    if (!vendorAccess) {
      // No portal access configured, return default disabled state
      return NextResponse.json({
        enabled: false,
        features: [],
        mfaRequired: false,
        sessionTimeout: 480,
        lastLogin: null
      });
    }

    // Convert the database features object to an array of enabled feature IDs
    const enabledFeatures: string[] = [];
    const features = vendorAccess.features || {};

    // Map database feature flags to frontend feature IDs
    if (features.viewInvoices || features.canViewInvoices) enabledFeatures.push('view_invoices');
    if (features.downloadInvoices || features.canDownloadInvoices) enabledFeatures.push('download_invoices');
    if (features.uploadInvoices || features.canUploadInvoices) enabledFeatures.push('upload_invoices');
    if (features.editProfile || features.canEditProfile || features.profileManagement) enabledFeatures.push('edit_profile');
    if (features.viewContracts || features.canViewContracts) enabledFeatures.push('view_contracts');
    if (features.signContracts || features.canSignContracts) enabledFeatures.push('sign_contracts');
    if (features.uploadDocuments || features.documentUpload) enabledFeatures.push('upload_documents');
    if (features.manageVendors) enabledFeatures.push('manage_vendors');

    // Check if access has expired
    const isExpired = vendorAccess.expiresAt && new Date() > new Date(vendorAccess.expiresAt);

    const response = {
      enabled: vendorAccess.enabled || false,
      expired: isExpired || false,
      expiresAt: vendorAccess.expiresAt || null,
      features: enabledFeatures,
      mfaRequired: vendorAccess.mfaRequired || false,
      sessionTimeout: vendorAccess.sessionTimeout || 480,
      lastLogin: vendorAccess.lastLoginAt || null
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Error checking vendor portal status:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  } finally {
    // Database connection is handled by the getDb() function
  }
}
