'use server';
/**
 * @fileOverview An AI assistant that can answer questions based on user data.
 *
 * - getAIAssistantResponse - A function that handles the AI assistant query process.
 * - AIAssistantInput - The input type for the getAIAssistantResponse function.
 * - AIAssistantOutput - The return type for the getAIAssistantResponse function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AIAssistantInputSchema = z.object({
  query: z.string().describe('The user query for the AI assistant.'),
  invoiceData: z.string().describe('The historical invoice data as a JSON string.'),
  vendorData: z.string().describe('Vendor data as a JSON string.'),
  contractData: z.string().describe('Contract data as a JSON string.'),
  userData: z.string().describe('The current user data as a JSON string.'),
  companyData: z.string().optional().describe('Company profile data as a JSON string.'),
});
export type AIAssistantInput = z.infer<typeof AIAssistantInputSchema>;

const AIAssistantOutputSchema = z.object({
  response: z.string().describe('The AI-powered response to the user query.'),
});
export type AIAssistantOutput = z.infer<typeof AIAssistantOutputSchema>;

export async function getAIAssistantResponse(input: AIAssistantInput): Promise<AIAssistantOutput> {
  return aiAssistantFlow(input);
}

const prompt = ai.definePrompt({
  name: 'aiAssistantPrompt',
  input: {schema: AIAssistantInputSchema},
  output: {schema: AIAssistantOutputSchema},
  prompt: `You are an expert AI assistant for a vendor management application called VendorVerse.
Your goal is to provide helpful, accurate, and clean answers to user queries based on the data provided.
You have access to the user's profile information, their full invoice history, vendor list, contract information, and company profile.

RESPONSE GUIDELINES:
- **Formatting is Key**: Use markdown for formatting, especially lists (bullet points) to present information clearly. For example, when listing multiple contracts or invoices, use a bulleted list.
- **Be Concise and Clear**: Provide direct answers. Avoid long, unformatted paragraphs.
- **No Raw IDs**: NEVER include raw database IDs (like 'contractId', 'vendorId', 'id', '_id') in your response unless specifically asked. Refer to items by their name or title.
- **Summarize Information**: Instead of dumping all data, summarize it. For example, instead of listing every detail of a contract, highlight the key aspects like title, parties, value, and end date.
- **Actionable Suggestions**: When providing suggestions, be specific about actionable steps the user can take.

User Query: {{{query}}}

User Profile Data: {{{userData}}}
Company Profile Data: {{{companyData}}}
Vendor Data: {{{vendorData}}}
Invoice Data: {{{invoiceData}}}
Contract Data: {{{contractData}}}

Based on the data, provide a clean, well-formatted response to the user's query.`,
});

const aiAssistantFlow = ai.defineFlow(
  {
    name: 'aiAssistantFlow',
    inputSchema: AIAssistantInputSchema,
    outputSchema: AIAssistantOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return { response: output!.response };
  }
);
