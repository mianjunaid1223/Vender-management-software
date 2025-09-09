import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/data';
import { createAuditLog } from '@/lib/audit';

export async function POST(request: NextRequest) {
  try {
    const db = await getDb();
    
    // Find all expired vendor portal access
    const expiredAccess = await db.collection('vendorPortalAccess').find({
      portalAccess: true,
      expiresAt: { $lt: new Date() }
    }).toArray();

    const revokedCount = expiredAccess.length;
    const results = [];

    for (const access of expiredAccess) {
      try {
        // Revoke access
        await db.collection('vendorPortalAccess').updateOne(
          { _id: access._id },
          { 
            $set: { 
              portalAccess: false,
              accessRevokedAt: new Date(),
              revokeReason: 'Access expired automatically',
              updatedAt: new Date()
            }
          }
        );

        // Create notification for company
        await db.collection('notifications').insertOne({
          notificationId: `notif_${Date.now()}_${access.vendorId}`,
          companyId: access.companyId,
          type: 'vendor_access_expired',
          title: 'Vendor Access Expired',
          message: `Portal access for vendor ${access.vendorId} has expired and been automatically revoked`,
          read: false,
          createdAt: new Date()
        });

        // Log the automatic revocation
        await createAuditLog({
          userId: 'system',
          userRole: 'company_admin',
          companyId: access.companyId,
          vendorId: access.vendorId,
          action: 'delete',
          resource: 'vendor_portal_access',
          resourceId: access.vendorId,
          newValues: { portalAccess: false, reason: 'Access expired automatically' },
          ipAddress: 'system',
          userAgent: 'system_cron',
          sessionId: 'system_' + Date.now(),
          metadata: { 
            expiredAt: access.expiresAt,
            automaticRevocation: true
          }
        });

        results.push({
          vendorId: access.vendorId,
          companyId: access.companyId,
          success: true
        });

        // TODO: Send email notifications to both vendor and company
        // This would integrate with your email service

      } catch (error) {
        console.error(`Error revoking access for vendor ${access.vendorId}:`, error);
        results.push({
          vendorId: access.vendorId,
          companyId: access.companyId,
          success: false,
          error: typeof error === 'object' && error !== null && 'message' in error ? (error as { message: string }).message : String(error)
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: `Processed ${revokedCount} expired vendor access records`,
      revokedCount,
      results
    });

  } catch (error) {
    console.error('Error checking expired vendor access:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const db = await getDb();
    
    // Check for access expiring soon (within 7 days)
    const soonToExpire = await db.collection('vendorPortalAccess').find({
      portalAccess: true,
      expiresAt: { 
        $gte: new Date(),
        $lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      }
    }).toArray();

    // Check already expired
    const expired = await db.collection('vendorPortalAccess').find({
      portalAccess: true,
      expiresAt: { $lt: new Date() }
    }).toArray();

    return NextResponse.json({
      success: true,
      soonToExpire: soonToExpire.length,
      expired: expired.length,
      details: {
        soonToExpire: soonToExpire.map(a => ({
          vendorId: a.vendorId,
          companyId: a.companyId,
          expiresAt: a.expiresAt
        })),
        expired: expired.map(a => ({
          vendorId: a.vendorId,
          companyId: a.companyId,
          expiresAt: a.expiresAt
        }))
      }
    });

  } catch (error) {
    console.error('Error checking vendor access status:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
