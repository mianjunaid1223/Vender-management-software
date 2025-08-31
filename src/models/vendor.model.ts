import mongoose, { Schema, Document } from 'mongoose';
import { ITenant } from './tenant.model';

// Re-using the Address sub-schema concept from tenant.model.ts
// In a real project, this might be imported from a shared file.
const AddressSchema: Schema = new Schema({
  street: { type: String, required: true },
  city: { type: String, required: true },
  state: { type: String, required: true },
  zipCode: { type: String, required: true },
  country: { type: String, required: true },
}, { _id: false });

export interface IVendor extends Document {
  tenantId: ITenant['_id'];
  name: string;
  email: string;
  phone?: string;
  service?: string;
  contactPerson?: string;
  taxId?: string;
  paymentTerms?: string;
  status: 'ACTIVE' | 'INACTIVE' | 'PENDING';
  notes?: string;
  rating?: number;
  address?: any;
  tags?: string[];
  pin?: string;
  pinExpiresAt?: Date;
}

const VendorSchema: Schema = new Schema({
  tenantId: {
    type: Schema.Types.ObjectId,
    ref: 'Tenant',
    required: true,
    index: true,
  },
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, trim: true, lowercase: true },
  phone: { type: String },
  service: { type: String },
  contactPerson: { type: String },
  taxId: { type: String },
  paymentTerms: { type: String },
  status: {
    type: String,
    enum: ['ACTIVE', 'INACTIVE', 'PENDING'],
    default: 'PENDING'
  },
  notes: { type: String },
  rating: { type: Number, min: 0, max: 5 },
  address: AddressSchema,
  tags: [{ type: String }],
  // Fields for vendor portal PIN authentication
  pin: { type: String, select: false }, // select: false hides from default query results
  pinExpiresAt: { type: Date, select: false },
}, {
  timestamps: true,
});

// Compound index for unique vendor email per tenant
VendorSchema.index({ tenantId: 1, email: 1 }, { unique: true });

export default mongoose.models.Vendor || mongoose.model<IVendor>('Vendor', VendorSchema);
