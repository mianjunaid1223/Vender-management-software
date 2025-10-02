// Enhanced types for vendor portal functionality
// Extends existing types in src/lib/types.ts

import type { Vendor } from '@/shared/types/types';

// === VENDOR PORTAL TYPES ===

export type VendorPortalAccess = {
  id: string;
  vendorId: string;
  companyId: string;
  enabled: boolean;
  enabledAt?: string;
  disabledAt?: string;
  features: PortalFeature[];
  restrictions: AccessRestriction[];
  mfaRequired: boolean;
  sessionTimeout: number; // in minutes
  lastLoginAt?: string;
  loginAttempts: number;
  lockedUntil?: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy: string;
};

export type PortalFeature = 
  | 'view_invoices' 
  | 'upload_invoices' 
  | 'edit_profile' 
  | 'view_contracts' 
  | 'sign_contracts' 
  | 'upload_compliance' 
  | 'view_payments' 
  | 'communication';

export type AccessRestriction = {
  type: 'ip_whitelist' | 'time_based' | 'data_limit';
  config: Record<string, any>;
};

// === ENHANCED USER TYPES ===

export type UserRole = 'company_admin' | 'company_user' | 'vendor_admin' | 'vendor_user';

export type VendorUser = {
  id: string;
  vendorId: string;
  companyId: string;
  name: string;
  email: string;
  role: 'vendor_admin' | 'vendor_user';
  permissions: Permission[];
  isActive: boolean;
  lastLoginAt?: string;
  mfaEnabled: boolean;
  mfaSecret?: string;
  passwordHash: string;
  passwordResetToken?: string;
  passwordResetExpires?: string;
  emailVerified: boolean;
  emailVerificationToken?: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
};

export type Permission = {
  resource: string; // 'invoices', 'contracts', 'profile', etc.
  actions: PermissionAction[]; // 'read', 'write', 'delete', etc.
  scope?: 'own' | 'vendor' | 'all';
};

export type PermissionAction = 'create' | 'read' | 'update' | 'delete' | 'approve' | 'sign';

// === AUDIT & LOGGING TYPES ===

export type AuditLog = {
  id: string;
  userId: string;
  userRole: UserRole;
  vendorId?: string;
  companyId: string;
  action: AuditAction;
  resource: string; // 'invoice', 'contract', 'vendor_profile', etc.
  resourceId: string;
  oldValues?: Record<string, any>;
  newValues?: Record<string, any>;
  ipAddress: string;
  userAgent: string;
  timestamp: string;
  sessionId: string;
  metadata?: Record<string, any>;
};

export type AuditAction = 
  | 'login' | 'logout' | 'login_failed'
  | 'create' | 'read' | 'update' | 'delete'
  | 'approve' | 'reject' | 'sign' | 'upload'
  | 'access_granted' | 'access_revoked'
  | 'export' | 'download';

// === DATA SYNC TYPES ===

export type DataSyncQueue = {
  id: string;
  sourceType: 'company' | 'vendor';
  sourceUserId: string;
  targetType: 'company' | 'vendor';
  operation: SyncOperation;
  resource: string;
  resourceId: string;
  data: Record<string, any>;
  status: SyncStatus;
  priority: number;
  retryCount: number;
  maxRetries: number;
  scheduledAt: string;
  processedAt?: string;
  error?: string;
  companyId: string;
  vendorId?: string;
};

export type SyncOperation = 'create' | 'update' | 'delete' | 'approve' | 'sync_conflict';
export type SyncStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'conflict';

// === ENHANCED VENDOR TYPES ===

export interface EnhancedVendor extends Vendor {
  portalAccess?: VendorPortalAccess;
  users: VendorUser[];
  lastActivity?: string;
  onboardingCompleted: boolean;
  onboardingSteps: VendorOnboardingStep[];
  communicationPreferences: CommunicationPreference[];
  complianceStatus: ComplianceStatus;
  riskScore?: number;
  performanceMetrics?: VendorMetrics;
}

export type VendorOnboardingStep = {
  id: string;
  title: string;
  description: string;
  required: boolean;
  completed: boolean;
  completedAt?: string;
  completedBy?: string;
  data?: Record<string, any>;
};

export type CommunicationPreference = {
  type: 'email' | 'sms' | 'portal_notification';
  event: 'invoice_status' | 'contract_update' | 'compliance_reminder' | 'payment_update';
  enabled: boolean;
  frequency?: 'immediate' | 'daily' | 'weekly';
};

export type ComplianceStatus = {
  overall: 'compliant' | 'non_compliant' | 'pending' | 'expired';
  documents: ComplianceDocument[];
  lastReviewAt?: string;
  nextReviewDue?: string;
};

export type ComplianceDocument = {
  id: string;
  type: string; // 'insurance', 'certification', 'tax_form', etc.
  name: string;
  fileName: string;
  filePath: string;
  fileSize: number;
  mimeType: string;
  status: 'pending' | 'approved' | 'rejected' | 'expired';
  uploadedAt: string;
  uploadedBy: string;
  reviewedAt?: string;
  reviewedBy?: string;
  expiresAt?: string;
  comments?: string;
};

export type VendorMetrics = {
  invoiceAccuracy: number; // percentage
  onTimeDelivery: number; // percentage
  responseTime: number; // hours
  qualityScore: number; // 1-5 scale
  communicationRating: number; // 1-5 scale
  lastUpdated: string;
};

// === PORTAL NOTIFICATION TYPES ===

export type PortalNotification = {
  id: string;
  vendorId: string;
  companyId: string;
  type: PortalNotificationType;
  title: string;
  message: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  isRead: boolean;
  readAt?: string;
  actionRequired: boolean;
  actionUrl?: string;
  actionLabel?: string;
  relatedResource?: {
    type: string;
    id: string;
  };
  expiresAt?: string;
  createdAt: string;
};

export type PortalNotificationType = 
  | 'invoice_status_update'
  | 'contract_available'
  | 'compliance_reminder' 
  | 'payment_processed'
  | 'document_approved'
  | 'document_rejected'
  | 'profile_update_required'
  | 'access_change'
  | 'system_maintenance';

// === SESSION MANAGEMENT ===

export type VendorSession = {
  id: string;
  userId: string;
  vendorId: string;
  companyId: string;
  sessionToken: string;
  refreshToken: string;
  expiresAt: string;
  refreshExpiresAt: string;
  ipAddress: string;
  userAgent: string;
  isActive: boolean;
  lastActivityAt: string;
  loginMethod: 'password' | 'mfa' | 'sso';
  createdAt: string;
};

// === AI INTEGRATION HOOKS ===

export type AIContext = {
  vendorId: string;
  companyId: string;
  userRole: UserRole;
  currentAction: string;
  resourceType: string;
  historicalData?: Record<string, any>;
  preferences?: Record<string, any>;
};

export type AIRecommendation = {
  id: string;
  type: 'efficiency' | 'compliance' | 'risk' | 'optimization';
  title: string;
  description: string;
  confidence: number; // 0-1
  impact: 'low' | 'medium' | 'high';
  actionable: boolean;
  suggestedActions?: string[];
  relatedResources?: string[];
  createdAt: string;
};
