# Phase 2: Database Schema Design

## Overview
This document defines the complete database schema for the Vendor Management System with proper relationships, indexing strategy, and data integrity rules.

## Collections Identified

Based on code analysis, the system uses the following MongoDB collections:

1. **companies** - Client/buyer organizations
2. **users** - Admin/company users
3. **vendors** - Vendor/supplier organizations  
4. **vendor_users** - Vendor portal users
5. **vendor_portal_access** - Vendor portal access configurations
6. **invoices** - Invoice documents
7. **contracts** - Contract agreements
8. **notifications** - System notifications
9. **audit_logs** - Audit trail records
10. **sessions** - User session data
11. **vendor_pending_changes** - Vendor data change requests
12. **compliance_documents** - Compliance-related documents
13. **data_sync_queue** - Data synchronization queue

## Schema Definitions

### 1. Companies Collection

**Purpose**: Stores buyer/client organization data with multi-tenant support

```typescript
{
  _id: ObjectId,                    // MongoDB generated
  companyId: string,                // Unique shareable ID (indexed, unique)
  name: string,                     // Company name (indexed)
  businessType: string,             // Type of business
  industry?: string,                // Industry sector
  
  // Contact Information
  addresses: [{
    street: string,
    city: string,
    state: string,
    zipCode: string,
    country: string
  }],
  primaryAddress?: Address,
  
  contacts: [{
    id: string,
    name: string,
    email: string,                  // Indexed
    phone: string,
    role?: string,
    isPrimary: boolean
  }],
  primaryContact?: ContactInfo,
  
  // Legal & Tax
  taxId?: string,                   // Tax identification
  legalId?: string,                 // Business registration
  otherIdentifiers?: Record<string, string>,
  
  // Company Details
  website?: string,
  description?: string,
  
  // Vendor Portal Access (Embedded)
  vendorPortalAccess?: [{
    vendorId: string,               // Reference to vendor
    enabled: boolean,
    enabledAt: Date,
    expiresAt?: Date,
    features: {
      viewInvoices: boolean,
      downloadInvoices: boolean,
      updatePaymentInfo: boolean,
      viewContracts: boolean,
      communicateWithBuyer: boolean,
      accessAnalytics: boolean,
      submitChangeRequests: boolean,
      viewPaymentHistory: boolean,
      accessDocuments: boolean,
      receiveNotifications: boolean,
      canEditProfile: boolean,
      canViewAuditLogs: boolean
    },
    permissions: {
      canCreate: string[],          // Resources vendor can create
      canRead: string[],            // Resources vendor can read
      canUpdate: string[],          // Resources vendor can update
      canDelete: string[]           // Resources vendor can delete
    },
    restrictions?: {
      ipWhitelist?: string[],       // Allowed IP addresses
      maxUsers?: number,            // Max vendor users
      accessHours?: {               // Time-based access
        start: string,              // "09:00"
        end: string,                // "17:00"
        timezone: string            // "America/New_York"
      }
    },
    metadata: {
      grantedBy: string,            // User who granted access
      revokedBy?: string,           // User who revoked access
      lastModified: Date,
      accessCount: number,
      lastAccessAt?: Date
    }
  }],
  
  // Preferences
  preferences?: {
    defaultPaymentTerms?: string,
    defaultCurrency?: string,
    defaultTaxRate?: number,
    emailNotifications: boolean,
    invoiceReminders: boolean,
    contractReminders: boolean,
    preferredLanguage: string
  },
  
  // Metadata
  createdAt: Date,                  // Indexed
  updatedAt: Date,
  createdBy: string,                // User ID who created
  status: 'active' | 'inactive' | 'suspended',
  
  // Indexes
  indexes: [
    { companyId: 1 },               // Unique
    { name: 1 },
    { 'contacts.email': 1 },
    { createdAt: -1 },
    { 'vendorPortalAccess.vendorId': 1 }
  ]
}
```

### 2. Users Collection

**Purpose**: Admin and company user accounts

```typescript
{
  _id: ObjectId,
  userId: string,                   // Unique identifier (indexed, unique)
  
  // Authentication
  email: string,                    // Indexed, unique
  passwordHash: string,             // Bcrypt hashed
  salt?: string,                    // Password salt (if used)
  
  // Profile
  name: string,
  image?: string,                   // Profile picture URL
  phone?: string,
  
  // Multi-tenant
  companyId: string,                // Reference to company (indexed)
  role: 'admin' | 'company_user' | 'viewer' | 'manager',
  
  // Permissions
  permissions?: {
    canManageUsers: boolean,
    canManageVendors: boolean,
    canManageInvoices: boolean,
    canManageContracts: boolean,
    canViewReports: boolean,
    canManageSettings: boolean,
    canGrantPortalAccess: boolean
  },
  
  // Account Status
  status: 'active' | 'inactive' | 'suspended',
  emailVerified: boolean,
  verificationToken?: string,
  verificationExpiry?: Date,
  
  // Password Reset
  resetToken?: string,
  resetTokenExpiry?: Date,
  
  // Security
  lastLogin?: Date,
  lastPasswordChange?: Date,
  failedLoginAttempts: number,
  lockedUntil?: Date,
  twoFactorEnabled: boolean,
  twoFactorSecret?: string,
  
  // Preferences
  preferences?: {
    language: string,
    timezone: string,
    notifications: {
      email: boolean,
      push: boolean,
      sms: boolean
    },
    theme: 'light' | 'dark' | 'auto'
  },
  
  // Metadata
  createdAt: Date,
  updatedAt: Date,
  createdBy?: string,
  
  // Indexes
  indexes: [
    { userId: 1 },                  // Unique
    { email: 1 },                   // Unique
    { companyId: 1 },
    { role: 1 },
    { status: 1 },
    { companyId: 1, role: 1 }       // Compound
  ]
}
```

### 3. Vendors Collection

**Purpose**: Supplier/vendor organization data

```typescript
{
  _id: ObjectId,
  vendorId: string,                 // Unique identifier (indexed, unique)
  
  // Basic Information
  name: string,                     // Indexed
  email: string,                    // Indexed
  phone: string,
  service: string,                  // Service category (indexed)
  
  // Multi-tenant
  companyId: string,                // Reference to company (indexed)
  
  // Contact Details
  address?: {
    street: string,
    city: string,
    state: string,
    zipCode: string,
    country: string
  },
  contactPerson?: string,
  
  // Business Details
  taxId?: string,
  legalId?: string,
  website?: string,
  
  // Vendor Management
  status: 'Active' | 'Inactive' | 'Pending' | 'Suspended',
  rating?: number,                  // 1-5 rating
  tags?: string[],                  // Searchable tags
  notes?: string,
  paymentTerms?: string,
  
  // Performance Metrics
  metrics?: {
    totalInvoices: number,
    totalAmount: number,
    onTimePayments: number,
    latePayments: number,
    averageRating: number,
    completedContracts: number
  },
  
  // Compliance
  compliance?: {
    insuranceExpiry?: Date,
    licenseExpiry?: Date,
    certifications?: string[],
    lastAuditDate?: Date
  },
  
  // Metadata
  createdAt: Date,
  updatedAt: Date,
  createdBy: string,
  lastModifiedBy?: string,
  
  // Indexes
  indexes: [
    { vendorId: 1 },                // Unique
    { name: 1 },
    { email: 1 },
    { companyId: 1 },
    { service: 1 },
    { status: 1 },
    { companyId: 1, status: 1 },    // Compound
    { companyId: 1, service: 1 }    // Compound
  ]
}
```

### 4. Vendor Users Collection

**Purpose**: Vendor portal user accounts

```typescript
{
  _id: ObjectId,
  vendorUserId: string,             // Unique identifier (indexed, unique)
  
  // Authentication
  email: string,                    // Indexed, unique
  passwordHash: string,
  
  // Profile
  name: string,
  phone?: string,
  role: 'vendor_admin' | 'vendor_user' | 'vendor_viewer',
  
  // Relationships
  vendorId: string,                 // Reference to vendor (indexed)
  companyId: string,                // Reference to company (indexed)
  
  // Portal Access
  portalAccess: {
    enabled: boolean,
    enabledAt?: Date,
    disabledAt?: Date,
    expiresAt?: Date,
    lastAccessAt?: Date,
    accessCount: number
  },
  
  // Permissions (inherited from company's vendorPortalAccess)
  permissions?: {
    canViewInvoices: boolean,
    canDownloadInvoices: boolean,
    canUpdatePaymentInfo: boolean,
    canViewContracts: boolean,
    canCommunicate: boolean,
    canAccessAnalytics: boolean,
    canSubmitChanges: boolean,
    canEditProfile: boolean
  },
  
  // Account Status
  status: 'active' | 'inactive' | 'suspended',
  emailVerified: boolean,
  
  // Security
  lastLogin?: Date,
  lastPasswordChange?: Date,
  failedLoginAttempts: number,
  lockedUntil?: Date,
  
  // Metadata
  createdAt: Date,
  updatedAt: Date,
  createdBy: string,
  invitedBy?: string,
  
  // Indexes
  indexes: [
    { vendorUserId: 1 },            // Unique
    { email: 1 },                   // Unique
    { vendorId: 1 },
    { companyId: 1 },
    { vendorId: 1, status: 1 },     // Compound
    { companyId: 1, vendorId: 1 }   // Compound
  ]
}
```

### 5. Invoices Collection

**Purpose**: Invoice documents with full details

```typescript
{
  _id: ObjectId,
  invoiceId: string,                // Unique identifier (indexed, unique)
  invoiceNumber: string,            // User-friendly number (indexed)
  
  // Multi-tenant
  companyId: string,                // Reference to company (indexed)
  
  // Relationships
  vendorId?: string,                // Reference to vendor (indexed)
  vendorName: string,               // Denormalized for performance
  contractId?: string,              // Reference to contract (indexed)
  
  // Dates
  invoiceDate: Date,                // Indexed
  invoiceDueDate: Date,             // Indexed
  paymentDate?: Date,
  
  // Parties
  seller: {
    name: string,
    address: Address,
    email?: string,
    phone?: string,
    taxId?: string,
    contactPerson?: string
  },
  buyer: {
    name: string,
    address: Address,
    email?: string,
    phone?: string,
    taxId?: string,
    contactPerson?: string
  },
  
  // Line Items
  items: [{
    id: string,
    description: string,
    quantity: number,
    unitPrice: number,
    total: number,
    taxRate?: number,
    discountRate?: number
  }],
  
  // Financial Summary
  subtotal: number,
  taxes: number,
  taxRate?: number,
  taxType?: 'percentage' | 'fixed',
  discounts: number,
  discountRate?: number,
  discountType?: 'percentage' | 'fixed',
  totalAmount: number,                // Indexed for reporting
  invoiceAmount: number,              // Legacy field
  
  // Status
  status: 'Draft' | 'Sent' | 'Paid' | 'Unpaid' | 'Pending' | 'Overdue' | 'Cancelled',
  paymentStatus: 'Pending' | 'Partial' | 'Paid' | 'Overdue',
  
  // Payment Details
  paymentTerms: string,
  paymentMethod: string,
  paymentSchedule?: [{
    id: string,
    amount: number,
    dueDate: Date,
    status: 'Pending' | 'Paid' | 'Overdue',
    paidDate?: Date
  }],
  
  // Additional Information
  purchaseOrderNumber?: string,
  shippingAddress?: Address,
  shippingMethod?: string,
  termsAndConditions?: string,
  notes?: string,
  
  // Custom Fields
  customFields?: [{
    id: string,
    name: string,
    type: 'text' | 'number' | 'date' | 'select' | 'textarea',
    value: any,
    required: boolean,
    options?: string[]
  }],
  
  // Attachments
  attachments?: [{
    id: string,
    filename: string,
    url: string,
    size: number,
    mimeType: string,
    uploadedAt: Date,
    uploadedBy: string
  }],
  
  // Workflow
  approvalRequired: boolean,
  approvalStatus?: 'pending' | 'approved' | 'rejected',
  approvedBy?: string,
  approvedAt?: Date,
  rejectionReason?: string,
  
  // Metadata
  createdAt: Date,
  updatedAt: Date,
  createdBy: string,
  lastModifiedBy?: string,
  
  // Indexes
  indexes: [
    { invoiceId: 1 },               // Unique
    { invoiceNumber: 1 },           // Unique per company
    { companyId: 1 },
    { vendorId: 1 },
    { contractId: 1 },
    { invoiceDate: -1 },
    { invoiceDueDate: 1 },
    { status: 1 },
    { paymentStatus: 1 },
    { totalAmount: 1 },
    { companyId: 1, status: 1 },              // Compound
    { companyId: 1, vendorId: 1 },            // Compound
    { companyId: 1, invoiceDate: -1 },        // Compound
    { companyId: 1, paymentStatus: 1 },       // Compound
    { vendorId: 1, invoiceDate: -1 }          // Compound
  ]
}
```

### 6. Contracts Collection

**Purpose**: Contract agreements between parties

```typescript
{
  _id: ObjectId,
  contractId: string,               // Unique identifier (indexed, unique)
  
  // Multi-tenant
  companyId: string,                // Reference to company (indexed)
  
  // Basic Information
  title: string,
  description?: string,
  type?: 'Service' | 'Product' | 'Maintenance' | 'Subscription' | 'Custom',
  
  // Parties (Bi-directional)
  partyA: {
    id: string,                     // 'company' or vendorId
    name: string,
    role: 'Client' | 'Provider'
  },
  partyB: {
    id: string,
    name: string,
    role: 'Client' | 'Provider'
  },
  
  // Legacy (for backward compatibility)
  vendorId?: string,                // Reference to vendor (indexed)
  vendorName?: string,
  
  // Financial
  value: number,
  currency: string,
  paymentTerms: string,
  
  // Timeline
  startDate: Date,                  // Indexed
  endDate: Date,                    // Indexed
  signedAt?: Date,
  signedBy?: string,
  
  // Renewal
  autoRenew: boolean,
  renewalPeriod?: number,           // in months
  renewalNotice?: number,           // days before renewal
  
  // Status
  status: 'Draft' | 'Active' | 'Pending' | 'Expired' | 'Terminated' | 'Renewed',
  
  // Milestones
  milestones?: [{
    id: string,
    title: string,
    description?: string,
    dueDate: Date,
    amount: number,
    status: 'Pending' | 'In Progress' | 'Completed' | 'Overdue',
    deliverables?: string[],
    completedAt?: Date,
    completedBy?: string
  }],
  
  // KPIs (Key Performance Indicators)
  kpis?: [{
    id: string,
    name: string,
    target: number,
    actual?: number,
    unit: string,
    description?: string,
    lastUpdated?: Date
  }],
  
  // Terms
  termsAndConditions?: string,
  deliverables?: string[],
  tags?: string[],
  notes?: string,
  
  // Files
  files?: [{
    id: string,
    filename: string,
    url: string,
    type: 'contract' | 'amendment' | 'attachment',
    size: number,
    mimeType: string,
    uploadedAt: Date,
    uploadedBy: string
  }],
  
  // Reminders
  reminders?: [{
    id: string,
    type: 'renewal' | 'milestone' | 'expiry' | 'custom',
    date: Date,
    message: string,
    sent: boolean,
    sentAt?: Date
  }],
  
  // Acknowledgment (for vendor portal)
  acknowledged: boolean,
  acknowledgedAt?: Date,
  acknowledgedBy?: string,
  
  // Metadata
  createdAt: Date,
  updatedAt: Date,
  createdBy: string,
  lastModifiedBy?: string,
  
  // Indexes
  indexes: [
    { contractId: 1 },              // Unique
    { companyId: 1 },
    { vendorId: 1 },
    { status: 1 },
    { startDate: -1 },
    { endDate: 1 },
    { companyId: 1, status: 1 },              // Compound
    { companyId: 1, vendorId: 1 },            // Compound
    { companyId: 1, endDate: 1 },             // Compound
    { vendorId: 1, status: 1 }                // Compound
  ]
}
```

### 7. Notifications Collection

**Purpose**: System-wide notifications and alerts

```typescript
{
  _id: ObjectId,
  notificationId: string,           // Unique identifier (indexed, unique)
  
  // Multi-tenant
  companyId: string,                // Reference to company (indexed)
  
  // Target
  recipientType: 'user' | 'vendor' | 'company' | 'broadcast',
  recipientId: string,              // User ID, Vendor ID, or 'all' (indexed)
  
  // Content
  type: 'invoice' | 'contract' | 'payment' | 'access' | 'system' | 'reminder' | 'alert',
  priority: 'low' | 'medium' | 'high' | 'urgent',
  title: string,
  message: string,
  
  // Related Data
  relatedEntity?: {
    type: 'invoice' | 'contract' | 'vendor' | 'user',
    id: string
  },
  
  // Action
  actionUrl?: string,
  actionLabel?: string,
  
  // Status
  read: boolean,
  readAt?: Date,
  dismissed: boolean,
  dismissedAt?: Date,
  
  // Delivery
  channels: {
    email: boolean,
    push: boolean,
    inApp: boolean,
    sms: boolean
  },
  deliveryStatus: {
    email?: 'pending' | 'sent' | 'failed',
    push?: 'pending' | 'sent' | 'failed',
    sms?: 'pending' | 'sent' | 'failed'
  },
  sentAt?: Date,
  
  // Expiry
  expiresAt?: Date,
  
  // Metadata
  createdAt: Date,
  createdBy: string,
  
  // Indexes
  indexes: [
    { notificationId: 1 },          // Unique
    { companyId: 1 },
    { recipientId: 1 },
    { type: 1 },
    { read: 1 },
    { createdAt: -1 },
    { companyId: 1, recipientId: 1, read: 1 },  // Compound
    { recipientId: 1, createdAt: -1 }            // Compound
  ]
}
```

### 8. Audit Logs Collection

**Purpose**: Complete audit trail for all system actions

```typescript
{
  _id: ObjectId,
  logId: string,                    // Unique identifier (indexed, unique)
  
  // Multi-tenant
  companyId: string,                // Reference to company (indexed)
  
  // Actor
  actorType: 'user' | 'vendor' | 'system',
  actorId: string,                  // User ID or Vendor User ID (indexed)
  actorName: string,
  actorEmail?: string,
  
  // Action
  action: 'create' | 'read' | 'update' | 'delete' | 'login' | 'logout' | 
          'grant_access' | 'revoke_access' | 'approve' | 'reject' | 
          'export' | 'import' | 'send' | 'download',
  resource: 'invoice' | 'contract' | 'vendor' | 'user' | 'company' | 
            'settings' | 'portal_access' | 'notification',
  resourceId?: string,              // ID of affected resource
  
  // Details
  description: string,
  changes?: {
    before?: any,                   // Previous state
    after?: any,                    // New state
    fields?: string[]               // Changed fields
  },
  
  // Context
  ipAddress?: string,
  userAgent?: string,
  location?: string,
  device?: string,
  
  // Result
  status: 'success' | 'failure' | 'partial',
  errorMessage?: string,
  
  // Severity
  severity: 'info' | 'warning' | 'error' | 'critical',
  
  // Metadata
  timestamp: Date,                  // Indexed
  sessionId?: string,
  requestId?: string,
  
  // Indexes
  indexes: [
    { logId: 1 },                   // Unique
    { companyId: 1 },
    { actorId: 1 },
    { action: 1 },
    { resource: 1 },
    { resourceId: 1 },
    { timestamp: -1 },
    { companyId: 1, timestamp: -1 },          // Compound
    { actorId: 1, timestamp: -1 },            // Compound
    { resource: 1, resourceId: 1 },           // Compound
    { companyId: 1, action: 1, timestamp: -1 } // Compound
  ]
}
```

### 9. Sessions Collection

**Purpose**: User and vendor session management

```typescript
{
  _id: ObjectId,
  sessionId: string,                // Unique identifier (indexed, unique)
  
  // User Information
  userType: 'user' | 'vendor',
  userId: string,                   // User ID or Vendor User ID (indexed)
  companyId: string,                // Reference to company (indexed)
  vendorId?: string,                // For vendor users
  
  // Session Data
  token: string,                    // JWT or session token (indexed, unique)
  refreshToken?: string,
  
  // Authentication
  authenticatedAt: Date,
  lastActivityAt: Date,             // Indexed
  expiresAt: Date,                  // Indexed, TTL index
  
  // Device & Location
  ipAddress: string,
  userAgent: string,
  device?: {
    type: 'desktop' | 'mobile' | 'tablet',
    os: string,
    browser: string
  },
  location?: {
    country: string,
    city?: string,
    region?: string
  },
  
  // Security
  twoFactorVerified: boolean,
  trustedDevice: boolean,
  
  // Status
  active: boolean,
  revokedAt?: Date,
  revocationReason?: string,
  
  // Metadata
  createdAt: Date,
  
  // Indexes
  indexes: [
    { sessionId: 1 },               // Unique
    { token: 1 },                   // Unique
    { userId: 1 },
    { companyId: 1 },
    { lastActivityAt: -1 },
    { expiresAt: 1 },               // TTL index (auto-delete expired)
    { userId: 1, active: 1 }        // Compound
  ]
}
```

### 10. Vendor Pending Changes Collection

**Purpose**: Track vendor-submitted data change requests

```typescript
{
  _id: ObjectId,
  changeId: string,                 // Unique identifier (indexed, unique)
  
  // Multi-tenant
  companyId: string,                // Reference to company (indexed)
  
  // Change Request
  changeType: 'profile_update' | 'invoice_correction' | 'contract_amendment' | 'payment_update',
  targetResource: 'vendor' | 'invoice' | 'contract',
  targetResourceId: string,         // ID of resource to change (indexed)
  
  // Submitted By
  submittedBy: string,              // Vendor User ID
  submittedByName: string,
  submittedByEmail: string,
  vendorId: string,                 // Reference to vendor (indexed)
  
  // Change Details
  currentData?: any,                // Current state
  proposedChanges: any,             // Proposed new state
  reason?: string,                  // Reason for change
  attachments?: [{
    id: string,
    filename: string,
    url: string,
    size: number,
    uploadedAt: Date
  }],
  
  // Review
  status: 'pending' | 'under_review' | 'approved' | 'rejected' | 'cancelled',
  reviewedBy?: string,              // User ID who reviewed
  reviewedByName?: string,
  reviewedAt?: Date,
  reviewNotes?: string,
  rejectionReason?: string,
  
  // Workflow
  priority: 'low' | 'normal' | 'high' | 'urgent',
  approvalRequired: boolean,
  autoApprove: boolean,
  
  // Metadata
  createdAt: Date,
  updatedAt: Date,
  completedAt?: Date,
  
  // Indexes
  indexes: [
    { changeId: 1 },                // Unique
    { companyId: 1 },
    { vendorId: 1 },
    { targetResourceId: 1 },
    { status: 1 },
    { createdAt: -1 },
    { companyId: 1, status: 1 },              // Compound
    { vendorId: 1, status: 1 },               // Compound
    { companyId: 1, createdAt: -1 }           // Compound
  ]
}
```

### 11. Compliance Documents Collection

**Purpose**: Store compliance-related documents and certifications

```typescript
{
  _id: ObjectId,
  documentId: string,               // Unique identifier (indexed, unique)
  
  // Multi-tenant
  companyId: string,                // Reference to company (indexed)
  
  // Related Entity
  entityType: 'vendor' | 'company',
  entityId: string,                 // Vendor ID or Company ID (indexed)
  
  // Document Information
  type: 'insurance' | 'license' | 'certification' | 'audit' | 'tax' | 'legal' | 'other',
  title: string,
  description?: string,
  
  // File Details
  filename: string,
  url: string,
  size: number,
  mimeType: string,
  
  // Validity
  issueDate?: Date,
  expiryDate?: Date,                // Indexed for expiry notifications
  
  // Verification
  verified: boolean,
  verifiedBy?: string,
  verifiedAt?: Date,
  verificationNotes?: string,
  
  // Status
  status: 'active' | 'expired' | 'pending_renewal' | 'revoked',
  
  // Reminders
  reminderSent: boolean,
  reminderSentAt?: Date,
  
  // Metadata
  uploadedBy: string,
  uploadedAt: Date,
  updatedAt: Date,
  
  // Indexes
  indexes: [
    { documentId: 1 },              // Unique
    { companyId: 1 },
    { entityId: 1 },
    { type: 1 },
    { expiryDate: 1 },
    { status: 1 },
    { companyId: 1, entityId: 1 },            // Compound
    { entityId: 1, type: 1 },                 // Compound
    { companyId: 1, expiryDate: 1 }           // Compound
  ]
}
```

### 12. Data Sync Queue Collection

**Purpose**: Queue for data synchronization tasks

```typescript
{
  _id: ObjectId,
  queueId: string,                  // Unique identifier (indexed, unique)
  
  // Multi-tenant
  companyId: string,                // Reference to company (indexed)
  
  // Sync Task
  syncType: 'invoice' | 'vendor' | 'contract' | 'user' | 'full',
  operation: 'create' | 'update' | 'delete',
  priority: number,                 // Higher = more important (indexed)
  
  // Source & Target
  sourceSystem: string,             // e.g., 'internal', 'external_api'
  targetSystem: string,
  
  // Data
  entityType: 'invoice' | 'vendor' | 'contract' | 'user',
  entityId: string,
  payload: any,
  
  // Status
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'retry',
  retryCount: number,
  maxRetries: number,
  lastError?: string,
  
  // Execution
  scheduledFor?: Date,              // For delayed execution
  startedAt?: Date,
  completedAt?: Date,
  processingDuration?: number,      // milliseconds
  
  // Metadata
  createdAt: Date,                  // Indexed
  updatedAt: Date,
  
  // Indexes
  indexes: [
    { queueId: 1 },                 // Unique
    { companyId: 1 },
    { status: 1 },
    { priority: -1 },
    { createdAt: 1 },
    { scheduledFor: 1 },
    { companyId: 1, status: 1, priority: -1 } // Compound
  ]
}
```

## Index Strategy

### Performance Optimization
1. **Single-field indexes** on frequently queried fields
2. **Compound indexes** for common query patterns
3. **TTL indexes** for automatic cleanup (sessions, notifications)
4. **Text indexes** for full-text search (if needed in Phase 3)

### Index Best Practices
- Use `{ field: 1 }` for ascending order
- Use `{ field: -1 }` for descending order  
- Compound indexes should match query patterns
- Most selective fields first in compound indexes
- Monitor index usage and remove unused indexes

## Data Integrity Rules

### 1. Required Fields
- All documents must have `_id`, `createdAt`, and `updatedAt`
- Multi-tenant documents must have `companyId`
- Users must have unique `email` within the system
- Vendors must have unique combination of `companyId` + `name`

### 2. Referential Integrity
- `companyId` must reference existing company
- `vendorId` must reference existing vendor
- `userId` must reference existing user
- Use application-level checks (MongoDB doesn't enforce FK)

### 3. Data Validation
- Email formats must be valid
- Dates must be in ISO 8601 format
- Status fields must match allowed enums
- Financial values must be non-negative

### 4. Cascading Operations
- Deleting company: Archive or soft-delete
- Deleting vendor: Handle related invoices/contracts
- Deleting user: Transfer ownership or soft-delete
- Use flags instead of hard deletes where possible

## Migration Strategy

### Phase 2 Implementation Steps

1. **Create Schema Validation** (Week 1)
   - Define JSON Schema for each collection
   - Apply validation rules in MongoDB
   - Test validation with sample data

2. **Build Indexes** (Week 1)
   - Create all defined indexes
   - Analyze query patterns
   - Optimize based on usage

3. **Data Migration Scripts** (Week 2)
   - Migrate existing data to new schema
   - Backfill missing fields with defaults
   - Verify data integrity

4. **Update Application Code** (Week 2)
   - Update DAL (Data Access Layer)
   - Fix type definitions
   - Update queries to use indexes

5. **Testing & Validation** (Week 3)
   - Unit tests for data operations
   - Integration tests for relationships
   - Performance testing with indexes

## Next Phase Preview

**Phase 3: Authentication & Authorization System**
- Unified auth system for users and vendors
- Role-based access control (RBAC)
- Permission management
- Session handling
- Password policies
- Two-factor authentication

---

*Schema design complete. Ready for implementation.*