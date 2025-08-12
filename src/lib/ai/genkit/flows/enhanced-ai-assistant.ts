'use server';

import { ai } from '@/lib/ai/genkit/genkit';
import { z } from 'genkit';
import { aiContextManager } from '@/lib/ai/context';
// Removed unused AIContext import
import { logAction } from '@/lib/database/queries';

// Enhanced AI Assistant Input Schema
const EnhancedAIAssistantInputSchema = z.object({
  query: z.string().describe('The user query for the AI assistant.'),
  userId: z.string().describe('The user ID for context building.'),
  currentModule: z.string().describe('The current module/page the user is on.'),
  additionalContext: z.string().optional().describe('Additional context specific to the current task.'),
});

export type EnhancedAIAssistantInput = z.infer<typeof EnhancedAIAssistantInputSchema>;

const EnhancedAIAssistantOutputSchema = z.object({
  response: z.string().describe('The AI-powered response to the user query.'),
  suggestedActions: z.array(z.object({
    action: z.string().describe('The suggested action.'),
    description: z.string().describe('Description of what the action does.'),
    priority: z.enum(['high', 'medium', 'low']).describe('Priority level of the action.'),
  })).describe('Suggested next actions based on the query and context.'),
  relevantData: z.array(z.object({
    type: z.enum(['invoice', 'vendor', 'contract', 'company']).describe('Type of data.'),
    id: z.string().describe('ID of the relevant data item.'),
    relevanceScore: z.number().describe('Relevance score from 0-1.'),
  })).describe('Relevant data items found in the context.'),
  confidence: z.number().describe('Confidence score for the response (0-1).'),
});

export type EnhancedAIAssistantOutput = z.infer<typeof EnhancedAIAssistantOutputSchema>;

export async function getEnhancedAIAssistantResponse(input: EnhancedAIAssistantInput): Promise<EnhancedAIAssistantOutput> {
  try {
    // Build comprehensive context
    const context = await aiContextManager.buildContext(input.userId, input.currentModule);
    
    // Log the AI query
    await logAction({
      action: 'ai_query',
      module: input.currentModule,
      details: { query: input.query, module: input.currentModule }
    });

    const result = await enhancedAIAssistantFlow({
      ...input,
      context: JSON.stringify(context),
    });

    // Log the AI response
    await logAction({
      action: 'ai_response',
      module: input.currentModule,
      details: { 
        query: input.query,
        confidence: result.confidence,
        suggestedActionsCount: result.suggestedActions.length
      }
    });

    return result;
  } catch (error) {
    console.error('AI Assistant Error:', error);
    throw new Error('Failed to process AI request');
  }
}

const enhancedAIAssistantPrompt = ai.definePrompt({
  name: 'enhancedAIAssistantPrompt',
  input: { 
    schema: EnhancedAIAssistantInputSchema.extend({
      context: z.string().describe('The full business context as JSON string.')
    })
  },
  output: { schema: EnhancedAIAssistantOutputSchema },
  prompt: `You are an expert AI assistant for a comprehensive vendor management application called VendorVerse.

Your role is to provide intelligent, context-aware assistance for business operations including:
- Vendor management and onboarding
- Contract creation, tracking, and renewal
- Invoice processing and payment management
- Company/agency registration and setup
- Business analytics and reporting
- Process optimization and automation

BUSINESS CONTEXT:
{{{context}}}

CURRENT MODULE: {{{currentModule}}}
USER QUERY: {{{query}}}
ADDITIONAL CONTEXT: {{{additionalContext}}}

RESPONSE GUIDELINES:
1. Always consider the full business context when responding
2. Provide specific, actionable advice based on the user's data
3. Suggest relevant next actions that align with best practices
4. Identify and reference relevant data items from the context
5. Be concise but comprehensive in your responses
6. If data is incomplete, suggest what information is needed
7. For complex tasks, break them down into manageable steps
8. Always prioritize data accuracy and business compliance

CONFIDENCE SCORING:
- 0.9-1.0: High confidence with comprehensive context
- 0.7-0.8: Good confidence with sufficient context
- 0.5-0.6: Moderate confidence with limited context
- 0.3-0.4: Low confidence requiring more information
- 0.1-0.2: Very low confidence, recommend clarification

Provide your response with suggested actions, relevant data references, and confidence level.`,
});

const enhancedAIAssistantFlow = ai.defineFlow(
  {
    name: 'enhancedAIAssistantFlow',
    inputSchema: EnhancedAIAssistantInputSchema.extend({
      context: z.string().describe('The full business context as JSON string.')
    }),
    outputSchema: EnhancedAIAssistantOutputSchema,
  },
  async (input) => {
  const { output } = await enhancedAIAssistantPrompt(input);
  return output!;
  }
);

// Module-specific AI assistants
const ModuleAIInputSchema = z.object({
  query: z.string().describe('The user query for the module-specific AI assistant.'),
  userId: z.string().describe('The user ID for context building.'),
  moduleData: z.string().describe('Module-specific data as JSON string.'),
  action: z.enum(['suggest', 'validate', 'optimize', 'analyze']).describe('The type of assistance needed.'),
});

export type ModuleAIInput = z.infer<typeof ModuleAIInputSchema>;

const ModuleAIOutputSchema = z.object({
  response: z.string().describe('The module-specific AI response.'),
  recommendations: z.array(z.string()).describe('Specific recommendations for the module.'),
  warnings: z.array(z.string()).describe('Warnings about potential issues.'),
  nextSteps: z.array(z.string()).describe('Suggested next steps.'),
});

export type ModuleAIOutput = z.infer<typeof ModuleAIOutputSchema>;

// Vendor AI Assistant
export async function getVendorAIAssistance(input: ModuleAIInput): Promise<ModuleAIOutput> {
  const context = await aiContextManager.buildContext(input.userId, 'vendors');
  
  const vendorAIPrompt = ai.definePrompt({
    name: 'vendorAIPrompt',
    input: { schema: ModuleAIInputSchema.extend({ context: z.string() }) },
    output: { schema: ModuleAIOutputSchema },
    prompt: `You are the Vendor AI Assistant for VendorVerse. Your expertise includes:
- Vendor onboarding and profile management
- Vendor performance analysis and rating
- Payment terms optimization
- Vendor relationship management
- Duplicate detection and data quality

BUSINESS CONTEXT: {{{context}}}
MODULE DATA: {{{moduleData}}}
USER QUERY: {{{query}}}
ACTION TYPE: {{{action}}}

Provide vendor-specific insights, recommendations, and warnings based on the data and context.`,
  });

  const vendorAIFlow = ai.defineFlow(
    {
      name: 'vendorAIFlow',
      inputSchema: ModuleAIInputSchema.extend({ context: z.string() }),
      outputSchema: ModuleAIOutputSchema,
    },
    async (flowInput) => {
  const { output } = await vendorAIPrompt(flowInput);
  return output!;
    }
  );

  return vendorAIFlow({
    ...input,
    context: JSON.stringify(context),
  });
}

// Contract AI Assistant
export async function getContractAIAssistance(input: ModuleAIInput): Promise<ModuleAIOutput> {
  const context = await aiContextManager.buildContext(input.userId, 'contracts');
  
  const contractAIPrompt = ai.definePrompt({
    name: 'contractAIPrompt',
    input: { schema: ModuleAIInputSchema.extend({ context: z.string() }) },
    output: { schema: ModuleAIOutputSchema },
    prompt: `You are the Contract AI Assistant for VendorVerse. Your expertise includes:
- Contract creation and template management
- Renewal tracking and notifications
- Payment terms and milestone management
- Contract compliance and risk assessment
- Performance tracking and KPI monitoring

BUSINESS CONTEXT: {{{context}}}
MODULE DATA: {{{moduleData}}}
USER QUERY: {{{query}}}
ACTION TYPE: {{{action}}}

Provide contract-specific insights, recommendations, and warnings based on the data and context.`,
  });

  const contractAIFlow = ai.defineFlow(
    {
      name: 'contractAIFlow',
      inputSchema: ModuleAIInputSchema.extend({ context: z.string() }),
      outputSchema: ModuleAIOutputSchema,
    },
    async (flowInput) => {
  const { output } = await contractAIPrompt(flowInput);
  return output!;
    }
  );

  return contractAIFlow({
    ...input,
    context: JSON.stringify(context),
  });
}

// Invoice AI Assistant
export async function getInvoiceAIAssistance(input: ModuleAIInput): Promise<ModuleAIOutput> {
  const context = await aiContextManager.buildContext(input.userId, 'invoices');
  
  const invoiceAIPrompt = ai.definePrompt({
    name: 'invoiceAIPrompt',
    input: { schema: ModuleAIInputSchema.extend({ context: z.string() }) },
    output: { schema: ModuleAIOutputSchema },
    prompt: `You are the Invoice AI Assistant for VendorVerse. Your expertise includes:
- Invoice processing and validation
- Payment tracking and follow-up
- Cash flow analysis and forecasting
- Tax compliance and reporting
- Invoice automation and optimization

BUSINESS CONTEXT: {{{context}}}
MODULE DATA: {{{moduleData}}}
USER QUERY: {{{query}}}
ACTION TYPE: {{{action}}}

Provide invoice-specific insights, recommendations, and warnings based on the data and context.`,
  });

  const invoiceAIFlow = ai.defineFlow(
    {
      name: 'invoiceAIFlow',
      inputSchema: ModuleAIInputSchema.extend({ context: z.string() }),
      outputSchema: ModuleAIOutputSchema,
    },
    async (flowInput) => {
  const { output } = await invoiceAIPrompt(flowInput);
  return output!;
    }
  );

  return invoiceAIFlow({
    ...input,
    context: JSON.stringify(context),
  });
}

// Agency AI Assistant
export async function getAgencyAIAssistance(input: ModuleAIInput): Promise<ModuleAIOutput> {
  const context = await aiContextManager.buildContext(input.userId, 'agency');
  
  const agencyAIPrompt = ai.definePrompt({
    name: 'agencyAIPrompt',
    input: { schema: ModuleAIInputSchema.extend({ context: z.string() }) },
    output: { schema: ModuleAIOutputSchema },
    prompt: `You are the Agency AI Assistant for VendorVerse. Your expertise includes:
- Company registration and setup
- Business profile management
- Compliance and regulatory requirements
- Multi-location and multi-entity management
- Business preferences and configuration

BUSINESS CONTEXT: {{{context}}}
MODULE DATA: {{{moduleData}}}
USER QUERY: {{{query}}}
ACTION TYPE: {{{action}}}

Provide agency/company-specific insights, recommendations, and warnings based on the data and context.`,
  });

  const agencyAIFlow = ai.defineFlow(
    {
      name: 'agencyAIFlow',
      inputSchema: ModuleAIInputSchema.extend({ context: z.string() }),
      outputSchema: ModuleAIOutputSchema,
    },
    async (flowInput) => {
  const { output } = await agencyAIPrompt(flowInput);
  return output!;
    }
  );

  return agencyAIFlow({
    ...input,
    context: JSON.stringify(context),
  });
}
