
export type Vendor = {
  id: string;
  name: string;
  email: string;
  phone: string;
  service: string;
};

export type Invoice = {
  id: string;
  vendorName: string;
  invoiceAmount: number;
  invoiceDueDate: string;
  invoiceNumber: string;
  invoiceDate: string;
  status: 'Paid' | 'Unpaid' | 'Overdue';
}

export type User = {
    id: string;
    name: string;
    email: string;
    image?: string;
}
