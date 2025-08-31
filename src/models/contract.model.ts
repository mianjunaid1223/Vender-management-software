import mongoose, { Schema, Document } from 'mongoose';
import { ITenant } from './tenant.model';
import { IVendor } from './vendor.model';
import { IUser } from './user.model';

// Sub-schema for ContractFile
const ContractFileSchema: Schema = new Schema({
  name: { type: String, required: true },
  url: { type: String, required: true },
  size: { type: Number },
  uploadedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  uploadedAt: { type: Date, default: Date.now },
}, { _id: true }); // Use default _id for files

// Sub-schema for ContractMilestone
const ContractMilestoneSchema: Schema = new Schema({
  title: { type: String, required: true },
  dueDate: { type: Date },
  amount: { type: Number },
  status: { type: String, enum: ['Pending', 'In Progress', 'Completed', 'Overdue'], default: 'Pending' },
}, { _id: true });

export interface IContract extends Document {
  tenantId: ITenant['_id'];
  vendorId: IVendor['_id'];
  title: string;
  value?: number;
  currency?: string;
  status: 'DRAFT' | 'ACTIVE' | 'PENDING' | 'EXPIRED' | 'TERMINATED' | 'SUSPENDED';
  type?: 'SERVICE' | 'PRODUCT' | 'SUBSCRIPTION' | 'ONETIME' | 'FRAMEWORK';
  startDate?: Date;
  endDate?: Date;
  paymentTerms?: string;
  autoRenew?: boolean;
  termsAndConditions?: string;
  files?: any[];
  milestones?: any[];
  createdBy?: IUser['_id'];
}

const ContractSchema: Schema = new Schema({
  tenantId: { type: Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
  vendorId: { type: Schema.Types.ObjectId, ref: 'Vendor', required: true, index: true },
  title: { type: String, required: true, trim: true },
  value: { type: Number },
  currency: { type: String },
  status: {
    type: String,
    enum: ['DRAFT', 'ACTIVE', 'PENDING', 'EXPIRED', 'TERMINATED', 'SUSPENDED'],
    default: 'DRAFT',
    index: true,
  },
  type: {
    type: String,
    enum: ['SERVICE', 'PRODUCT', 'SUBSCRIPTION', 'ONETIME', 'FRAMEWORK']
  },
  startDate: { type: Date },
  endDate: { type: Date },
  paymentTerms: { type: String },
  autoRenew: { type: Boolean, default: false },
  termsAndConditions: { type: String },
  // Nested sub-documents
  files: [ContractFileSchema],
  milestones: [ContractMilestoneSchema],
  createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
}, {
  timestamps: true,
});

export default mongoose.models.Contract || mongoose.model<IContract>('Contract', ContractSchema);
