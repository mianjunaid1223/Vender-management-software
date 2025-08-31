import mongoose, { Schema, Document } from 'mongoose';
import { ITenant } from './tenant.model';
import { IUser } from './user.model';

export interface INotification extends Document {
  tenantId: ITenant['_id'];
  userId: IUser['_id'];
  type: 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR';
  title: string;
  message: string;
  isRead: boolean;
  relatedEntity?: {
    type: string; // e.g., 'Invoice', 'Contract'
    id: mongoose.Schema.Types.ObjectId;
  };
}

const NotificationSchema: Schema = new Schema({
  tenantId: {
    type: Schema.Types.ObjectId,
    ref: 'Tenant',
    required: true,
    index: true,
  },
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  type: {
    type: String,
    enum: ['INFO', 'SUCCESS', 'WARNING', 'ERROR'],
    required: true
  },
  title: { type: String, required: true },
  message: { type: String, required: true },
  isRead: { type: Boolean, default: false, index: true },
  // Optional field to link a notification to a specific document
  relatedEntity: {
    type: { type: String },
    id: { type: Schema.Types.ObjectId }
  },
}, {
  timestamps: true,
});

export default mongoose.models.Notification || mongoose.model<INotification>('Notification', NotificationSchema);
