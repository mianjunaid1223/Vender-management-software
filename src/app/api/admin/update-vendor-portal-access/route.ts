import { NextRequest, NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import { getDb } from '@/lib/data';
import { getSession } from '@/lib/auth';
import { createAuditLog } from '@/lib/audit';
import type { VendorPortalAccess } from '@/lib/types/vendor-portal';

export async function POST(request: NextRequest) {
  try {
    // Authentication check
    const session = await getSession();
    if (!session || (session.role !== 'company_admin' && session.role !== 'admin')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { companyId, vendorId, features } = await request.json();

    // Input validation
    if (!companyId || !vendorId) {
      return NextResponse.json({ error: 'Company ID and Vendor ID are required' }, { status: 400 });
    }

    // Validate ObjectIds
    if (!ObjectId.isValid(companyId) || !ObjectId.isValid(vendorId)) {
      return NextResponse.json(
        { error: 'Invalid Company ID or Vendor ID format' },
        { status: 400 }
      );
    }

    const db = await getDb();

    // Default features matching the canonical feature set
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
    let finalFeatures: Record<string, boolean>;
    
    if (features) {
      // Filter and validate provided features
      finalFeatures = {};
      Object.entries(features).forEach(([key, value]) => {
        if (allowedFeatureKeys.includes(key)) {
          finalFeatures[key] = Boolean(value);
        }
      });
    } else {
      finalFeatures = { ...defaultFeatures };
    }

    // Try to update existing array element first
    const updateExisting = await db.collection('companies').updateOne(
      { 
        _id: new ObjectId(companyId), 
        'vendorPortalAccess.vendorId': vendorId 
      },
      {
        $set: {
          'vendorPortalAccess.$.enabled': true,
          'vendorPortalAccess.$.features': finalFeatures,
          'vendorPortalAccess.$.enabledAt': new Date().toISOString(),
          'vendorPortalAccess.$.enabledBy': session.role === 'admin' ? 'admin' : session.id,
          'vendorPortalAccess.$.updatedAt': new Date().toISOString()
        }
      }
    );

    // If no existing entry found, push new entry to array
    if (updateExisting.matchedCount === 0) {
      await db.collection('companies').updateOne(
        { _id: new ObjectId(companyId) },
        {
          $push: {
            vendorPortalAccess: {
              vendorId,
              enabled: true,
              features: finalFeatures,
              sessionTimeout: 8,
              requireMFA: false,
              allowedIPs: [],
              enabledAt: new Date().toISOString(),
              enabledBy: session.role === 'admin' ? 'admin' : session.id,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            }
          }
        } as any  // Type assertion to handle MongoDB typing
      );
    }

    // Verify the update by finding the specific entry
    const company = await db.collection('companies').findOne(
      { _id: new ObjectId(companyId) },
      { projection: { vendorPortalAccess: 1, name: 1 } }
    );

    const portalAccess = company?.vendorPortalAccess?.find((access: VendorPortalAccess) => access.vendorId === vendorId);

    // Create audit log
    await createAuditLog({
      userId: session.id,
      userRole: session.role as any, // Type assertion for role compatibility
      vendorId: vendorId,
      companyId: companyId,
      action: updateExisting.matchedCount > 0 ? 'update' : 'create',
      resource: 'vendor_portal_access',
      resourceId: vendorId,
      newValues: {
        features: finalFeatures,
        enabled: true,
        sessionTimeout: 8,
        requireMFA: false
      },
      ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown',
      sessionId: session.id,
      metadata: {
        action: updateExisting.matchedCount > 0 ? 'update' : 'create'
      }
    });

    return NextResponse.json({
      success: true,
      message: `Vendor portal access ${updateExisting.matchedCount > 0 ? 'updated' : 'created'} successfully`,
      portalAccess: portalAccess || null
    });

  } catch (error) {
    console.error('Error updating vendor portal access:', error);
    return NextResponse.json({ error: 'Failed to update portal access' }, { status: 500 });
  }
}
