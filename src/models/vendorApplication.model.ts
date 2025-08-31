import mongoose, { Schema, Document } from 'mongoose';
import { ITenant } from './tenant.model';
import { IUser } from './user.model';
import { IInvite } from './invite.model';

// Re-using the Address sub-schema concept
const AddressSchema: Schema = new Schema({
  street: { type: String, required: true },
  city: { type: String, required: true },
  state: { type: String, required: true },
  zipCode: { type: String, required: true },
  country: { type: String, required: true },
}, { _id: false });

export interface IVendorApplication extends Document {
  applicationId: string;
  tenantId: ITenant['_id'];
  vendorName: string;
  contactPerson: string;
  email: string;
  phone?: string;
  service?: string;
  taxId?: string;
  address?: any;
  notes?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  submittedAt?: Date;
  reviewedAt?: Date;
  reviewedBy?: IUser['_id'];
  inviteId?: IInvite['_id'];
  inviteToken?: string;
}

const VendorApplicationSchema: Schema = new Schema({
  applicationId: { type: String, required: true, unique: true },
  tenantId: {
    type: Schema.Types.ObjectId,
    ref: 'Tenant',
    required: true,
    index: true,
  },
  // Fields from VendorApplication type
  vendorName: { type: String, required: true },
  contactPerson: { type: String, required: true },
  email: { type: String, required: true, trim: true, lowercase: true },
  phone: { type: String },
  service: { type: String },
  taxId: { type: String },
  address: AddressSchema,
  notes: { type: String },
  status: {
    type: String,
    enum: ['PENDING', 'APPROVED', 'REJECTED'],
    default: 'PENDING',
    index: true,
  },
  submittedAt: { type: Date },
  reviewedAt: { type: Date },
  reviewedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  // Link to the invite if the application came from one
  inviteId: { type: Schema.Types.ObjectId, ref: 'Invite' },
  // Store the token temporarily if needed for verification
  inviteToken: { type: String },
}, {
  timestamps: true,
});

export default mongoose.models.VendorApplication || mongoose.model<IVendorApplication>('VendorApplication', VendorApplicationSchema);
