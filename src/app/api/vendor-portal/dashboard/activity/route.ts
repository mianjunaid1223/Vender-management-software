import { NextRequest, NextResponse } from 'next/server';
import { getVendorSession } from '@/core/auth/vendor-auth';
import { getDb } from '@/shared/lib/data';
import type { AuditLog } from '@/shared/types/vendor-portal';
import { PAGINATION } from '@/config/constants';

export async function GET(request: NextRequest) {
  try {
    const vendorSession = await getVendorSession();
    
    if (!vendorSession) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const limitParam = searchParams.get('limit');
    const limit = Math.min(Math.max(parseInt(limitParam || PAGINATION.DEFAULT_LIMIT.toString(), 10) || PAGINATION.DEFAULT_LIMIT, 1), PAGINATION.MAX_LIMIT);

    const db = await getDb();

    // Get recent audit logs for this vendor with proper company scoping and field names
    const filter = {
      companyId: vendorSession.companyId,
      $or: [
        { vendorId: vendorSession.vendorId },
        { userId: vendorSession.id }
      ],
      userRole: 'vendor'
    };
    const recentActivity = await db
      .collection('audit_logs')
      .find(filter, { projection: { action: 1, resource: 1, targetType: 1, details: 1, timestamp: 1, createdAt: 1 } })
      .sort({ timestamp: -1 })
      .limit(limit)
      .toArray();

    // Format activity for display
    const formattedActivity = recentActivity.map(log => ({
      id: log._id.toString(),
      action: log.action,
      resource: log.resource || log.targetType,
      description: formatActivityDescription(log),
      timestamp: log.timestamp || log.createdAt,
      type: getActivityType(log.action)
    }));

    return NextResponse.json(formattedActivity);

  } catch (error) {
    console.error('Error fetching vendor dashboard activity:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

function formatActivityDescription(log: Record<string, any>): string {
  const details = log.details || log.metadata || {};
  
  switch (log.action) {
    case 'login':
      return 'Logged into vendor portal';
    case 'logout':
      return 'Logged out of vendor portal';
    case 'upload':
    case 'invoice_uploaded':
      return `Uploaded invoice ${details.invoiceNumber || 'N/A'}`;
    case 'sign':
    case 'contract_signed':
      return `Signed contract: ${details.contractTitle || 'Unknown'}`;
    case 'update':
    case 'profile_updated':
      return 'Updated profile information';
    case 'payment_received':
      return `Payment received: ${details.amount ? `$${details.amount}` : 'N/A'}`;
    case 'document_uploaded':
      return `Uploaded document: ${details.fileName || 'Unknown'}`;
    case 'read':
      return `Viewed ${log.resource || log.targetType || 'item'}`;
    case 'create':
      return `Created ${log.resource || log.targetType || 'item'}`;
    case 'delete':
      return `Deleted ${log.resource || log.targetType || 'item'}`;
    case 'download':
      return `Downloaded ${log.resource || log.targetType || 'item'}`;
    default:
      return `Performed ${log.action} action`;
  }
}

function getActivityType(action: string): string {
  if (!action) return 'general';
  
  if (action.includes('invoice')) return 'invoice';
  if (action.includes('contract')) return 'contract';
  if (action.includes('payment')) return 'payment';
  if (action.includes('profile')) return 'profile';
  
  switch (action) {
    case 'login':
    case 'logout':
      return 'auth';
    case 'read':
    case 'download':
      return 'view';
    case 'update':
    case 'create':
      return 'edit';
    default:
      return 'general';
  }
}
