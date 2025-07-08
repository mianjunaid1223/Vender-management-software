// Summarize spending trends based on user queries.
'use server';
/**
 * @fileOverview An AI agent that summarizes spending trends based on invoice data and user queries.
 *
 * - summarizeSpendingTrends - A function that handles the spending trend summarization process.
 * - SummarizeSpendingTrendsInput - The input type for the summarizeSpendingTrends function.
 * - SummarizeSpendingTrendsOutput - The return type for the summarizeSpendingTrends function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SummarizeSpendingTrendsInputSchema = z.object({
  query: z.string().describe('The user query about spending trends.'),
  invoiceData: z.string().describe('The historical invoice data as a JSON string.'),
  vendorPaymentHistory: z.string().optional().describe('Vendor payment history data as a JSON string, if available.'),
});
export type SummarizeSpendingTrendsInput = z.infer<typeof SummarizeSpendingTrendsInputSchema>;

const SummarizeSpendingTrendsOutputSchema = z.object({
  summary: z.string().describe('The AI-powered summary of spending trends and insights.'),
});
export type SummarizeSpendingTrendsOutput = z.infer<typeof SummarizeSpendingTrendsOutputSchema>;

export async function summarizeSpendingTrends(input: SummarizeSpendingTrendsInput): Promise<SummarizeSpendingTrendsOutput> {
  return summarizeSpendingTrendsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'summarizeSpendingTrendsPrompt',
  input: {schema: SummarizeSpendingTrendsInputSchema},
  output: {schema: SummarizeSpendingTrendsOutputSchema},
  prompt: `You are an AI assistant that analyzes invoice data to provide insights into spending trends.

You will be provided with a user query, invoice data, and optionally vendor payment history.
Based on the provided information, you will generate a summary of spending trends and insights to help the user understand their vendor spending and identify potential areas for cost savings.

User Query: {{{query}}}

Invoice Data: {{{invoiceData}}}

{{#if vendorPaymentHistory}}
Vendor Payment History: {{{vendorPaymentHistory}}}
{{/if}}

Summary:`,
});

const summarizeSpendingTrendsFlow = ai.defineFlow(
  {
    name: 'summarizeSpendingTrendsFlow',
    inputSchema: SummarizeSpendingTrendsInputSchema,
    outputSchema: SummarizeSpendingTrendsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
