import { GoogleGenerativeAI } from '@google/generative-ai';

export interface SpotlightQuery {
  query: string;
  userData?: string;
  invoiceData?: string;
  vendorData?: string;
  contractData?: string;
  companyData?: string;
}

export interface SpotlightResponse {
  response: string;
  suggestions?: string[];
}

class GeminiSpotlightService {
  private genAI: GoogleGenerativeAI;
  private model: any;

  constructor() {
    // Try multiple environment variable names
    const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY || 
                   process.env.GEMINI_API_KEY || 
                   process.env.GOOGLE_AI_API_KEY;
    
    if (!apiKey) {
      console.error('Available env vars:', Object.keys(process.env).filter(key => key.includes('GEMINI') || key.includes('GOOGLE')));
      throw new Error('GEMINI_API_KEY not found in environment variables. Please set NEXT_PUBLIC_GEMINI_API_KEY or GEMINI_API_KEY');
    }
    
    this.genAI = new GoogleGenerativeAI(apiKey);
    this.model = this.genAI.getGenerativeModel({ 
      model: 'gemini-2.0-flash-exp',
      generationConfig: {
        temperature: 0.7,
        topP: 0.8,
        topK: 40,
        maxOutputTokens: 1024,
      }
    });
  }

  async querySpotlight(data: SpotlightQuery): Promise<SpotlightResponse> {
    try {
      const prompt = this.buildPrompt(data);
      
      const result = await this.model.generateContent(prompt);
      const response = result.response;
      const text = response.text();

      return {
        response: text,
        suggestions: this.extractSuggestions(text, data.query)
      };
    } catch (error) {
      // TODO: Replace with proper structured logging service
      console.error('Gemini AI Error - Service:', this.constructor.name, 'Error:', error);
      throw new Error('Failed to get AI response from Gemini');
    }
  }

  private buildPrompt(data: SpotlightQuery): string {
    return `You are an AI assistant for a vendor management system, similar to macOS Spotlight but for business data. 
Provide concise, helpful responses about the user's business data.

Query: "${data.query}"

Available Data Context:
${data.userData ? `User Info: ${data.userData}` : ''}
${data.companyData ? `Company Info: ${data.companyData}` : ''}
${data.vendorData ? `Vendors: ${data.vendorData}` : ''}
${data.invoiceData ? `Invoices: ${data.invoiceData}` : ''}
${data.contractData ? `Contracts: ${data.contractData}` : ''}

Instructions:
- Be concise and direct like Spotlight
- Focus on actionable insights
- If asking about specific data, provide relevant numbers/statistics
- If no relevant data found, suggest what the user can do
- Keep responses under 200 words
- Use bullet points for lists
- Include relevant data summaries when applicable

Response:`;
  }

  private extractSuggestions(response: string, query: string): string[] {
    const suggestions: string[] = [];
    
    // Extract suggested actions based on response content
    if (response.toLowerCase().includes('vendor')) {
      suggestions.push('View all vendors');
    }
    if (response.toLowerCase().includes('invoice')) {
      suggestions.push('Manage invoices');
    }
    if (response.toLowerCase().includes('contract')) {
      suggestions.push('Review contracts');
    }
    if (response.toLowerCase().includes('overdue') || response.toLowerCase().includes('payment')) {
      suggestions.push('Check overdue payments');
    }
    
    return suggestions;
  }
}

export const geminiService = new GeminiSpotlightService();