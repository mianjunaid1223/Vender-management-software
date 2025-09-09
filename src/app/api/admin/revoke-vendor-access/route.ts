import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/data';
import { createAuditLog } from '@/lib/audit';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { companyId, vendorId, reason } = body;

    if (!companyId || !vendorId) {
      return NextResponse.json(
        { error: 'Company ID and Vendor ID are required' },
        { status: 400 }
      );
    }

    const db = await getDb();
    
    // Revoke portal access
    const updateResult = await db.collection('vendorPortalAccess').updateOne(
      { 
        companyId, 
        vendorId 
      },
      { 
        $set: { 
          portalAccess: false,
          accessRevokedAt: new Date(),
          revokeReason: reason || 'Access expired',
          updatedAt: new Date()
        }
      }
    );

    if (updateResult.matchedCount === 0) {
      return NextResponse.json(
        { error: 'Vendor portal access not found' },
        { status: 404 }
      );
    }

    // Create notification for company
    await db.collection('notifications').insertOne({
      notificationId: `notif_${Date.now()}`,
      companyId,
      type: 'vendor_access_revoked',
      title: 'Vendor Access Revoked',
      message: `Portal access for vendor ${vendorId} has been revoked due to: ${reason || 'Access expired'}`,
      read: false,
      createdAt: new Date()
    });

    // Log the access revocation
    await createAuditLog({
      userId: 'system',
      userRole: 'company_admin',
      companyId,
      vendorId,
      action: 'delete',
      resource: 'vendor_portal_access',
      resourceId: vendorId,
      newValues: { portalAccess: false, reason: reason || 'Access expired' },
      ipAddress: request.headers.get('x-forwarded-for') || 'system',
      userAgent: 'system',
      sessionId: 'system_' + Date.now(),
      metadata: { reason: reason || 'Access expired' }
    });

    // TODO: Send email notifications here
    // This would integrate with your email service
    
    return NextResponse.json({
      success: true,
      message: 'Vendor portal access revoked successfully'
    });

  } catch (error) {
    console.error('Error revoking vendor access:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
