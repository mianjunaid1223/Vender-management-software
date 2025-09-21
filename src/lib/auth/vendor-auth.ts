import 'server-only';
import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { NextResponse } from 'next/server';
import { getDb } from '@/lib/data';
import { ObjectId } from 'mongodb';
import type { VendorUser, UserRole, VendorSession } from '@/lib/types/vendor-portal';
import { createAuditLog } from '@/lib/audit';

const secretKey = process.env.AUTH_SECRET;
const vendorSecretKey = process.env.VENDOR_AUTH_SECRET || process.env.AUTH_SECRET;

if (!secretKey) {
  throw new Error('AUTH_SECRET is required');
}

if (!vendorSecretKey) {
  throw new Error('VENDOR_AUTH_SECRET or AUTH_SECRET is required');
}

const key = new TextEncoder().encode(secretKey);
const vendorKey = new TextEncoder().encode(vendorSecretKey);

export const VENDOR_SESSION_TIMEOUT = 8 * 60 * 60 * 1000; // 8 hours in milliseconds
export const VENDOR_REFRESH_TIMEOUT = 7 * 24 * 60 * 60 * 1000; // 7 days

// === VENDOR AUTHENTICATION ===

export async function createVendorSession(userId: string, vendorId: string, companyId: string, ipAddress: string, userAgent: string): Promise<{ sessionToken: string; refreshToken: string }> {
  const db = await getDb();
  const now = new Date();
  const expiresAt = new Date(now.getTime() + VENDOR_SESSION_TIMEOUT);
  const refreshExpiresAt = new Date(now.getTime() + VENDOR_REFRESH_TIMEOUT);

  // Create session tokens
  const sessionData = {
    userId,
    vendorId,
    companyId,
    role: 'vendor_user' as UserRole,
    iat: Math.floor(now.getTime() / 1000),
    exp: Math.floor(expiresAt.getTime() / 1000),
  };

  const refreshData = {
    userId,
    vendorId,
    companyId,
    type: 'refresh',
    iat: Math.floor(now.getTime() / 1000),
    exp: Math.floor(refreshExpiresAt.getTime() / 1000),
  };

  const sessionToken = await new SignJWT(sessionData)
    .setProtectedHeader({ alg: 'HS256' })
    .sign(vendorKey);

  const refreshToken = await new SignJWT(refreshData)
    .setProtectedHeader({ alg: 'HS256' })
    .sign(vendorKey);

  // Store session in database
  const session: Omit<VendorSession, 'id'> = {
    userId,
    vendorId,
    companyId,
    sessionToken,
    refreshToken,
    expiresAt: expiresAt.toISOString(),
    refreshExpiresAt: refreshExpiresAt.toISOString(),
    ipAddress,
    userAgent,
    isActive: true,
    lastActivityAt: now.toISOString(),
    loginMethod: 'password',
    createdAt: now.toISOString(),
  };

  const { insertedId } = await db.collection('vendor_sessions').insertOne(session);

  // Create audit log
  await createAuditLog({
    userId,
    userRole: 'vendor_user',
    vendorId,
    companyId,
    action: 'login',
    resource: 'session',
    resourceId: insertedId.toString(),
    ipAddress,
    userAgent,
    sessionId: insertedId.toString(),
  });

  return { sessionToken, refreshToken };
}

export async function verifyVendorSession(sessionToken?: string): Promise<{ isAuth: boolean; userId?: string; vendorId?: string; companyId?: string }> {
  if (!sessionToken) {
    return { isAuth: false };
  }

  try {
    const { payload } = await jwtVerify(sessionToken, vendorKey);
    
    // Verify session is still active in database
    const db = await getDb();
    const session = await db.collection('vendor_sessions').findOne({
      sessionToken,
      isActive: true,
      expiresAt: { $gt: new Date().toISOString() }
    });

    if (!session) {
      return { isAuth: false };
    }

    // Update last activity
    await db.collection('vendor_sessions').updateOne(
      { sessionToken },
      { $set: { lastActivityAt: new Date().toISOString() } }
    );

    return {
      isAuth: true,
      userId: payload.userId as string,
      vendorId: payload.vendorId as string,
      companyId: payload.companyId as string,
    };
  } catch (error) {
    console.error('Vendor session verification failed:', error);
    return { isAuth: false };
  }
}

export async function getVendorSession(): Promise<VendorUser | null> {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get('vendor-session')?.value;

  const { isAuth, userId, vendorId, companyId } = await verifyVendorSession(sessionToken);
  if (!isAuth || !userId || !vendorId || !companyId) return null;

  try {
    const db = await getDb();
    
    if (!ObjectId.isValid(userId) || !ObjectId.isValid(companyId)) {
      return null;
    }
    
    // Get vendor user
    const vendorUser = await db.collection('vendor_users').findOne({
      _id: new ObjectId(userId),
      vendorId,
      isActive: true
    });

    if (!vendorUser) return null;

    // Check portal access in the company's vendorPortalAccess array
    const company = await db.collection('companies').findOne({
      _id: new ObjectId(companyId)
    });

    if (!company) {
      console.log('Company not found for vendor:', vendorId);
      return null;
    }

    // Find the vendor's portal access in the array
    const portalAccess = company.vendorPortalAccess?.find(
      (access: any) => access.vendorId === vendorId
    );

    if (!portalAccess || !portalAccess.enabled) {
      console.log('Portal access not found or disabled for vendor:', vendorId);
      return null;
    }

    // Check if access has expired
    if (portalAccess.expiresAt && new Date() > new Date(portalAccess.expiresAt)) {
      console.log('Portal access expired for vendor:', vendorId, 'Expired at:', portalAccess.expiresAt);
      
      // Auto-revoke expired access by updating the company's vendorPortalAccess array
      await db.collection('companies').updateOne(
        { _id: new ObjectId(companyId), 'vendorPortalAccess.vendorId': vendorId },
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
        notificationId: `notif_${Date.now()}_${vendorId}`,
        companyId,
        type: 'vendor_access_expired',
        title: 'Vendor Access Expired',
        message: `Portal access for vendor ${vendorId} has expired and been automatically revoked`,
        read: false,
        createdAt: new Date()
      });

      // Log the automatic revocation
      if (companyId) {
        await createAuditLog({
          userId: 'system',
          userRole: 'company_admin',
          companyId,
          vendorId,
          action: 'delete',
          resource: 'vendor_portal_access',
          resourceId: vendorId,
          newValues: { enabled: false, reason: 'Access expired automatically' },
          ipAddress: 'system',
          userAgent: 'system_auth_check',
          sessionId: 'system_' + Date.now(),
          metadata: { 
            expiredAt: portalAccess.expiresAt,
            automaticRevocation: true
          }
        });
      }

      return null;
    }

    const { _id, passwordHash, mfaSecret, ...userWithoutSensitiveData } = vendorUser;
    return JSON.parse(JSON.stringify({
      ...userWithoutSensitiveData,
      id: _id.toString(),
      vendorId,
      companyId,
    }));
  } catch (error) {
    console.error('Error fetching vendor session:', error);
    return null;
  }
}

export async function requireVendorAuth(redirectTo = '/vendor-portal'): Promise<VendorUser> {
  const session = await getVendorSession();
  if (!session) {
    // Check for session cookie to determine if user was logged in but access was revoked
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('vendor-session')?.value;
    
    if (sessionCookie) {
      // User had a session but access was denied - redirect with error (cookies will be cleared by logout API)
      redirect(`${redirectTo}?error=access_denied`);
    } else {
      // No session - normal redirect to login
      redirect(redirectTo);
    }
  }

  // TODO: Re-enable real-time portal access check after fixing redirect issues
  // Additional real-time portal access check
  // const portalAccess = await checkVendorPortalAccess(session.vendorId, session.companyId);
  // if (!portalAccess || !portalAccess.enabled) {
  //   // Portal access has been disabled - redirect to logout API to clear cookies
  //   redirect(`/api/vendor-portal/auth/logout?reason=access_revoked&redirect=${encodeURIComponent(redirectTo)}`);
  // }

  // // Check if access has expired
  // if (portalAccess.expiresAt && new Date() > new Date(portalAccess.expiresAt)) {
  //   // Portal access has expired - redirect to logout API to clear cookies
  //   redirect(`/api/vendor-portal/auth/logout?reason=access_expired&redirect=${encodeURIComponent(redirectTo)}`);
  // }

  return session;
}

export async function revokeVendorSession(sessionToken: string, reason: string = 'logout'): Promise<void> {
  const db = await getDb();
  
  // Get session info for audit log
  const session = await db.collection('vendor_sessions').findOne({ sessionToken });
  
  // Deactivate session
  await db.collection('vendor_sessions').updateOne(
    { sessionToken },
    { 
      $set: { 
        isActive: false,
        revokedAt: new Date().toISOString(),
        revokeReason: reason
      } 
    }
  );

  // Create audit log
  if (session) {
    await createAuditLog({
      userId: session.userId,
      userRole: 'vendor_user',
      vendorId: session.vendorId,
      companyId: session.companyId,
      action: 'logout',
      resource: 'session',
      resourceId: session._id.toString(),
      ipAddress: session.ipAddress,
      userAgent: session.userAgent,
      sessionId: session._id.toString(),
      metadata: { reason }
    });
  }
}

// === PORTAL ACCESS MANAGEMENT ===

export async function checkVendorPortalAccess(vendorId: string, companyId: string): Promise<any | null> {
  const db = await getDb();
  
  if (!ObjectId.isValid(companyId)) {
    return null;
  }
  
  // Get company and check portal access
  const company = await db.collection('companies').findOne({
    _id: new ObjectId(companyId)
  });

  if (!company) {
    return null;
  }

  // Find portal access for this vendor
  const access = company.vendorPortalAccess?.find(
    (access: any) => access.vendorId === vendorId
  );

  if (!access || !access.enabled) {
    return null;
  }

  return JSON.parse(JSON.stringify(access));
}

export async function hasVendorPermission(
  userId: string, 
  vendorId: string, 
  resource: string, 
  action: string
): Promise<boolean> {
  const db = await getDb();
  
  if (!ObjectId.isValid(userId)) {
    return false;
  }
  
  const user = await db.collection('vendor_users').findOne({
    _id: new ObjectId(userId),
    vendorId,
    isActive: true
  });

  if (!user) return false;

  // Check if user has permission for this resource and action
  const hasPermission = user.permissions?.some((permission: any) => 
    permission.resource === resource && 
    permission.actions.includes(action)
  );

  return hasPermission || false;
}

// === COMPANY MANAGEMENT OF VENDOR ACCESS ===

export async function enableVendorPortalAccess(
  vendorId: string,
  companyId: string,
  features: string[],
  adminUserId: string,
  options: {
    mfaRequired?: boolean;
    sessionTimeout?: number;
    restrictions?: any[];
  } = {}
): Promise<void> {
  const db = await getDb();
  const now = new Date().toISOString();

  if (!ObjectId.isValid(companyId)) {
    throw new Error('Invalid company ID');
  }

  const accessData = {
    vendorId,
    enabled: true,
    enabledAt: now,
    expiresAt: null, // Clear any expiration when re-enabling
    features: {
      // Legacy feature mappings
      viewInvoices: features.includes('view_invoices'),
      downloadInvoices: features.includes('download_invoices'),
      updatePaymentInfo: features.includes('update_payment_info'),
      viewContracts: features.includes('view_contracts'),
      communicateWithBuyer: features.includes('communicate_with_buyer') || features.includes('communication'),
      viewComplianceRequirements: features.includes('view_compliance_requirements') || features.includes('upload_compliance'),
      uploadDocuments: features.includes('upload_documents') || features.includes('upload_invoices'),
      
      // New comprehensive feature mappings
      invoiceManagement: features.includes('view_invoices') || features.includes('upload_invoices') || features.includes('download_invoices'),
      documentUpload: features.includes('upload_documents') || features.includes('upload_invoices') || features.includes('upload_compliance'),
      communicationTools: features.includes('communication') || features.includes('communicate_with_buyer'),
      complianceTracking: features.includes('view_compliance_requirements') || features.includes('upload_compliance'),
      paymentStatus: features.includes('view_payments') || features.includes('update_payment_info'),
      reporting: true, // Enable reporting by default
      profileManagement: features.includes('edit_profile'),
      
      // Granular permissions
      canViewInvoices: features.includes('view_invoices'),
      canDownloadInvoices: features.includes('download_invoices'),
      canUploadInvoices: features.includes('upload_invoices'),
      canViewContracts: features.includes('view_contracts'),
      canSignContracts: features.includes('sign_contracts'),
      canViewPayments: features.includes('view_payments'),
      canUpdatePaymentInfo: features.includes('update_payment_info'),
      canCommunicate: features.includes('communication') || features.includes('communicate_with_buyer'),
      canUploadCompliance: features.includes('upload_compliance'),
      canViewCompliance: features.includes('view_compliance_requirements'),
      canEditProfile: features.includes('edit_profile')
    },
    restrictions: options.restrictions || [],
    mfaRequired: options.mfaRequired || false,
    sessionTimeout: options.sessionTimeout || 480, // 8 hours
    lastLoginAt: null,
    loginAttempts: 0,
    lockedUntil: null,
    createdAt: now,
    updatedAt: now,
    createdBy: adminUserId,
    updatedBy: adminUserId,
  };

  // Remove existing access for this vendor and add new one
  await db.collection('companies').updateOne(
    { _id: new ObjectId(companyId) },
    { 
      $pull: { vendorPortalAccess: { vendorId: vendorId } }
    } as any
  );

  await db.collection('companies').updateOne(
    { _id: new ObjectId(companyId) },
    { 
      $push: { vendorPortalAccess: accessData }
    } as any
  );

  // Create audit log
  await createAuditLog({
    userId: adminUserId,
    userRole: 'company_admin',
    companyId,
    action: 'access_granted',
    resource: 'vendor_portal_access',
    resourceId: vendorId,
    newValues: { features, enabled: true },
    ipAddress: '',
    userAgent: '',
    sessionId: '',
    metadata: { vendorId }
  });
}

export async function disableVendorPortalAccess(
  vendorId: string,
  companyId: string,
  adminUserId: string,
  reason: string = 'disabled_by_admin'
): Promise<void> {
  const db = await getDb();
  const now = new Date().toISOString();

  if (!ObjectId.isValid(companyId)) {
    throw new Error('Invalid company ID');
  }

  // Disable access by updating the vendorPortalAccess array in the company
  await db.collection('companies').updateOne(
    { 
      _id: new ObjectId(companyId),
      "vendorPortalAccess.vendorId": vendorId
    },
    {
      $set: {
        "vendorPortalAccess.$.enabled": false,
        "vendorPortalAccess.$.disabledAt": now,
        "vendorPortalAccess.$.updatedAt": now,
        "vendorPortalAccess.$.updatedBy": adminUserId
      }
    } as any
  );

  // Revoke all active sessions
  const activeSessions = await db.collection('vendor_sessions').find({
    vendorId,
    companyId,
    isActive: true
  }).toArray();

  for (const session of activeSessions) {
    await revokeVendorSession(session.sessionToken, reason);
  }

  // Create audit log
  await createAuditLog({
    userId: adminUserId,
    userRole: 'company_admin',
    companyId,
    action: 'access_revoked',
    resource: 'vendor_portal_access',
    resourceId: vendorId,
    newValues: { enabled: false, reason },
    ipAddress: '',
    userAgent: '',
    sessionId: '',
    metadata: { vendorId, reason }
  });
}

// === MIDDLEWARE HELPERS ===

export async function getVendorSessionFromCookies(): Promise<{ isAuth: boolean; user?: VendorUser; session?: any }> {
  try {
    const user = await getVendorSession();
    if (!user) {
      return { isAuth: false };
    }

    return { isAuth: true, user };
  } catch (error) {
    return { isAuth: false };
  }
}
