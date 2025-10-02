import { NextRequest, NextResponse } from 'next/server';
import { getVendorSession } from '@/core/auth/vendor-auth';
import { getDb } from '@/shared/lib/data';
import { ObjectId } from 'mongodb';
import { createAuditLog } from '@/core/services/audit';

export async function POST(request: NextRequest) {
  try {
    const session = await getVendorSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let body;
    try {
      body = await request.json();
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid JSON body' },
        { status: 400 }
      );
    }
    
    const { category, changeType, changeData, resourceId, description } = body;

    // Validate required fields
    if (!category || !changeType || !changeData) {
      return NextResponse.json(
        { error: 'Category, change type, and change data are required' },
        { status: 400 }
      );
    }

    // Validate category and change type
    const validCategories = ['invoice', 'contract', 'profile', 'vendor', 'document'];
    const validChangeTypes = ['create', 'edit'];

    if (!validCategories.includes(category)) {
      return NextResponse.json(
        { error: 'Invalid category' },
        { status: 400 }
      );
    }

    if (!validChangeTypes.includes(changeType)) {
      return NextResponse.json(
        { error: 'Invalid change type' },
        { status: 400 }
      );
    }

    // For edit operations, resourceId is required and must be valid
    if (changeType === 'edit' && (!resourceId || !ObjectId.isValid(resourceId))) {
      return NextResponse.json(
        { error: 'Valid resourceId is required for edit operations' },
        { status: 400 }
      );
    }

    const db = await getDb();
    const now = new Date();

    // Check if vendor has permission for this type of change
    const company = await db.collection('companies').findOne({ _id: new ObjectId(session.companyId) });
    const portalAccess = company?.vendorPortalAccess?.find(
      (a: any) => a.vendorId === session.vendorId && a.enabled === true
    );
    if (!portalAccess) {
      return NextResponse.json(
        { error: 'Portal access not found or disabled' },
        { status: 403 }
      );
    }

    // Check specific feature permissions
    const hasPermission = checkFeaturePermission(category, changeType, portalAccess.features || {});
    if (!hasPermission) {
      return NextResponse.json(
        { error: 'You do not have permission for this type of change' },
        { status: 403 }
      );
    }

    // Create pending change record
    const pendingChange = {
      vendorId: session.vendorId,
      companyId: session.companyId,
      category,
      changeType,
      changeData,
      resourceId: resourceId
        ? (ObjectId.isValid(resourceId) ? new ObjectId(resourceId) : null)
        : null,
      description: description || `${changeType} ${category}`,
      status: 'pending',
      submittedBy: session.id,
      submittedAt: now,
      createdAt: now,
      updatedAt: now
    };

    // Get MongoDB client from connection
    const { getClient } = await import('@/shared/lib/data');
    const mongoClient = await getClient();
    const session_db = mongoClient.startSession();
    
    let result: any;
    try {
      await session_db.withTransaction(async () => {
        result = await db.collection('vendor_pending_changes').insertOne(pendingChange, { session: session_db });

        // Create audit log
        await createAuditLog({
          userId: session.id,
          userRole: 'vendor_user',
          companyId: session.companyId,
          vendorId: session.vendorId,
          action: 'create',
          resource: 'vendor_pending_change',
          resourceId: result.insertedId.toString(),
          newValues: { category, changeType, status: 'pending' },
          ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
          userAgent: request.headers.get('user-agent') || 'unknown',
          sessionId: 'vendor_' + Date.now(),
          metadata: {
            description,
            requiresApproval: true
          }
        });

        // Create notification for company admins
        await db.collection('notifications').insertOne({
          notificationId: `notif_${Date.now()}_${session.vendorId}`,
          companyId: session.companyId,
          type: 'vendor_change_submitted',
          title: 'Vendor Change Submitted',
          message: `${session.name || 'Vendor'} submitted a ${changeType} request for ${category}`,
          data: {
            changeId: result.insertedId.toString(),
            vendorId: session.vendorId,
            category,
            changeType
          },
          read: false,
          createdAt: now
        }, { session: session_db });
      });
    } finally {
      await session_db.endSession();
    }

    return NextResponse.json({
      success: true,
      message: 'Change submitted successfully and is pending approval',
      changeId: result.insertedId.toString(),
      status: 'pending'
    });

  } catch (error) {
    console.error('Error submitting vendor change:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

function checkFeaturePermission(category: string, changeType: string, features: any): boolean {
  const featureMap: Record<string, { create?: string, edit?: string, read?: string }> = {
    invoice: {
      create: 'uploadInvoices',
      read: 'viewInvoices'
    },
    contract: {
      create: 'createContracts',
      read: 'viewContracts'
    },
    profile: {
      edit: 'editProfile'
    },
    vendor: {
      create: 'manageVendors',
      edit: 'manageVendors'
    },
    document: {
      create: 'uploadDocuments'
    }
  };

  const categoryFeatures = featureMap[category];
  if (!categoryFeatures) return false;

  const requiredFeature = categoryFeatures[changeType as keyof typeof categoryFeatures];
  if (!requiredFeature) return false;

  return features[requiredFeature] === true;
}
