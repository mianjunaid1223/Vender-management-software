import mongoose, { Schema, Document } from 'mongoose';

// Sub-schema for Address, based on InvoiceAddress type
const AddressSchema: Schema = new Schema({
  street: { type: String, required: true },
  city: { type: String, required: true },
  state: { type: String, required: true },
  zipCode: { type: String, required: true },
  country: { type: String, required: true },
}, { _id: false });

// Sub-schema for ContactInfo
const ContactInfoSchema: Schema = new Schema({
    name: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true },
    role: { type: String },
    isPrimary: { type: Boolean, default: false },
}, { _id: false });

// Sub-schema for CompanyPreferences
const CompanyPreferencesSchema: Schema = new Schema({
    defaultPaymentTerms: { type: String },
    baseCurrency: { type: String, required: true },
    defaultTaxRate: { type: Number },
    emailNotifications: { type: Boolean },
    invoiceReminders: { type: Boolean },
    contractReminders: { type: Boolean },
    preferredLanguage: { type: String },
}, { _id: false });


// Main Tenant Schema based on the Company type
const TenantSchema: Schema = new Schema({
  name: { type: String, required: true, trim: true },
  businessType: { type: String },
  industry: { type: String },
  addresses: [AddressSchema],
  primaryAddress: AddressSchema,
  taxId: { type: String },
  legalId: { type: String },
  contacts: [ContactInfoSchema],
  primaryContact: ContactInfoSchema,
  website: { type: String },
  description: { type: String },
  otherIdentifiers: { type: Map, of: String },
  preferences: CompanyPreferencesSchema,
  createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
}, {
  timestamps: true, // This adds createdAt and updatedAt fields
});

// The Document interface defines the properties on the document (returned by queries)
export interface ITenant extends Document {
    name: string;
    businessType?: string;
    industry?: string;
    addresses?: any[];
    primaryAddress?: any;
    taxId?: string;
    legalId?: string;
    contacts?: any[];
    primaryContact?: any;
    website?: string;
    description?: string;
    otherIdentifiers?: Map<string, string>;
    preferences?: any;
    createdBy?: mongoose.Schema.Types.ObjectId;
}

// The model is what we use to interact with the collection
// The `mongoose.models.Tenant` check prevents redefining the model in Next.js hot-reload environments
export default mongoose.models.Tenant || mongoose.model<ITenant>('Tenant', TenantSchema);
