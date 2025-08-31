import mongoose, { Schema, Document } from 'mongoose';
import { ITenant } from './tenant.model';

export interface IAuditLog extends Document {
  tenantId: ITenant['_id'];
  actorId?: mongoose.Schema.Types.ObjectId;
  actorType?: 'USER' | 'VENDOR' | 'SYSTEM';
  entityType?: string;
  entityId?: mongoose.Schema.Types.ObjectId;
  action: string;
  details?: object;
  beforeState?: object;
  afterState?: object;
  timestamp: Date;
}

const AuditLogSchema: Schema = new Schema({
  tenantId: {
    type: Schema.Types.ObjectId,
    ref: 'Tenant',
    required: true,
    index: true,
  },
  // The user, vendor, or system that performed the action
  actorId: { type: Schema.Types.ObjectId },
  actorType: { type: String, enum: ['USER', 'VENDOR', 'SYSTEM'] },
  // The entity that was affected
  entityType: { type: String, index: true },
  entityId: { type: Schema.Types.ObjectId, index: true },
  action: { type: String, required: true, index: true },
  // For storing additional context, like IP address
  details: { type: Schema.Types.Mixed },
  // For storing the state of the entity before and after the change
  beforeState: { type: Schema.Types.Mixed },
  afterState: { type: Schema.Types.Mixed },
  // We use the 'timestamp' field from the options below
}, {
  timestamps: { createdAt: 'timestamp' }, // Use `timestamp` as the creation field
});

export default mongoose.models.AuditLog || mongoose.model<IAuditLog>('AuditLog', AuditLogSchema);
