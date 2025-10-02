import { NextRequest, NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import { getDb } from '@/shared/lib/data';
import { createAuditLog } from '@/core/services/audit';
import { getSession } from '@/core/auth/auth';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { companyId, vendorId, expiresAt, features } = body;

    // Authentication and authorization check
    const session = await getSession();
    if (!session || (session.role !== 'admin' && session.role !== 'company_admin')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

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

    // Calculate and validate expiration date (default 90 days if not provided)
    const expirationDate = expiresAt ? new Date(expiresAt) : new Date(Date.now() + 90 * 24 * 60 * 60 * 1000);
    if (isNaN(expirationDate.getTime())) {
      return NextResponse.json(
        { error: 'Invalid expiresAt date format' },
        { status: 400 }
      );
    }

    const db = await getDb();
    
    // Validate that the company exists
    const company = await db.collection('companies').findOne({
      _id: new ObjectId(companyId)
    });

    if (!company) {
      return NextResponse.json(
        { error: 'Company not found' },
        { status: 404 }
      );
    }
    
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

    // Validate and filter features to prevent privilege escalation
    const allowedFeatureKeys = Object.keys(defaultFeatures);
    const validatedFeatures = 
      features && typeof features === 'object'
        ? Object.fromEntries(
            Object.entries(features).filter(([k]) =>
              allowedFeatureKeys.includes(k as string)
            )
          )
        : defaultFeatures;
    
    // Try to update existing portal access entry using positional operator
    const updateResult = await db.collection('companies').updateOne(
      { 
        _id: new ObjectId(companyId),
        'vendorPortalAccess.vendorId': vendorId
      },
      { 
        $set: { 
          'vendorPortalAccess.$.enabled': true,
          'vendorPortalAccess.$.expiresAt': expirationDate,
          'vendorPortalAccess.$.features': validatedFeatures,
          'vendorPortalAccess.$.accessRevokedAt': null,
          'vendorPortalAccess.$.revokeReason': null,
          'vendorPortalAccess.$.accessGrantedAt': new Date(),
          'vendorPortalAccess.$.updatedAt': new Date()
        }
      }
    );

    // If no existing access was found, create a new entry
    if (updateResult.matchedCount === 0) {
      const newAccess = {
        vendorId,
        enabled: true,
        expiresAt: expirationDate,
        features: validatedFeatures,
        sessionTimeout: 480, // 8 hours in minutes
        requireMFA: false,
        allowedIPs: [],
        accessRevokedAt: null,
        revokeReason: null,
        accessGrantedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      };

      await db.collection('companies').updateOne(
        { _id: new ObjectId(companyId) },
        { $addToSet: { vendorPortalAccess: newAccess } }
      );
    }

    // Create notification for company
    await db.collection('notifications').insertOne({
      notificationId: `notif_${Date.now()}`,
      companyId: companyId,
      type: 'vendor_access_granted',
      title: 'Vendor Access Granted',
      message: `Portal access for vendor ${vendorId} has been granted until ${expirationDate.toLocaleDateString()}`,
      read: false,
      createdAt: new Date()
    });

    // Log the access grant
    await createAuditLog({
      userId: 'system', // TODO: Replace with actual admin user ID when auth is implemented
      userRole: 'company_admin',
      companyId: companyId,
      vendorId,
      action: 'create',
      resource: 'vendor_portal_access',
      resourceId: vendorId,
      newValues: { 
        enabled: true, 
        expiresAt: expirationDate,
        features: validatedFeatures
      },
      ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown',
      sessionId: 'system_' + Date.now(), // TODO: Replace with actual session ID when auth is implemented
      metadata: { expirationDate: expirationDate.toISOString() }
    });

    // TODO: Send email notifications here
    // This would integrate with your email service
    
    return NextResponse.json({
      success: true,
      message: 'Vendor portal access granted successfully',
      expiresAt: expirationDate.toISOString()
    });

  } catch (error) {
    console.error('Error granting vendor access:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
