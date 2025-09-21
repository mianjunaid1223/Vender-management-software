import { NextRequest, NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import { getDb } from '@/lib/data';
import { createAuditLog } from '@/lib/audit';

export async function POST(request: NextRequest) {
  try {
    const db = await getDb();
    
    // Load all companies that have vendorPortalAccess entries
    const companies = await db.collection('companies').find({
      vendorPortalAccess: { $exists: true }
    }).toArray();

    // Flatten and filter each company's access array for expired entries
    const expiredAccess: Array<any> = [];
    for (const company of companies) {
      const companyExpired = (company.vendorPortalAccess || [])
        .filter((access: any) =>
          access.enabled &&
          access.expiresAt &&
          new Date(access.expiresAt) < new Date()
        )
        .map((access: any) => ({
          ...access,
          companyId: company._id.toString(),
          company: company
        }));
      expiredAccess.push(...companyExpired);
    }

    const revokedCount = expiredAccess.length;
    const results = [];

    for (const access of expiredAccess) {
      try {
        // Revoke access using positional operator for atomic update
        await db.collection('companies').updateOne(
          {
            _id: access.company._id,
            'vendorPortalAccess.vendorId': access.vendorId
          },
          {
            $set: {
              'vendorPortalAccess.$.enabled': false,
              'vendorPortalAccess.$.accessRevokedAt': new Date(),
              'vendorPortalAccess.$.revokeReason': 'Access expired automatically',
              'vendorPortalAccess.$.updatedAt': new Date()
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
          newValues: { enabled: false, reason: 'Access expired automatically' },
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
    
    const now = new Date();
    const sevenDaysFromNow = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    
    // Check for access expiring soon (within 7 days)
    const companiesWithSoonToExpire = await db.collection('companies').find({
      'vendorPortalAccess': {
        $elemMatch: {
          enabled: true,
          expiresAt: { 
            $gte: now,
            $lte: sevenDaysFromNow
          }
        }
      }
    }).toArray();

    // Check already expired
    const companiesWithExpired = await db.collection('companies').find({
      'vendorPortalAccess': {
        $elemMatch: {
          enabled: true,
          expiresAt: { $lt: now }
        }
      }
    }).toArray();

    // Extract and count the actual access entries
    const soonToExpireEntries = [];
    const expiredEntries = [];

    for (const company of companiesWithSoonToExpire) {
      const soonToExpireAccess = company.vendorPortalAccess?.filter((access: any) => 
        access.enabled === true && 
        access.expiresAt && 
        new Date(access.expiresAt) >= now && 
        new Date(access.expiresAt) <= sevenDaysFromNow
      ) || [];

      soonToExpireEntries.push(...soonToExpireAccess.map((access: any) => ({
        vendorId: access.vendorId,
        companyId: company._id.toString(),
        expiresAt: access.expiresAt
      })));
    }

    for (const company of companiesWithExpired) {
      const expiredAccess = company.vendorPortalAccess?.filter((access: any) => 
        access.enabled === true && 
        access.expiresAt && 
        new Date(access.expiresAt) < now
      ) || [];

      expiredEntries.push(...expiredAccess.map((access: any) => ({
        vendorId: access.vendorId,
        companyId: company._id.toString(),
        expiresAt: access.expiresAt
      })));
    }

    return NextResponse.json({
      success: true,
      soonToExpire: soonToExpireEntries.length,
      expired: expiredEntries.length,
      details: {
        soonToExpire: soonToExpireEntries,
        expired: expiredEntries
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
