import 'server-only';
import { getDb } from '@/lib/data';
import type { AuditLog, AuditAction, UserRole } from '@/lib/types/vendor-portal';

// === IMMUTABLE AUDIT LOGGING ===

export async function createAuditLog(params: {
  userId: string;
  userRole: UserRole;
  vendorId?: string;
  companyId: string;
  action: AuditAction;
  resource: string;
  resourceId: string;
  oldValues?: Record<string, any>;
  newValues?: Record<string, any>;
  ipAddress: string;
  userAgent: string;
  sessionId: string;
  metadata?: Record<string, any>;
}): Promise<void> {
  try {
    const db = await getDb();
    
    const auditLog: Omit<AuditLog, 'id'> = {
      userId: params.userId,
      userRole: params.userRole,
      vendorId: params.vendorId,
      companyId: params.companyId,
      action: params.action,
      resource: params.resource,
      resourceId: params.resourceId,
      oldValues: params.oldValues,
      newValues: params.newValues,
      ipAddress: params.ipAddress,
      userAgent: params.userAgent,
      timestamp: new Date().toISOString(),
      sessionId: params.sessionId,
      metadata: params.metadata,
    };

    // Insert into immutable collection (no updates allowed)
    await db.collection('audit_logs').insertOne(auditLog);
    
  } catch (error) {
    console.error('Failed to create audit log:', error);
    // Don't throw - audit logging should not break the main operation
  }
}

export async function getAuditLogs(params: {
  companyId: string;
  vendorId?: string;
  userId?: string;
  resource?: string;
  action?: AuditAction;
  startDate?: string;
  endDate?: string;
  limit?: number;
  offset?: number;
}): Promise<AuditLog[]> {
  const db = await getDb();
  
  const filter: any = {
    companyId: params.companyId
  };

  if (params.vendorId) filter.vendorId = params.vendorId;
  if (params.userId) filter.userId = params.userId;
  if (params.resource) filter.resource = params.resource;
  if (params.action) filter.action = params.action;
  
  if (params.startDate || params.endDate) {
    filter.timestamp = {};
    if (params.startDate) filter.timestamp.$gte = params.startDate;
    if (params.endDate) filter.timestamp.$lte = params.endDate;
  }

  const logs = await db
    .collection('audit_logs')
    .find(filter)
    .sort({ timestamp: -1 })
    .limit(params.limit || 100)
    .skip(params.offset || 0)
    .toArray();

  return JSON.parse(JSON.stringify(logs.map(log => ({
    ...log,
    id: log._id.toString(),
  }))));
}

// === AUDIT TRAIL HELPERS ===

export async function trackDataChange<T>(
  operation: () => Promise<T>,
  auditParams: {
    userId: string;
    userRole: UserRole;
    vendorId?: string;
    companyId: string;
    action: AuditAction;
    resource: string;
    resourceId: string;
    ipAddress: string;
    userAgent: string;
    sessionId: string;
    metadata?: Record<string, any>;
  },
  oldValues?: Record<string, any>
): Promise<T> {
  const result = await operation();
  
  await createAuditLog({
    ...auditParams,
    oldValues,
    newValues: typeof result === 'object' ? result as Record<string, any> : undefined,
  });

  return result;
}

export async function createDataAccessLog(params: {
  userId: string;
  userRole: UserRole;
  vendorId?: string;
  companyId: string;
  resource: string;
  resourceId: string;
  ipAddress: string;
  userAgent: string;
  sessionId: string;
  query?: Record<string, any>;
}): Promise<void> {
  await createAuditLog({
    ...params,
    action: 'read',
    metadata: {
      query: params.query,
      accessTime: new Date().toISOString(),
    },
  });
}

// === AUDIT ANALYTICS ===

export async function getAuditSummary(params: {
  companyId: string;
  vendorId?: string;
  timeRange: 'day' | 'week' | 'month' | 'year';
}): Promise<{
  totalActions: number;
  actionsByType: Record<string, number>;
  userActivity: Record<string, number>;
  resourceAccess: Record<string, number>;
  riskEvents: number;
}> {
  const db = await getDb();
  
  const now = new Date();
  let startDate: Date;
  
  switch (params.timeRange) {
    case 'day':
      startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      break;
    case 'week':
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case 'month':
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      break;
    case 'year':
      startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
      break;
  }

  const filter: any = {
    companyId: params.companyId,
    timestamp: { $gte: startDate.toISOString() }
  };

  if (params.vendorId) {
    filter.vendorId = params.vendorId;
  }

  const pipeline = [
    { $match: filter },
    {
      $group: {
        _id: null,
        totalActions: { $sum: 1 },
        actionsByType: {
          $push: '$action'
        },
        userActivity: {
          $push: '$userId'
        },
        resourceAccess: {
          $push: '$resource'
        },
        riskEvents: {
          $sum: {
            $cond: [
              {
                $in: ['$action', ['login_failed', 'access_revoked', 'delete']]
              },
              1,
              0
            ]
          }
        }
      }
    }
  ];

  const [result] = await db.collection('audit_logs').aggregate(pipeline).toArray();
  
  if (!result) {
    return {
      totalActions: 0,
      actionsByType: {},
      userActivity: {},
      resourceAccess: {},
      riskEvents: 0
    };
  }

  // Count occurrences
  const actionCounts: Record<string, number> = {};
  result.actionsByType.forEach((action: string) => {
    actionCounts[action] = (actionCounts[action] || 0) + 1;
  });

  const userCounts: Record<string, number> = {};
  result.userActivity.forEach((userId: string) => {
    userCounts[userId] = (userCounts[userId] || 0) + 1;
  });

  const resourceCounts: Record<string, number> = {};
  result.resourceAccess.forEach((resource: string) => {
    resourceCounts[resource] = (resourceCounts[resource] || 0) + 1;
  });

  return {
    totalActions: result.totalActions,
    actionsByType: actionCounts,
    userActivity: userCounts,
    resourceAccess: resourceCounts,
    riskEvents: result.riskEvents
  };
}
