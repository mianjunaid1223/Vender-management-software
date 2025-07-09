'use server';

/**
 * @fileOverview An AI agent for extracting key information from invoices.
 *
 * - extractInvoiceData - A function that handles the invoice data extraction process.
 * - ExtractInvoiceDataInput - The input type for the extractInvoiceData function.
 * - ExtractInvoiceDataOutput - The return type for the extractInvoiceData function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ExtractInvoiceDataInputSchema = z.object({
  invoiceDataUri: z
    .string()
    .describe(
      "The invoice as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type ExtractInvoiceDataInput = z.infer<typeof ExtractInvoiceDataInputSchema>;

const ExtractInvoiceDataOutputSchema = z.object({
  isInvoice: z.boolean().describe('Set to true if the document is an invoice, false otherwise.'),
  vendorName: z.string().optional().describe('The name of the vendor.'),
  invoiceAmount: z.number().optional().describe('The total amount due on the invoice.'),
  invoiceDueDate: z.string().optional().describe('The due date of the invoice in YYYY-MM-DD format.'),
  invoiceNumber: z.string().optional().describe('The invoice number.'),
  invoiceDate: z.string().optional().describe('The issue date of the invoice in YYYY-MM-DD format.'),
});
export type ExtractInvoiceDataOutput = z.infer<typeof ExtractInvoiceDataOutputSchema>;

export async function extractInvoiceData(input: ExtractInvoiceDataInput): Promise<ExtractInvoiceDataOutput> {
  return extractInvoiceDataFlow(input);
}

const prompt = ai.definePrompt({
  name: 'extractInvoiceDataPrompt',
  input: {schema: ExtractInvoiceDataInputSchema},
  output: {schema: ExtractInvoiceDataOutputSchema},
  prompt: `You are an expert financial assistant. Your first task is to determine if the provided document is an invoice.

If the document appears to be an invoice, set 'isInvoice' to true and extract the vendor name, invoice amount, due date, invoice number, and invoice date. Ensure dates are in YYYY-MM-DD format.

If the document does not appear to be an invoice, set 'isInvoice' to false and do not provide any other fields.

Document: {{media url=invoiceDataUri}}`,
});

const extractInvoiceDataFlow = ai.defineFlow(
  {
    name: 'extractInvoiceDataFlow',
    inputSchema: ExtractInvoiceDataInputSchema,
    outputSchema: ExtractInvoiceDataOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
