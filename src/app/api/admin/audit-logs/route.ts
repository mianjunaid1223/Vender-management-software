import { NextRequest, NextResponse } from 'next/server';
import { getAuditLogs, getAuditSummary } from '@/core/services/audit';
import { getSession } from '@/core/auth/auth';
import type { AuditAction } from '@/shared/types/vendor-portal';
import { PAGINATION } from '@/config/constants';

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || (session.role !== 'company_admin' && session.role !== 'admin')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'logs';
    const vendorId = searchParams.get('vendorId');
    const userId = searchParams.get('userId');
    const resource = searchParams.get('resource');
    const action = searchParams.get('action') as AuditAction | null;
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    
    // Validate and sanitize numeric inputs
    const limitParam = searchParams.get('limit');
    const offsetParam = searchParams.get('offset');
    const limit = Math.min(Math.max(parseInt(limitParam || PAGINATION.AUDIT_LOG_LIMIT.toString(), 10) || PAGINATION.AUDIT_LOG_LIMIT, 1), PAGINATION.AUDIT_LOG_MAX_LIMIT);
    const offset = Math.max(parseInt(offsetParam || '0', 10) || 0, 0);
    
    const timeRange = searchParams.get('timeRange') as 'day' | 'week' | 'month' | 'year' || 'week';

    if (type === 'summary') {
      const summary = await getAuditSummary({
        companyId: session.companyId,
        vendorId: vendorId || undefined,
        timeRange
      });
      
      return NextResponse.json(summary);
    }

    const logs = await getAuditLogs({
      companyId: session.companyId,
      vendorId: vendorId || undefined,
      userId: userId || undefined,
      resource: resource || undefined,
      action: action || undefined,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
      limit,
      offset
    });

    return NextResponse.json(logs);

  } catch (error) {
    console.error('Error fetching audit logs:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
