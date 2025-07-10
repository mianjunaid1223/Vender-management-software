export type Vendor = {
  id: string;
  name: string;
  email: string;
  phone: string;
  service: string;
  
  // Enhanced vendor fields
  address?: InvoiceAddress;
  taxId?: string;
  contactPerson?: string;
  paymentTerms?: string;
  status?: 'Active' | 'Inactive' | 'Pending';
  
  // Metadata
  createdAt?: string;
  updatedAt?: string;
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
  value: string;
  required?: boolean;
  options?: string[]; // For select type
};

export type Invoice = {
  id: string;
  invoiceNumber: string;
  invoiceDate: string;
  invoiceDueDate: string;
  
  // Entity information
  seller: InvoiceEntity;
  buyer: InvoiceEntity;
  
  // Items and pricing
  items: InvoiceItem[];
  subtotal: number;
  taxes: number;
  discounts: number;
  totalAmount: number;
  
  // Status and tracking
  status: 'Draft' | 'Sent' | 'Paid' | 'Unpaid' | 'Overdue' | 'Cancelled';
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
}

export type Contract = {
  id: string;
  title: string;
  vendorId: string;
  vendorName: string;
  startDate: string;
  endDate: string;
  value: number;
  status: 'Active' | 'Expired' | 'Terminated' | 'Draft';
  paymentTerms: string;
  description?: string;
  
  // Metadata
  createdAt: string;
  updatedAt: string;
};
