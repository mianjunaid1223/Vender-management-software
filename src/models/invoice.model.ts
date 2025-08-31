import mongoose, { Schema, Document } from 'mongoose';
import { ITenant } from './tenant.model';
import { IVendor } from './vendor.model';
import { IContract } from './contract.model';

// Sub-schema for InvoiceItem
const InvoiceItemSchema: Schema = new Schema({
  description: { type: String, required: true },
  quantity: { type: Number, required: true },
  unitPrice: { type: Number, required: true },
  total: { type: Number, required: true },
}, { _id: true });

export interface IInvoice extends Document {
  tenantId: ITenant['_id'];
  vendorId?: IVendor['_id'];
  contractId?: IContract['_id'];
  invoiceNumber: string;
  totalAmount: number;
  currency: string;
  status: 'DRAFT' | 'SENT' | 'PAID' | 'OVERDUE' | 'CANCELLED';
  paymentStatus: 'PENDING' | 'PARTIAL' | 'PAID' | 'OVERDUE';
  invoiceDate?: Date;
  invoiceDueDate?: Date;
  paymentTerms?: string;
  notes?: string;
  items: any[];
}

const InvoiceSchema: Schema = new Schema({
  tenantId: { type: Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
  vendorId: { type: Schema.Types.ObjectId, ref: 'Vendor', index: true },
  contractId: { type: Schema.Types.ObjectId, ref: 'Contract', index: true },
  invoiceNumber: { type: String, required: true },
  totalAmount: { type: Number, required: true },
  currency: { type: String, required: true },
  status: {
    type: String,
    enum: ['DRAFT', 'SENT', 'PAID', 'OVERDUE', 'CANCELLED'],
    default: 'DRAFT',
    index: true,
  },
  paymentStatus: {
    type: String,
    enum: ['PENDING', 'PARTIAL', 'PAID', 'OVERDUE'],
    default: 'PENDING'
  },
  invoiceDate: { type: Date },
  invoiceDueDate: { type: Date },
  paymentTerms: { type: String },
  notes: { type: String },
  // Array of sub-documents
  items: [InvoiceItemSchema],
}, {
  timestamps: true,
});

// Compound index for unique invoice number per tenant
InvoiceSchema.index({ tenantId: 1, invoiceNumber: 1 }, { unique: true });

export default mongoose.models.Invoice || mongoose.model<IInvoice>('Invoice', InvoiceSchema);
