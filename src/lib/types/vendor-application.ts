import { ObjectId } from 'mongodb';

export interface VendorApplicationAddress {
  street?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
}

export interface VendorApplication {
  _id: ObjectId;
  name: string;
  email: string;
  phone?: string;
  service?: string;
  contactPerson?: string;
  taxId?: string;
  address?: VendorApplicationAddress;
  status: string;
  paymentTerms?: string;
  notes?: string;
  companyId: string;
  targetCompanyId: ObjectId;
  applicationId?: string;
  createdAt: Date;
  updatedAt: Date;
  inviteToken?: string;
  inviteTokenExpiresAt?: Date;
  reviewedBy?: string;
  reviewedAt?: Date;
}
