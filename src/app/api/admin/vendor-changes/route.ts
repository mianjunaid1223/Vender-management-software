import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { getDb } from '@/lib/data';
import { ObjectId } from 'mongodb';
import { createAuditLog } from '@/lib/audit';

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || (session.role !== 'company_admin' && session.role !== 'admin')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'all';
    const category = searchParams.get('category') || 'all';

    const db = await getDb();
    
    // Build query filter
    const query: any = { companyId: session.companyId };
    
    if (status !== 'all') {
      query.status = status;
    }
    
    if (category !== 'all') {
      query.category = category;
    }

    const pendingChanges = await db.collection('vendor_pending_changes').find(query)
      .sort({ submittedAt: -1 })
      .toArray();

    return NextResponse.json({
      changes: pendingChanges,
      summary: {
        total: pendingChanges.length,
        pending: pendingChanges.filter(c => c.status === 'pending').length,
        approved: pendingChanges.filter(c => c.status === 'approved').length,
        rejected: pendingChanges.filter(c => c.status === 'rejected').length
      }
    });

  } catch (error) {
    console.error('Error fetching pending changes:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || (session.role !== 'company_admin' && session.role !== 'admin')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { changeId, action, comments } = body;

    if (!changeId || !action || !['approve', 'reject'].includes(action)) {
      return NextResponse.json(
        { error: 'Change ID and valid action (approve/reject) are required' },
        { status: 400 }
      );
    }

    if (!ObjectId.isValid(changeId)) {
      return NextResponse.json(
        { error: 'Invalid changeId' },
        { status: 400 }
      );
    }

    const db = await getDb();

    // Get the pending change
    const pendingChange = await db.collection('vendor_pending_changes').findOne({
      _id: new ObjectId(changeId),
      companyId: session.companyId
    });

    if (!pendingChange) {
      return NextResponse.json(
        { error: 'Pending change not found' },
        { status: 404 }
      );
    }

    if (pendingChange.status !== 'pending') {
      return NextResponse.json(
        { error: 'Change has already been processed' },
        { status: 400 }
      );
    }

    const now = new Date();
    const newStatus = action === 'approve' ? 'approved' : 'rejected';

    // Update the pending change status - conditional update to prevent race conditions
    const reviewRes = await db.collection('vendor_pending_changes').updateOne(
      { _id: new ObjectId(changeId), status: 'pending' },
      {
        $set: {
          status: newStatus,
          reviewedBy: session.id,
          reviewedAt: now,
          reviewComments: comments,
          updatedAt: now
        }
      }
    );

    if (reviewRes.modifiedCount === 0) {
      return NextResponse.json(
        { error: 'Change has already been processed' },
        { status: 409 }
      );
    }

    // If approved, apply the changes to the main collection
    if (action === 'approve') {
      const { category, changeData, resourceId } = pendingChange;
      
      try {
        switch (category) {
          case 'invoice':
            if (pendingChange.changeType === 'create') {
              await db.collection('invoices').insertOne({
                ...changeData,
                companyId: session.companyId,
                createdBy: pendingChange.vendorId,
                createdAt: now,
                status: 'pending',
                approvedBy: session.id,
                approvedAt: now
              });
            } else if (pendingChange.changeType === 'edit') {
              const updateResult = await db.collection('invoices').updateOne(
                { _id: new ObjectId(resourceId) },
                { 
                  $set: {
                    ...changeData,
                    lastModifiedBy: pendingChange.vendorId,
                    lastModifiedAt: now,
                    approvedBy: session.id,
                    approvedAt: now
                  }
                }
              );
              if (updateResult.matchedCount === 0) {
                throw new Error('Invoice to edit not found');
              }
            }
            break;

          case 'contract':
            if (pendingChange.changeType === 'create') {
              await db.collection('contracts').insertOne({
                ...changeData,
                companyId: session.companyId,
                createdBy: pendingChange.vendorId,
                createdAt: now,
                status: 'draft',
                approvedBy: session.id,
                approvedAt: now
              });
            }
            break;

          case 'profile':
            const profileUpdateResult = await db.collection('vendors').updateOne(
              { vendorId: pendingChange.vendorId },
              {
                $set: {
                  ...changeData,
                  lastModifiedBy: pendingChange.vendorId,
                  lastModifiedAt: now,
                  approvedBy: session.id,
                  approvedAt: now
                }
              }
            );
            if (profileUpdateResult.matchedCount === 0) {
              throw new Error('Vendor profile not found');
            }
            break;

          case 'vendor':
            if (pendingChange.changeType === 'create') {
              await db.collection('vendors').insertOne({
                ...changeData,
                companyId: session.companyId,
                createdBy: pendingChange.vendorId,
                createdAt: now,
                approvedBy: session.id,
                approvedAt: now
              });
            }
            break;

          default:
            console.error(`Unsupported category: ${category}`, {
              changeId,
              category,
              changeType: pendingChange.changeType,
              vendorId: pendingChange.vendorId
            });
            throw new Error(`Unsupported change category: ${category}`);
        }

        console.log(`Applied ${category} ${pendingChange.changeType} change for vendor ${pendingChange.vendorId}`);
      } catch (applyError) {
        console.error('Error applying approved change:', applyError);
        // Revert the status change if applying failed
        await db.collection('vendor_pending_changes').updateOne(
          { _id: new ObjectId(changeId) },
          {
            $set: { status: 'pending' },
            $unset: { reviewedBy: 1, reviewedAt: 1, reviewComments: 1 }
          }
        );
        return NextResponse.json(
          { error: 'Failed to apply approved changes' },
          { status: 500 }
        );
      }
    }

    // Create audit log
    await createAuditLog({
      userId: session.id,
      userRole: session.role as any, // Type assertion for role compatibility
      companyId: session.companyId,
      vendorId: pendingChange.vendorId,
      action: action === 'approve' ? 'approve' : 'reject',
      resource: 'vendor_pending_change',
      resourceId: changeId,
      oldValues: { status: 'pending' },
      newValues: { status: newStatus, comments },
      ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown',
      sessionId: 'admin_' + Date.now(),
      metadata: {
        changeCategory: pendingChange.category,
        changeType: pendingChange.changeType
      }
    });

    return NextResponse.json({
      success: true,
      message: `Change ${action}d successfully`,
      change: {
        id: changeId,
        status: newStatus,
        reviewedBy: session.id,
        reviewedAt: now
      }
    });

  } catch (error) {
    console.error('Error processing vendor change:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
