import { Invoice, Vendor } from "@/lib/types";

export const MOCK_VENDORS: Vendor[] = [
  { id: "VEN-001", name: "Innovate Inc.", email: "contact@innovate.com", phone: "123-456-7890", service: "Software Development" },
  { id: "VEN-002", name: "Design Co.", email: "hello@designco.com", phone: "234-567-8901", service: "Graphic Design" },
  { id: "VEN-003", name: "Marketing Solutions", email: "info@marketingsolutions.com", phone: "345-678-9012", service: "Digital Marketing" },
  { id: "VEN-004", name: "Cloud Services Ltd.", email: "support@cloudltd.com", phone: "456-789-0123", service: "Cloud Hosting" },
  { id: "VEN-005", name: "Office Supplies R Us", email: "sales@officesupplies.com", phone: "567-890-1234", service: "Office Supplies" },
];

export const MOCK_INVOICES: Invoice[] = [
    {
        id: "INV-2024-001",
        invoiceNumber: "INV-2024-001",
        vendorName: "Innovate Inc.",
        invoiceAmount: 5000,
        invoiceDate: "2024-07-01",
        invoiceDueDate: "2024-07-31",
        status: "Unpaid"
    },
    {
        id: "INV-2024-002",
        invoiceNumber: "INV-2024-002",
        vendorName: "Design Co.",
        invoiceAmount: 1500,
        invoiceDate: "2024-07-05",
        invoiceDueDate: "2024-08-04",
        status: "Unpaid"
    },
    {
        id: "INV-2024-003",
        invoiceNumber: "INV-2024-003",
        vendorName: "Marketing Solutions",
        invoiceAmount: 3200,
        invoiceDate: "2024-06-15",
        invoiceDueDate: "2024-07-15",
        status: "Paid"
    },
    {
        id: "INV-2024-004",
        invoiceNumber: "INV-2024-004",
        vendorName: "Cloud Services Ltd.",
        invoiceAmount: 750,
        invoiceDate: "2024-06-20",
        invoiceDueDate: "2024-07-20",
        status: "Overdue"
    },
    {
        id: "INV-2024-005",
        invoiceNumber: "INV-2024-005",
        vendorName: "Innovate Inc.",
        invoiceAmount: 2300,
        invoiceDate: "2024-07-10",
        invoiceDueDate: "2024-08-09",
        status: "Unpaid"
    },
];
