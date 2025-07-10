
export type Vendor = {
  id: string;
  name: string;
  email: string;
  phone: string;
  service: string;
  // Enhanced vendor data
  address?: string;
  taxId?: string;
  website?: string;
  primaryContact?: string;
  paymentTerms?: string;
  bankDetails?: {
    accountNumber?: string;
    routingNumber?: string;
    bankName?: string;
  };
  // Performance tracking
  performanceMetrics?: {
    onTimeDeliveryRate: number;
    qualityScore: number;
    responseTime: number; // in hours
    averageRating: number;
  };
  // Compliance and risk
  complianceStatus: 'Compliant' | 'Needs Review' | 'Non-Compliant';
  riskLevel: 'Low' | 'Medium' | 'High';
  complianceDocuments?: ComplianceDocument[];
  // Audit trail
  createdAt: Date;
  updatedAt: Date;
  lastReviewDate?: Date;
  // Status
  isActive: boolean;
  isOnboarded: boolean;
  tags?: string[];
};

export type ComplianceDocument = {
  id: string;
  vendorId: string;
  documentType: string;
  fileName: string;
  fileUrl: string;
  expiryDate?: Date;
  status: 'Valid' | 'Expired' | 'Expiring Soon';
  uploadedAt: Date;
  uploadedBy: string;
};

export type Contract = {
  id: string;
  vendorId: string;
  contractNumber: string;
  title: string;
  startDate: Date;
  endDate: Date;
  value: number;
  status: 'Active' | 'Expired' | 'Terminated' | 'Pending';
  autoRenewal: boolean;
  renewalTerms?: string;
  terms?: string;
  fileUrl?: string;
  createdAt: Date;
  updatedAt: Date;
  notifications?: ContractNotification[];
};

export type ContractNotification = {
  id: string;
  contractId: string;
  type: 'Renewal' | 'Expiry' | 'Review';
  message: string;
  dueDate: Date;
  isRead: boolean;
  createdAt: Date;
};

export type Invoice = {
  id: string;
  vendorId: string;
  vendorName: string;
  invoiceAmount: number;
  invoiceDueDate: string;
  invoiceNumber: string;
  invoiceDate: string;
  status: 'Paid' | 'Unpaid' | 'Overdue' | 'Pending Approval';
  // Enhanced invoice data
  description?: string;
  lineItems?: InvoiceLineItem[];
  taxAmount?: number;
  discountAmount?: number;
  totalAmount: number;
  paymentDate?: Date;
  paymentMethod?: string;
  purchaseOrderNumber?: string;
  category?: string;
  // File attachments
  attachments?: string[];
  // Approval workflow
  approvalStatus: 'Pending' | 'Approved' | 'Rejected';
  approvedBy?: string;
  approvedAt?: Date;
  rejectionReason?: string;
  // Audit trail
  createdAt: Date;
  updatedAt: Date;
  processedBy?: string;
};

export type InvoiceLineItem = {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  category?: string;
};

export type User = {
  id: string;
  name: string;
  email: string;
  image?: string;
  // Enhanced user data
  role: 'Admin' | 'Manager' | 'User';
  permissions: string[];
  // Business context
  businessInfo?: BusinessInfo;
  preferences?: UserPreferences;
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt?: Date;
  isActive: boolean;
};

export type BusinessInfo = {
  companyName: string;
  industry: string;
  size: 'Small' | 'Medium' | 'Large';
  location: string;
  vendorPolicies?: string;
  priorities?: string[];
  operationalFocus?: string;
  complianceRequirements?: string[];
};

export type UserPreferences = {
  notifications: {
    email: boolean;
    inApp: boolean;
    contractRenewals: boolean;
    complianceAlerts: boolean;
    invoiceApprovals: boolean;
  };
  dashboard: {
    layout: 'compact' | 'detailed';
    defaultView: 'overview' | 'vendors' | 'invoices';
    kpiPreferences: string[];
  };
};

export type AuditLog = {
  id: string;
  userId: string;
  action: string;
  entityType: 'Vendor' | 'Invoice' | 'Contract' | 'User';
  entityId: string;
  changes?: Record<string, any>;
  timestamp: Date;
  ipAddress?: string;
  userAgent?: string;
  notes?: string;
};

export type Notification = {
  id: string;
  userId: string;
  type: 'Contract Renewal' | 'Compliance Alert' | 'Invoice Due' | 'Performance Alert' | 'System';
  title: string;
  message: string;
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  isRead: boolean;
  actionUrl?: string;
  createdAt: Date;
  expiresAt?: Date;
};

export type DashboardKPI = {
  id: string;
  label: string;
  value: string | number;
  change?: number;
  trend: 'up' | 'down' | 'stable';
  type: 'currency' | 'percentage' | 'number' | 'count';
  category: 'financial' | 'compliance' | 'performance' | 'operational';
};

export type VendorPerformanceReport = {
  vendorId: string;
  period: {
    start: Date;
    end: Date;
  };
  metrics: {
    totalSpend: number;
    invoiceCount: number;
    averageInvoiceValue: number;
    onTimePaymentRate: number;
    onTimeDeliveryRate: number;
    qualityScore: number;
    responseTime: number;
    complianceScore: number;
  };
  trends: {
    spendTrend: 'increasing' | 'decreasing' | 'stable';
    performanceTrend: 'improving' | 'declining' | 'stable';
  };
  recommendations: string[];
  riskFactors: string[];
};

export type OnboardingStep = {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'in-progress' | 'completed' | 'failed';
  requiredFields: string[];
  completedAt?: Date;
  notes?: string;
};

export type VendorOnboarding = {
  id: string;
  vendorId: string;
  status: 'initiated' | 'in-progress' | 'completed' | 'failed';
  steps: OnboardingStep[];
  startedAt: Date;
  completedAt?: Date;
  assignedTo?: string;
  notes?: string;
};
