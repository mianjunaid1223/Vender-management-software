import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/data';
import { createAuditLog } from '@/lib/audit';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { companyId, vendorId, expiresAt, features } = body;

    if (!companyId || !vendorId) {
      return NextResponse.json(
        { error: 'Company ID and Vendor ID are required' },
        { status: 400 }
      );
    }

    const db = await getDb();
    
    // Calculate expiration date (default 90 days if not provided)
    const expirationDate = expiresAt ? new Date(expiresAt) : new Date(Date.now() + 90 * 24 * 60 * 60 * 1000);
    
    // Default features if not provided
    const defaultFeatures = {
      viewInvoices: true,
      downloadInvoices: true,
      uploadInvoices: true,
      editProfile: true,
      viewContracts: true,
      signContracts: true,
      uploadCompliance: true,
      viewPayments: true,
      updatePaymentInfo: true,
      communication: true,
      communicateWithBuyer: true,
      uploadDocuments: true,
      viewComplianceRequirements: true
    };
    
    // Re-grant portal access
    const updateResult = await db.collection('vendorPortalAccess').updateOne(
      { 
        companyId, 
        vendorId 
      },
      { 
        $set: { 
          portalAccess: true,
          expiresAt: expirationDate,
          features: features || defaultFeatures,
          accessRevokedAt: null,
          revokeReason: null,
          accessGrantedAt: new Date(),
          updatedAt: new Date()
        }
      },
      { upsert: true }
    );

    // Create notification for company
    await db.collection('notifications').insertOne({
      notificationId: `notif_${Date.now()}`,
      companyId,
      type: 'vendor_access_granted',
      title: 'Vendor Access Granted',
      message: `Portal access for vendor ${vendorId} has been granted until ${expirationDate.toLocaleDateString()}`,
      read: false,
      createdAt: new Date()
    });

    // Log the access grant
    await createAuditLog({
      userId: 'admin',
      userRole: 'company_admin',
      companyId,
      vendorId,
      action: 'create',
      resource: 'vendor_portal_access',
      resourceId: vendorId,
      newValues: { 
        portalAccess: true, 
        expiresAt: expirationDate,
        features: features || defaultFeatures
      },
      ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown',
      sessionId: 'admin_' + Date.now(),
      metadata: { expirationDate: expirationDate.toISOString() }
    });

    // TODO: Send email notifications here
    // This would integrate with your email service
    
    return NextResponse.json({
      success: true,
      message: 'Vendor portal access granted successfully',
      expiresAt: expirationDate
    });

  } catch (error) {
    console.error('Error granting vendor access:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
