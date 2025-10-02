/**
 * Phase 2: Unified Database Schema Types
 * 
 * Complete TypeScript type definitions matching the database schema design
 * All types include MongoDB _id field and proper indexing hints
 */

import { ObjectId } from 'mongodb';

// ============================================================================
// Base Types
// ============================================================================

export interface BaseDocument {
  _id: ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export interface MultiTenantDocument extends BaseDocument {
  companyId: string;
}

export interface Address {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

export interface ContactInfo {
  id: string;
  name: string;
  email: string;
  phone: string;
  role?: string;
  isPrimary: boolean;
}

// ============================================================================
// Company Schema
// ============================================================================

export interface VendorPortalFeatures {
  viewInvoices: boolean;
  downloadInvoices: boolean;
  updatePaymentInfo: boolean;
  viewContracts: boolean;
  communicateWithBuyer: boolean;
  accessAnalytics: boolean;
  submitChangeRequests: boolean;
  viewPaymentHistory: boolean;
  accessDocuments: boolean;
  receiveNotifications: boolean;
  canEditProfile: boolean;
  canViewAuditLogs: boolean;
}

export interface VendorPortalPermissions {
  canCreate: string[];
  canRead: string[];
  canUpdate: string[];
  canDelete: string[];
}

export interface AccessRestrictions {
  ipWhitelist?: string[];
  maxUsers?: number;
  accessHours?: {
    start: string;
    end: string;
    timezone: string;
  };
}

export interface VendorPortalAccessMetadata {
  grantedBy: string;
  revokedBy?: string;
  lastModified: Date;
  accessCount: number;
  lastAccessAt?: Date;
}

export interface VendorPortalAccess {
  vendorId: string;
  enabled: boolean;
  enabledAt: Date;
  expiresAt?: Date;
  features: VendorPortalFeatures;
  permissions: VendorPortalPermissions;
  restrictions?: AccessRestrictions;
  metadata: VendorPortalAccessMetadata;
}

export interface CompanyPreferences {
  defaultPaymentTerms?: string;
  defaultCurrency?: string;
  defaultTaxRate?: number;
  emailNotifications: boolean;
  invoiceReminders: boolean;
  contractReminders: boolean;
  preferredLanguage: string;
}

export interface CompanyDocument extends BaseDocument {
  companyId: string; // Unique shareable ID
  name: string;
  businessType: string;
  industry?: string;
  addresses: Address[];
  primaryAddress?: Address;
  contacts: ContactInfo[];
  primaryContact?: ContactInfo;
  taxId?: string;
  legalId?: string;
  otherIdentifiers?: Record<string, string>;
  website?: string;
  description?: string;
  vendorPortalAccess?: VendorPortalAccess[];
  preferences?: CompanyPreferences;
  createdBy: string;
  status: 'active' | 'inactive' | 'suspended';
}

// ============================================================================
// User Schema
// ============================================================================

export interface UserPermissions {
  canManageUsers: boolean;
  canManageVendors: boolean;
  canManageInvoices: boolean;
  canManageContracts: boolean;
  canViewReports: boolean;
  canManageSettings: boolean;
  canGrantPortalAccess: boolean;
}

export interface UserPreferences {
  language: string;
  timezone: string;
  notifications: {
    email: boolean;
    push: boolean;
    sms: boolean;
  };
  theme: 'light' | 'dark' | 'auto';
}

export interface UserDocument extends MultiTenantDocument {
  userId: string;
  email: string;
  passwordHash: string;
  salt?: string;
  name: string;
  image?: string;
  phone?: string;
  role: 'admin' | 'company_user' | 'viewer' | 'manager';
  permissions?: UserPermissions;
  status: 'active' | 'inactive' | 'suspended';
  emailVerified: boolean;
  verificationToken?: string;
  verificationExpiry?: Date;
  resetToken?: string;
  resetTokenExpiry?: Date;
  lastLogin?: Date;
  lastPasswordChange?: Date;
  failedLoginAttempts: number;
  lockedUntil?: Date;
  twoFactorEnabled: boolean;
  twoFactorSecret?: string;
  preferences?: UserPreferences;
  createdBy?: string;
}

// ============================================================================
// Vendor Schema
// ============================================================================

export interface VendorMetrics {
  totalInvoices: number;
  totalAmount: number;
  onTimePayments: number;
  latePayments: number;
  averageRating: number;
  completedContracts: number;
}

export interface VendorCompliance {
  insuranceExpiry?: Date;
  licenseExpiry?: Date;
  certifications?: string[];
  lastAuditDate?: Date;
}

export interface VendorDocument extends MultiTenantDocument {
  vendorId: string;
  name: string;
  email: string;
  phone: string;
  service: string;
  address?: Address;
  contactPerson?: string;
  taxId?: string;
  legalId?: string;
  website?: string;
  status: 'Active' | 'Inactive' | 'Pending' | 'Suspended';
  rating?: number;
  tags?: string[];
  notes?: string;
  paymentTerms?: string;
  metrics?: VendorMetrics;
  compliance?: VendorCompliance;
  createdBy: string;
  lastModifiedBy?: string;
}

// ============================================================================
// Vendor User Schema
// ============================================================================

export interface VendorPortalAccessStatus {
  enabled: boolean;
  enabledAt?: Date;
  disabledAt?: Date;
  expiresAt?: Date;
  lastAccessAt?: Date;
  accessCount: number;
}

export interface VendorUserPermissions {
  canViewInvoices: boolean;
  canDownloadInvoices: boolean;
  canUpdatePaymentInfo: boolean;
  canViewContracts: boolean;
  canCommunicate: boolean;
  canAccessAnalytics: boolean;
  canSubmitChanges: boolean;
  canEditProfile: boolean;
}

export interface VendorUserDocument extends MultiTenantDocument {
  vendorUserId: string;
  email: string;
  passwordHash: string;
  name: string;
  phone?: string;
  role: 'vendor_admin' | 'vendor_user' | 'vendor_viewer';
  vendorId: string;
  portalAccess: VendorPortalAccessStatus;
  permissions?: VendorUserPermissions;
  status: 'active' | 'inactive' | 'suspended';
  emailVerified: boolean;
  lastLogin?: Date;
  lastPasswordChange?: Date;
  failedLoginAttempts: number;
  lockedUntil?: Date;
  createdBy: string;
  invitedBy?: string;
}

// ============================================================================
// Invoice Schema
// ============================================================================

export interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
  taxRate?: number;
  discountRate?: number;
}

export interface InvoiceEntity {
  name: string;
  address: Address;
  email?: string;
  phone?: string;
  taxId?: string;
  contactPerson?: string;
}

export interface PaymentSchedule {
  id: string;
  amount: number;
  dueDate: Date;
  status: 'Pending' | 'Paid' | 'Overdue';
  paidDate?: Date;
}

export interface CustomField {
  id: string;
  name: string;
  type: 'text' | 'number' | 'date' | 'select' | 'textarea';
  value: any;
  required: boolean;
  options?: string[];
}

export interface FileAttachment {
  id: string;
  filename: string;
  url: string;
  size: number;
  mimeType: string;
  uploadedAt: Date;
  uploadedBy: string;
}

export interface InvoiceDocument extends MultiTenantDocument {
  invoiceId: string;
  invoiceNumber: string;
  vendorId?: string;
  vendorName: string;
  contractId?: string;
  invoiceDate: Date;
  invoiceDueDate: Date;
  paymentDate?: Date;
  seller: InvoiceEntity;
  buyer: InvoiceEntity;
  items: InvoiceItem[];
  subtotal: number;
  taxes: number;
  taxRate?: number;
  taxType?: 'percentage' | 'fixed';
  discounts: number;
  discountRate?: number;
  discountType?: 'percentage' | 'fixed';
  totalAmount: number;
  invoiceAmount: number; // Legacy
  status: 'Draft' | 'Sent' | 'Paid' | 'Unpaid' | 'Pending' | 'Overdue' | 'Cancelled';
  paymentStatus: 'Pending' | 'Partial' | 'Paid' | 'Overdue';
  paymentTerms: string;
  paymentMethod: string;
  paymentSchedule?: PaymentSchedule[];
  purchaseOrderNumber?: string;
  shippingAddress?: Address;
  shippingMethod?: string;
  termsAndConditions?: string;
  notes?: string;
  customFields?: CustomField[];
  attachments?: FileAttachment[];
  approvalRequired: boolean;
  approvalStatus?: 'pending' | 'approved' | 'rejected';
  approvedBy?: string;
  approvedAt?: Date;
  rejectionReason?: string;
  createdBy: string;
  lastModifiedBy?: string;
}

// ============================================================================
// Contract Schema
// ============================================================================

export interface ContractParty {
  id: string;
  name: string;
  role: 'Client' | 'Provider';
}

export interface ContractMilestone {
  id: string;
  title: string;
  description?: string;
  dueDate: Date;
  amount: number;
  status: 'Pending' | 'In Progress' | 'Completed' | 'Overdue';
  deliverables?: string[];
  completedAt?: Date;
  completedBy?: string;
}

export interface ContractKPI {
  id: string;
  name: string;
  target: number;
  actual?: number;
  unit: string;
  description?: string;
  lastUpdated?: Date;
}

export interface ContractFile {
  id: string;
  filename: string;
  url: string;
  type: 'contract' | 'amendment' | 'attachment';
  size: number;
  mimeType: string;
  uploadedAt: Date;
  uploadedBy: string;
}

export interface ContractReminder {
  id: string;
  type: 'renewal' | 'milestone' | 'expiry' | 'custom';
  date: Date;
  message: string;
  sent: boolean;
  sentAt?: Date;
}

export type ContractStatus = 'Draft' | 'Active' | 'Pending' | 'Expired' | 'Terminated' | 'Renewed';
export type ContractType = 'Service' | 'Product' | 'Maintenance' | 'Subscription' | 'Custom';

export interface ContractDocument extends MultiTenantDocument {
  contractId: string;
  title: string;
  description?: string;
  type?: ContractType;
  partyA: ContractParty;
  partyB: ContractParty;
  vendorId?: string; // Legacy
  vendorName?: string; // Legacy
  value: number;
  currency: string;
  paymentTerms: string;
  startDate: Date;
  endDate: Date;
  signedAt?: Date;
  signedBy?: string;
  autoRenew: boolean;
  renewalPeriod?: number;
  renewalNotice?: number;
  status: ContractStatus;
  milestones?: ContractMilestone[];
  kpis?: ContractKPI[];
  termsAndConditions?: string;
  deliverables?: string[];
  tags?: string[];
  notes?: string;
  files?: ContractFile[];
  reminders?: ContractReminder[];
  acknowledged: boolean;
  acknowledgedAt?: Date;
  acknowledgedBy?: string;
  createdBy: string;
  lastModifiedBy?: string;
}

// ============================================================================
// Notification Schema
// ============================================================================

export interface NotificationChannels {
  email: boolean;
  push: boolean;
  inApp: boolean;
  sms: boolean;
}

export interface NotificationDeliveryStatus {
  email?: 'pending' | 'sent' | 'failed';
  push?: 'pending' | 'sent' | 'failed';
  sms?: 'pending' | 'sent' | 'failed';
}

export interface RelatedEntity {
  type: 'invoice' | 'contract' | 'vendor' | 'user';
  id: string;
}

export type NotificationType = 'invoice' | 'contract' | 'payment' | 'access' | 'system' | 'reminder' | 'alert';
export type NotificationPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface NotificationDocument extends MultiTenantDocument {
  notificationId: string;
  recipientType: 'user' | 'vendor' | 'company' | 'broadcast';
  recipientId: string;
  type: NotificationType;
  priority: NotificationPriority;
  title: string;
  message: string;
  relatedEntity?: RelatedEntity;
  actionUrl?: string;
  actionLabel?: string;
  read: boolean;
  readAt?: Date;
  dismissed: boolean;
  dismissedAt?: Date;
  channels: NotificationChannels;
  deliveryStatus: NotificationDeliveryStatus;
  sentAt?: Date;
  expiresAt?: Date;
  createdBy: string;
}

// ============================================================================
// Audit Log Schema
// ============================================================================

export type AuditAction = 'create' | 'read' | 'update' | 'delete' | 'login' | 'logout' | 
                          'grant_access' | 'revoke_access' | 'approve' | 'reject' | 
                          'export' | 'import' | 'send' | 'download';

export type AuditResource = 'invoice' | 'contract' | 'vendor' | 'user' | 'company' | 
                            'settings' | 'portal_access' | 'notification';

export interface AuditChanges {
  before?: any;
  after?: any;
  fields?: string[];
}

export interface AuditLogDocument extends MultiTenantDocument {
  logId: string;
  actorType: 'user' | 'vendor' | 'system';
  actorId: string;
  actorName: string;
  actorEmail?: string;
  action: AuditAction;
  resource: AuditResource;
  resourceId?: string;
  description: string;
  changes?: AuditChanges;
  ipAddress?: string;
  userAgent?: string;
  location?: string;
  device?: string;
  status: 'success' | 'failure' | 'partial';
  errorMessage?: string;
  severity: 'info' | 'warning' | 'error' | 'critical';
  timestamp: Date;
  sessionId?: string;
  requestId?: string;
}

// ============================================================================
// Session Schema
// ============================================================================

export interface DeviceInfo {
  type: 'desktop' | 'mobile' | 'tablet';
  os: string;
  browser: string;
}

export interface LocationInfo {
  country: string;
  city?: string;
  region?: string;
}

export interface SessionDocument extends BaseDocument {
  sessionId: string;
  userType: 'user' | 'vendor';
  userId: string;
  companyId: string;
  vendorId?: string;
  token: string;
  refreshToken?: string;
  authenticatedAt: Date;
  lastActivityAt: Date;
  expiresAt: Date;
  ipAddress: string;
  userAgent: string;
  device?: DeviceInfo;
  location?: LocationInfo;
  twoFactorVerified: boolean;
  trustedDevice: boolean;
  active: boolean;
  revokedAt?: Date;
  revocationReason?: string;
}

// ============================================================================
// Vendor Pending Changes Schema
// ============================================================================

export type ChangeType = 'profile_update' | 'invoice_correction' | 'contract_amendment' | 'payment_update';
export type TargetResource = 'vendor' | 'invoice' | 'contract';
export type ChangeStatus = 'pending' | 'under_review' | 'approved' | 'rejected' | 'cancelled';
export type ChangePriority = 'low' | 'normal' | 'high' | 'urgent';

export interface ChangeAttachment {
  id: string;
  filename: string;
  url: string;
  size: number;
  uploadedAt: Date;
}

export interface VendorPendingChangeDocument extends MultiTenantDocument {
  changeId: string;
  changeType: ChangeType;
  targetResource: TargetResource;
  targetResourceId: string;
  submittedBy: string;
  submittedByName: string;
  submittedByEmail: string;
  vendorId: string;
  currentData?: any;
  proposedChanges: any;
  reason?: string;
  attachments?: ChangeAttachment[];
  status: ChangeStatus;
  reviewedBy?: string;
  reviewedByName?: string;
  reviewedAt?: Date;
  reviewNotes?: string;
  rejectionReason?: string;
  priority: ChangePriority;
  approvalRequired: boolean;
  autoApprove: boolean;
  completedAt?: Date;
}

// ============================================================================
// Compliance Document Schema
// ============================================================================

export type ComplianceDocumentType = 'insurance' | 'license' | 'certification' | 'audit' | 'tax' | 'legal' | 'other';
export type ComplianceDocumentStatus = 'active' | 'expired' | 'pending_renewal' | 'revoked';

export interface ComplianceDocumentDocument extends MultiTenantDocument {
  documentId: string;
  entityType: 'vendor' | 'company';
  entityId: string;
  type: ComplianceDocumentType;
  title: string;
  description?: string;
  filename: string;
  url: string;
  size: number;
  mimeType: string;
  issueDate?: Date;
  expiryDate?: Date;
  verified: boolean;
  verifiedBy?: string;
  verifiedAt?: Date;
  verificationNotes?: string;
  status: ComplianceDocumentStatus;
  reminderSent: boolean;
  reminderSentAt?: Date;
  uploadedBy: string;
  uploadedAt: Date;
}

// ============================================================================
// Data Sync Queue Schema
// ============================================================================

export type SyncType = 'invoice' | 'vendor' | 'contract' | 'user' | 'full';
export type SyncOperation = 'create' | 'update' | 'delete';
export type SyncStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'retry';
export type EntityType = 'invoice' | 'vendor' | 'contract' | 'user';

export interface DataSyncQueueDocument extends MultiTenantDocument {
  queueId: string;
  syncType: SyncType;
  operation: SyncOperation;
  priority: number;
  sourceSystem: string;
  targetSystem: string;
  entityType: EntityType;
  entityId: string;
  payload: any;
  status: SyncStatus;
  retryCount: number;
  maxRetries: number;
  lastError?: string;
  scheduledFor?: Date;
  startedAt?: Date;
  completedAt?: Date;
  processingDuration?: number;
}