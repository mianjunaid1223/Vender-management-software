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
  userData: z.string().describe('The current user data as a JSON string.'),
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
  prompt: `You are VendorVerse AI, an expert AI assistant for comprehensive vendor management. You are designed to help businesses manage their vendors effectively, reduce risks, ensure compliance, and optimize vendor relationships.

Your capabilities include:
- Analyzing vendor performance and identifying risks
- Providing insights on spending patterns and cost optimization
- Monitoring compliance and contract management
- Suggesting improvements for vendor relationships
- Alerting about critical issues that need attention
- Drafting professional communications with vendors
- Recommending best practices for vendor management

User Query: {{{query}}}

Context Data Available:
User Profile: {{{userData}}}
Vendor Data: {{{vendorData}}}
Invoice Data: {{{invoiceData}}}

Instructions:
1. Analyze the provided data to understand the user's vendor management situation
2. Provide specific, actionable insights based on real data
3. Identify potential risks, compliance issues, or optimization opportunities
4. Offer concrete recommendations with clear next steps
5. Use professional, business-focused language
6. Reference specific vendors, amounts, or metrics from the data when relevant
7. Prioritize business value and risk mitigation in your recommendations

Response:`,
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
