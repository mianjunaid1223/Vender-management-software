

export type Vendor = {
  id: string;
  name: string;
  email: string;
  phone: string;
  service: string;
  
  // Multi-tenant field
  companyId: string;
  
  // Enhanced vendor fields
  address?: InvoiceAddress;
  taxId?: string;
  contactPerson?: string;
  paymentTerms?: string;
  status?: 'Active' | 'Inactive' | 'Pending';
  tags?: string[];
  notes?: string;
  rating?: number;
  
  // Metadata
  createdAt?: string;
  updatedAt?: string;
};

export type VendorApplication = {
  id: string;
  applicationId: string;
  name: string;           // Company name
  contactPerson: string;  // Contact person name
  email: string;
  phone: string;
  service: string;        // Main service offered
  taxId: string;
  address: InvoiceAddress;
  paymentTerms: string;
  notes: string;
  targetCompanyId: string;
  status: 'pending' | 'approved' | 'rejected';
  submittedAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
  inviteToken?: string;
};

export type InvoiceItem = {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
};

export type InvoiceAddress = {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
};

export type InvoiceEntity = {
  name: string;
  address: InvoiceAddress;
  email?: string;
  phone?: string;
  taxId?: string;
  contactPerson?: string;
};

export type PaymentSchedule = {
  id: string;
  amount: number;
  dueDate: string;
  status: 'Pending' | 'Paid' | 'Overdue';
};

export type CustomField = {
  id: string;
  name: string;
  type: 'text' | 'number' | 'date' | 'select' | 'textarea';
  value: any;
  required?: boolean;
  options?: string[]; // For select type
};

export type Invoice = {
  id: string;
  invoiceNumber: string;
  invoiceDate: string;
  invoiceDueDate: string;
  
  // Multi-tenant field
  companyId: string;
  
  // Entity information
  seller: InvoiceEntity;
  buyer: InvoiceEntity;
  
  // Items and pricing
  items: InvoiceItem[];
  subtotal: number;
  taxes: number;
  taxRate?: number; // Tax rate as percentage (e.g., 8.5 for 8.5%)
  taxType?: 'percentage' | 'fixed'; // Type of tax calculation
  discounts: number;
  discountRate?: number; // Discount rate as percentage
  discountType?: 'percentage' | 'fixed'; // Type of discount calculation
  totalAmount: number;
  currency: string; // Currency code (USD, EUR, GBP, etc.)
  
  // Status and tracking
  status: 'Draft' | 'Sent' | 'Paid' | 'Unpaid' | 'Pending' | 'Overdue' | 'Cancelled';
  paymentStatus: 'Pending' | 'Partial' | 'Paid' | 'Overdue';
  
  // Payment information
  paymentTerms: string;
  paymentMethod: string;
  paymentSchedule?: PaymentSchedule[];
  
  // Optional fields
  purchaseOrderNumber?: string;
  shippingAddress?: InvoiceAddress;
  shippingMethod?: string;
  termsAndConditions?: string;
  notes?: string;
  
  // Integration fields
  vendorId?: string;
  contractId?: string;
  
  // Custom fields
  customFields?: CustomField[];
  
  // Metadata
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  
  // Legacy fields for backward compatibility
  vendorName: string;
  invoiceAmount: number;
};

export type User = {
    id: string;
    name: string;
    email: string;
    image?: string;
    role?: string;
    companyId: string; // Multi-tenant field - User belongs to a company
}

export type ContractParty = {
  id: string; // can be 'company' or a vendor ID
  name: string;
  role: 'Client' | 'Provider';
};

export type Contract = {
  id: string;
  title: string;
  
  // Multi-tenant field
  companyId: string;
  
  // Bi-directional party system
  partyA: ContractParty;
  partyB: ContractParty;
  
  startDate: string;
  endDate: string;
  value: number;
  status: ContractStatus;
  paymentTerms: string;
  description?: string;
  
  // Enhanced contract fields
  type?: ContractType;
  currency?: string;
  autoRenew?: boolean;
  renewalPeriod?: number; // in months
  renewalNotice?: number; // days before renewal
  milestones?: ContractMilestone[];
  files?: ContractFile[];
  reminders?: ContractReminder[];
  tags?: string[];
  notes?: string;
  
  // Terms and conditions
  termsAndConditions?: string;
  deliverables?: string[];
  kpis?: ContractKPI[];
  
  // Metadata
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
  signedAt?: string;
  signedBy?: string;

  // Legacy fields for backward compatibility
  vendorId?: string;
  vendorName?: string;
};

export type ContractMilestone = {
  id: string;
  title: string;
  description?: string;
  dueDate: string;
  amount: number;
  status: 'Pending' | 'In Progress' | 'Completed' | 'Overdue';
  deliverables?: string[];
};

export type ContractKPI = {
  id: string;
  name: string;
  target: number;
  actual?: number;
  unit: string;
  description?: string;
};

// Agency/Company Types
export type Company = {
  id: string; // This will store the MongoDB _id as a string
  companyId: string; // This is the unique, shareable ID for the company
  name: string;
  businessType: string;
  industry?: string;
  addresses: InvoiceAddress[];
  primaryAddress?: InvoiceAddress;
  taxId?: string;
  legalId?: string;
  contacts: ContactInfo[];
  primaryContact?: ContactInfo;
  website?: string;
  description?: string;
  otherIdentifiers?: Record<string, string>;
  preferences?: CompanyPreferences;
  
  // Metadata
  createdAt: string;
  updatedAt: string;
  createdBy: string;
};

export type ContactInfo = {
  id: string;
  name: string;
  email: string;
  phone: string;
  role?: string;
  isPrimary?: boolean;
};

export type CompanyPreferences = {
  defaultPaymentTerms?: string;
  baseCurrency: string; // Required: Single base currency for all financial data
  defaultTaxRate?: number;
  emailNotifications?: boolean;
  invoiceReminders?: boolean;
  contractReminders?: boolean;
  preferredLanguage?: string;
};

// Currency conversion types
export type CurrencyConversion = {
  fromCurrency: string;
  toCurrency: string;
  exchangeRate: number;
  convertedAmount: number;
  originalAmount: number;
  conversionDate: string;
};

export type FileImportCurrency = {
  fileCurrency: string;
  exchangeRate: number;
  convertToBase: boolean;
};

// Enhanced AI Context Types
export type AIContext = {
  user: User;
  company: Company;
  recentInvoices: Invoice[];
  activeVendors: Vendor[];
  activeContracts: Contract[];
  preferences: CompanyPreferences;
  currentModule: string;
  lastActions: ActionLog[];
};

export type ActionLog = {
  id: string;
  action: string;
  module: string;
  timestamp: string;
  details?: Record<string, any>;
  // Multi-tenant field
  companyId: string;
};

// Enhanced Contract Types
export type ContractType = 'Service' | 'Product' | 'Subscription' | 'One-time' | 'Framework';

export type ContractStatus = 'Draft' | 'Active' | 'Pending' | 'Expired' | 'Terminated' | 'Suspended';

export type ContractReminder = {
  id: string;
  type: 'renewal' | 'expiry' | 'payment' | 'milestone';
  date: string;
  message: string;
  isActive: boolean;
};

export type ContractFile = {
  id: string;
  name: string;
  type: string;
  size: number;
  url: string;
  uploadedAt: string;
  uploadedBy: string;
};

// Onboarding Types
export type OnboardingStep = {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  required: boolean;
  fields: OnboardingField[];
};

export type OnboardingField = {
  id: string;
  name: string;
  type: 'text' | 'email' | 'phone' | 'select' | 'multiselect' | 'textarea' | 'date' | 'file';
  label: string;
  required: boolean;
  options?: string[];
  validation?: FieldValidation;
};

export type FieldValidation = {
  pattern?: string;
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  custom?: (value: any) => boolean | string;
};

// Search and Filter Types
export type SearchFilters = {
  query?: string;
  status?: string[];
  dateRange?: {
    start: string;
    end: string;
  };
  tags?: string[];
  category?: string;
  amountRange?: {
    min: number;
    max: number;
  };
};

export type SortOption = {
  field: string;
  direction: 'asc' | 'desc';
};

// Notification Types
export type NotificationType = 'info' | 'success' | 'warning' | 'error';

export type Notification = {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  expiresAt?: string;
  actions?: NotificationAction[];
  relatedEntity?: {
    type: 'invoice' | 'contract' | 'vendor';
    id: string;
  };
  // Multi-tenant field
  companyId: string;
};

export type NotificationAction = {
  id: string;
  label: string;
  action: string;
  isPrimary?: boolean;
};

    