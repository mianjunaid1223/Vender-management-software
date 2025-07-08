import { type ExtractInvoiceDataOutput } from '@/ai/flows/extract-invoice-data';

export type Vendor = {
  id: string;
  name: string;
  email: string;
  phone: string;
  service: string;
};

export interface Invoice extends ExtractInvoiceDataOutput {
  id: string;
  status: 'Paid' | 'Unpaid' | 'Overdue';
}
