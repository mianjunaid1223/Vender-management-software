import { NextRequest, NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
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

    // Validate companyId format
    if (!ObjectId.isValid(companyId)) {
      return NextResponse.json(
        { error: 'Invalid Company ID format' },
        { status: 400 }
      );
    }

    // Validate vendorId format
    if (typeof vendorId !== 'string' || !vendorId.trim()) {
      return NextResponse.json(
        { error: 'Invalid Vendor ID format' },
        { status: 400 }
      );
    }

    const db = await getDb();
    const reasonToUse = (reason ?? '').trim() || 'Admin revoked access';
    const revokedAt = new Date();
    
    // Update the companies collection's vendorPortalAccess array
    const updateResult = await db.collection('companies').updateOne(
      {
        _id: new ObjectId(companyId),
        'vendorPortalAccess.vendorId': vendorId,
        'vendorPortalAccess.enabled': true // Only update if currently enabled
      },
      {
        $set: {
          'vendorPortalAccess.$.enabled': false,
          'vendorPortalAccess.$.accessRevokedAt': revokedAt,
          'vendorPortalAccess.$.revokeReason': reasonToUse,
          'vendorPortalAccess.$.updatedAt': revokedAt
        }
      }
    );

    if (updateResult.matchedCount === 0) {
      // Check if the vendor access exists but is already disabled
      const company = await db.collection('companies').findOne({
        _id: new ObjectId(companyId),
        'vendorPortalAccess.vendorId': vendorId
      });

      if (!company) {
        return NextResponse.json(
          { error: 'Vendor portal access not found' },
          { status: 404 }
        );
      } else {
        // Access exists but already disabled - treat as success (idempotent)
        return NextResponse.json({
          success: true,
          message: 'Vendor portal access was already revoked'
        });
      }
    }

    // Create notification for company
    await db.collection('notifications').insertOne({
      notificationId: `notif_${Date.now()}`,
      companyId: companyId,
      type: 'vendor_access_revoked',
      title: 'Vendor Access Revoked',
      message: `Portal access for vendor ${vendorId} has been revoked due to: ${reasonToUse}`,
      read: false,
      createdAt: revokedAt
    });

    // Log the access revocation
    await createAuditLog({
      userId: 'system', // TODO: Replace with actual admin user ID when auth is implemented
      userRole: 'company_admin',
      companyId: companyId,
      vendorId,
      action: 'delete',
      resource: 'vendor_portal_access',
      resourceId: vendorId,
      newValues: { enabled: false, reason: reasonToUse },
      ipAddress: request.headers.get('x-forwarded-for') || 'system',
      userAgent: request.headers.get('user-agent') || 'system',
      sessionId: 'system_' + Date.now(), // TODO: Replace with actual session ID when auth is implemented
      metadata: { 
        reason: reasonToUse,
        revokedAt: revokedAt.toISOString()
      }
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
