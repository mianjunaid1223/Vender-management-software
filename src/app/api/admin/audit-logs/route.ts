import { NextRequest, NextResponse } from 'next/server';
import { getAuditLogs, getAuditSummary } from '@/lib/audit';
import { getSession } from '@/lib/auth';

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
    const action = searchParams.get('action');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const limit = parseInt(searchParams.get('limit') || '100');
    const offset = parseInt(searchParams.get('offset') || '0');
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
      action: action as any,
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
