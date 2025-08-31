import { connectDB } from '@/lib/database/mongodb';
import AuditLog, { IAuditLog } from '@/models/auditLog.model';
import mongoose from 'mongoose';

// Define the structure of the data passed to the logging function
type LogData = {
  tenantId: mongoose.Types.ObjectId;
  actorId?: mongoose.Types.ObjectId;
  actorType?: 'USER' | 'VENDOR' | 'SYSTEM';
  entityType: string;
  entityId: mongoose.Types.ObjectId;
  action: string;
  details?: Record<string, any>;
  beforeState?: Record<string, any>;
  afterState?: Record<string, any>;
};

/**
 * Creates an audit log entry in the database.
 * @param logData The data for the audit log entry.
 */
export async function logAudit(logData: LogData): Promise<void> {
  try {
    await connectDB();

    const auditLogEntry = new AuditLog({
      ...logData,
      timestamp: new Date(), // Set the timestamp upon creation
    });

    await auditLogEntry.save();
  } catch (error) {
    console.error('Failed to write to audit log:', error);
    // We console.error but do not throw, as a logging failure
    // should not typically cause the parent operation (e.g., updating a contract) to fail.
  }
}

// We can keep a query function for future use, but implement it properly.
export async function queryLogs(tenantId: mongoose.Types.ObjectId, filters: any = {}) {
  try {
    await connectDB();
    const logs = await AuditLog.find({ tenantId, ...filters }).sort({ timestamp: -1 }).limit(100);
    return logs;
  } catch (error) {
    console.error('Failed to query audit logs:', error);
    return [];
  }
}
