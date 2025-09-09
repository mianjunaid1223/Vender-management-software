import { NextRequest, NextResponse } from 'next/server';
import { getVendorSession } from '@/lib/auth/vendor-auth';
import { getDb } from '@/lib/data';

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
    const limit = parseInt(searchParams.get('limit') || '10');

    const db = await getDb();

    // Get recent audit logs for this vendor using different possible field names
    const recentActivity = await db.collection('audit_logs').find({
      $or: [
        { vendorId: vendorSession.vendorId },
        { userId: vendorSession.id },
        { userId: vendorSession.vendorId }
      ],
      userType: { $in: ['vendor', undefined] }
    })
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

function formatActivityDescription(log: any): string {
  const details = log.details || {};
  
  switch (log.action) {
    case 'login':
      return 'Logged into vendor portal';
    case 'logout':
      return 'Logged out of vendor portal';
    case 'invoice_uploaded':
      return `Uploaded invoice ${details.invoiceNumber || 'N/A'}`;
    case 'contract_signed':
      return `Signed contract: ${details.contractTitle || 'Unknown'}`;
    case 'profile_updated':
      return 'Updated profile information';
    case 'payment_received':
      return `Payment received for ${details.invoiceNumber || 'invoice'}`;
    case 'document_uploaded':
      return `Uploaded document: ${details.fileName || 'Unknown'}`;
    case 'read':
      return `Viewed ${log.resource || log.targetType}`;
    case 'update':
      return `Updated ${log.resource || log.targetType}`;
    case 'download':
      return `Downloaded ${log.resource || log.targetType}`;
    default:
      return log.action ? log.action.replace(/_/g, ' ').replace(/\b\w/g, (letter: string) => letter.toUpperCase()) : 'Unknown activity';
  }
}

function getActivityType(action: string): string {
  if (!action) return 'general';
  
  if (action.includes('invoice')) return 'invoice';
  if (action.includes('contract')) return 'contract';
  if (action.includes('payment')) return 'payment';
  if (action.includes('profile') || action.includes('update')) return 'profile';
  
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
