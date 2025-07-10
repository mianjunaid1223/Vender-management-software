import { Invoice, Vendor, Contract } from "@/lib/types";

export const MOCK_VENDORS: Vendor[] = [
  { 
    id: "VEN-001", 
    name: "Innovate Inc.", 
    email: "contact@innovate.com", 
    phone: "123-456-7890", 
    service: "Software Development",
    address: {
      street: "123 Tech Street",
      city: "San Francisco",
      state: "CA",
      zipCode: "94105",
      country: "US"
    },
    taxId: "12-3456789",
    contactPerson: "John Smith",
    paymentTerms: "Net 30",
    status: "Active",
    createdAt: "2024-01-15T10:00:00Z",
    updatedAt: "2024-07-01T10:00:00Z"
  },
  { 
    id: "VEN-002", 
    name: "Design Co.", 
    email: "hello@designco.com", 
    phone: "234-567-8901", 
    service: "Graphic Design",
    address: {
      street: "456 Creative Ave",
      city: "New York",
      state: "NY",
      zipCode: "10001",
      country: "US"
    },
    taxId: "98-7654321",
    contactPerson: "Sarah Johnson",
    paymentTerms: "Net 15",
    status: "Active",
    createdAt: "2024-02-20T10:00:00Z",
    updatedAt: "2024-06-15T10:00:00Z"
  },
  { 
    id: "VEN-003", 
    name: "Marketing Solutions", 
    email: "info@marketingsolutions.com", 
    phone: "345-678-9012", 
    service: "Digital Marketing",
    address: {
      street: "789 Marketing Blvd",
      city: "Los Angeles",
      state: "CA",
      zipCode: "90210",
      country: "US"
    },
    taxId: "55-1234567",
    contactPerson: "Mike Davis",
    paymentTerms: "Net 45",
    status: "Active",
    createdAt: "2024-03-10T10:00:00Z",
    updatedAt: "2024-07-05T10:00:00Z"
  },
  { 
    id: "VEN-004", 
    name: "Cloud Services Ltd.", 
    email: "support@cloudltd.com", 
    phone: "456-789-0123", 
    service: "Cloud Hosting",
    address: {
      street: "321 Cloud Lane",
      city: "Seattle",
      state: "WA",
      zipCode: "98101",
      country: "US"
    },
    taxId: "77-9876543",
    contactPerson: "Lisa Chen",
    paymentTerms: "Net 30",
    status: "Active",
    createdAt: "2024-01-25T10:00:00Z",
    updatedAt: "2024-06-20T10:00:00Z"
  },
  { 
    id: "VEN-005", 
    name: "Office Supplies R Us", 
    email: "sales@officesupplies.com", 
    phone: "567-890-1234", 
    service: "Office Supplies",
    address: {
      street: "654 Supply St",
      city: "Chicago",
      state: "IL",
      zipCode: "60601",
      country: "US"
    },
    taxId: "33-4567890",
    contactPerson: "Robert Wilson",
    paymentTerms: "Net 30",
    status: "Active",
    createdAt: "2024-02-01T10:00:00Z",
    updatedAt: "2024-07-10T10:00:00Z"
  },
];

export const MOCK_CONTRACTS: Contract[] = [
  {
    id: "CON-001",
    title: "Software Development Services",
    vendorId: "VEN-001",
    vendorName: "Innovate Inc.",
    startDate: "2024-01-01",
    endDate: "2024-12-31",
    value: 120000,
    status: "Active",
    paymentTerms: "Net 30",
    description: "Annual software development and maintenance services",
    createdAt: "2024-01-15T10:00:00Z",
    updatedAt: "2024-07-01T10:00:00Z"
  },
  {
    id: "CON-002",
    title: "Brand Design Package",
    vendorId: "VEN-002",
    vendorName: "Design Co.",
    startDate: "2024-03-01",
    endDate: "2024-08-31",
    value: 25000,
    status: "Active",
    paymentTerms: "Net 15",
    description: "Complete brand redesign and marketing materials",
    createdAt: "2024-02-20T10:00:00Z",
    updatedAt: "2024-06-15T10:00:00Z"
  },
  {
    id: "CON-003",
    title: "Digital Marketing Campaign",
    vendorId: "VEN-003",
    vendorName: "Marketing Solutions",
    startDate: "2024-06-01",
    endDate: "2024-11-30",
    value: 45000,
    status: "Active",
    paymentTerms: "Net 45",
    description: "6-month digital marketing campaign",
    createdAt: "2024-03-10T10:00:00Z",
    updatedAt: "2024-07-05T10:00:00Z"
  }
];

export const MOCK_INVOICES: Invoice[] = [
  {
    id: "INV-2024-001",
    invoiceNumber: "INV-2024-001",
    invoiceDate: "2024-07-01",
    invoiceDueDate: "2024-07-31",
    
    seller: {
      name: "Your Company Inc.",
      address: {
        street: "100 Business St",
        city: "San Francisco",
        state: "CA",
        zipCode: "94105",
        country: "US"
      },
      email: "billing@yourcompany.com",
      phone: "555-123-4567",
      taxId: "12-3456789"
    },
    
    buyer: {
      name: "Innovate Inc.",
      address: {
        street: "123 Tech Street",
        city: "San Francisco",
        state: "CA",
        zipCode: "94105",
        country: "US"
      },
      email: "contact@innovate.com",
      phone: "123-456-7890",
      taxId: "12-3456789",
      contactPerson: "John Smith"
    },
    
    items: [
      {
        id: "item-1",
        description: "Software Development Services - Q2 2024",
        quantity: 1,
        unitPrice: 5000,
        total: 5000
      }
    ],
    
    subtotal: 5000,
    taxes: 450,
    discounts: 0,
    totalAmount: 5450,
    
    status: "Unpaid",
    paymentStatus: "Pending",
    paymentTerms: "Net 30",
    paymentMethod: "Bank Transfer",
    
    vendorId: "VEN-001",
    vendorName: "Innovate Inc.",
    contractId: "CON-001",
    
    createdAt: "2024-07-01T10:00:00Z",
    updatedAt: "2024-07-01T10:00:00Z",
    createdBy: "user-1",
    
    // Legacy fields
    invoiceAmount: 5450
  },
  {
    id: "INV-2024-002",
    invoiceNumber: "INV-2024-002",
    invoiceDate: "2024-07-05",
    invoiceDueDate: "2024-07-20",
    
    seller: {
      name: "Your Company Inc.",
      address: {
        street: "100 Business St",
        city: "San Francisco",
        state: "CA",
        zipCode: "94105",
        country: "US"
      },
      email: "billing@yourcompany.com",
      phone: "555-123-4567",
      taxId: "12-3456789"
    },
    
    buyer: {
      name: "Design Co.",
      address: {
        street: "456 Creative Ave",
        city: "New York",
        state: "NY",
        zipCode: "10001",
        country: "US"
      },
      email: "hello@designco.com",
      phone: "234-567-8901",
      taxId: "98-7654321",
      contactPerson: "Sarah Johnson"
    },
    
    items: [
      {
        id: "item-2",
        description: "Logo Design",
        quantity: 1,
        unitPrice: 800,
        total: 800
      },
      {
        id: "item-3",
        description: "Brand Guidelines Document",
        quantity: 1,
        unitPrice: 700,
        total: 700
      }
    ],
    
    subtotal: 1500,
    taxes: 135,
    discounts: 100,
    totalAmount: 1535,
    
    status: "Sent",
    paymentStatus: "Pending",
    paymentTerms: "Net 15",
    paymentMethod: "Credit Card",
    
    vendorId: "VEN-002",
    vendorName: "Design Co.",
    contractId: "CON-002",
    
    createdAt: "2024-07-05T10:00:00Z",
    updatedAt: "2024-07-05T10:00:00Z",
    createdBy: "user-1",
    
    // Legacy fields
    invoiceAmount: 1535
  },
  {
    id: "INV-2024-003",
    invoiceNumber: "INV-2024-003",
    invoiceDate: "2024-06-15",
    invoiceDueDate: "2024-07-15",
    
    seller: {
      name: "Your Company Inc.",
      address: {
        street: "100 Business St",
        city: "San Francisco",
        state: "CA",
        zipCode: "94105",
        country: "US"
      },
      email: "billing@yourcompany.com",
      phone: "555-123-4567",
      taxId: "12-3456789"
    },
    
    buyer: {
      name: "Marketing Solutions",
      address: {
        street: "789 Marketing Blvd",
        city: "Los Angeles",
        state: "CA",
        zipCode: "90210",
        country: "US"
      },
      email: "info@marketingsolutions.com",
      phone: "345-678-9012",
      taxId: "55-1234567",
      contactPerson: "Mike Davis"
    },
    
    items: [
      {
        id: "item-4",
        description: "Marketing Campaign Setup",
        quantity: 1,
        unitPrice: 3200,
        total: 3200
      }
    ],
    
    subtotal: 3200,
    taxes: 288,
    discounts: 0,
    totalAmount: 3488,
    
    status: "Paid",
    paymentStatus: "Paid",
    paymentTerms: "Net 45",
    paymentMethod: "Bank Transfer",
    
    vendorId: "VEN-003",
    vendorName: "Marketing Solutions",
    contractId: "CON-003",
    
    createdAt: "2024-06-15T10:00:00Z",
    updatedAt: "2024-07-16T10:00:00Z",
    createdBy: "user-1",
    
    // Legacy fields
    invoiceAmount: 3488
  },
  {
    id: "INV-2024-004",
    invoiceNumber: "INV-2024-004",
    invoiceDate: "2024-06-20",
    invoiceDueDate: "2024-07-20",
    
    seller: {
      name: "Your Company Inc.",
      address: {
        street: "100 Business St",
        city: "San Francisco",
        state: "CA",
        zipCode: "94105",
        country: "US"
      },
      email: "billing@yourcompany.com",
      phone: "555-123-4567",
      taxId: "12-3456789"
    },
    
    buyer: {
      name: "Cloud Services Ltd.",
      address: {
        street: "321 Cloud Lane",
        city: "Seattle",
        state: "WA",
        zipCode: "98101",
        country: "US"
      },
      email: "support@cloudltd.com",
      phone: "456-789-0123",
      taxId: "77-9876543",
      contactPerson: "Lisa Chen"
    },
    
    items: [
      {
        id: "item-5",
        description: "Cloud Infrastructure Setup",
        quantity: 3,
        unitPrice: 250,
        total: 750
      }
    ],
    
    subtotal: 750,
    taxes: 67.5,
    discounts: 0,
    totalAmount: 817.5,
    
    status: "Overdue",
    paymentStatus: "Overdue",
    paymentTerms: "Net 30",
    paymentMethod: "Bank Transfer",
    
    vendorId: "VEN-004",
    vendorName: "Cloud Services Ltd.",
    
    createdAt: "2024-06-20T10:00:00Z",
    updatedAt: "2024-06-20T10:00:00Z",
    createdBy: "user-1",
    
    // Legacy fields
    invoiceAmount: 817.5
  },
  {
    id: "INV-2024-005",
    invoiceNumber: "INV-2024-005",
    invoiceDate: "2024-07-10",
    invoiceDueDate: "2024-08-09",
    
    seller: {
      name: "Your Company Inc.",
      address: {
        street: "100 Business St",
        city: "San Francisco",
        state: "CA",
        zipCode: "94105",
        country: "US"
      },
      email: "billing@yourcompany.com",
      phone: "555-123-4567",
      taxId: "12-3456789"
    },
    
    buyer: {
      name: "Innovate Inc.",
      address: {
        street: "123 Tech Street",
        city: "San Francisco",
        state: "CA",
        zipCode: "94105",
        country: "US"
      },
      email: "contact@innovate.com",
      phone: "123-456-7890",
      taxId: "12-3456789",
      contactPerson: "John Smith"
    },
    
    items: [
      {
        id: "item-6",
        description: "Additional Development Work",
        quantity: 2,
        unitPrice: 1150,
        total: 2300
      }
    ],
    
    subtotal: 2300,
    taxes: 207,
    discounts: 0,
    totalAmount: 2507,
    
    status: "Draft",
    paymentStatus: "Pending",
    paymentTerms: "Net 30",
    paymentMethod: "Bank Transfer",
    
    vendorId: "VEN-001",
    vendorName: "Innovate Inc.",
    contractId: "CON-001",
    
    customFields: [
      {
        id: "custom-1",
        name: "Project Code",
        type: "text",
        value: "PROJ-2024-001",
        required: true
      },
      {
        id: "custom-2",
        name: "Priority Level",
        type: "select",
        value: "High",
        options: ["Low", "Medium", "High", "Critical"]
      }
    ],
    
    createdAt: "2024-07-10T10:00:00Z",
    updatedAt: "2024-07-10T10:00:00Z",
    createdBy: "user-1",
    
    // Legacy fields
    invoiceAmount: 2507
  }
];
