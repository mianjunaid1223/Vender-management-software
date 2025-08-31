import mongoose, { Schema, Document } from 'mongoose';
import { ITenant } from './tenant.model';
import { IUser } from './user.model';
import { IVendorApplication } from './vendorApplication.model';

export interface IInvite extends Document {
  tenantId: ITenant['_id'];
  email: string;
  role: 'ADMIN' | 'MANAGER' | 'MEMBER';
  status: 'PENDING' | 'ACCEPTED' | 'EXPIRED' | 'COMPLETED';
  invitedBy: IUser['_id'];
  expiresAt: Date;
  token: string;
  usedAt?: Date;
  vendorApplicationId?: IVendorApplication['_id'];
}

const InviteSchema: Schema = new Schema({
  tenantId: {
    type: Schema.Types.ObjectId,
    ref: 'Tenant',
    required: true,
    index: true,
  },
  email: {
    type: String,
    required: true,
    trim: true,
    lowercase: true,
  },
  role: {
    type: String,
    enum: ['ADMIN', 'MANAGER', 'MEMBER'],
    required: true
  },
  status: {
    type: String,
    enum: ['PENDING', 'ACCEPTED', 'EXPIRED', 'COMPLETED'],
    default: 'PENDING'
  },
  invitedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  expiresAt: { type: Date, required: true },
  token: { type: String, required: true, unique: true },
  usedAt: { type: Date },
  vendorApplicationId: { type: Schema.Types.ObjectId, ref: 'VendorApplication' },
}, {
  timestamps: true,
});

// Index to quickly find pending invites for a tenant and email
InviteSchema.index({ tenantId: 1, email: 1, status: 1 });

export default mongoose.models.Invite || mongoose.model<IInvite>('Invite', InviteSchema);
