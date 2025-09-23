"use server";

import { GoogleGenerativeAI } from "@google/generative-ai";
import { z } from "zod";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

const SpotlightQuerySchema = z.object({
  query: z.string(),
  context: z.object({
    invoices: z.string(),
    vendors: z.string(),
    contracts: z.string(),
    user: z.string(),
  }),
});

export async function searchWithGemini(input: z.infer<typeof SpotlightQuerySchema>) {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });

    const prompt = `
You are an AI assistant for a vendor management system. Analyze the user's query and provide relevant information from their business data.

USER QUERY: "${input.query}"

AVAILABLE DATA:
- Invoices: ${input.context.invoices}
- Vendors: ${input.context.vendors}
- Contracts: ${input.context.contracts}
- User: ${input.context.user}

INSTRUCTIONS:
1. Provide a clear, concise response
2. Use specific data from the context when relevant
3. If the query asks for specific actions, suggest relevant navigation
4. Keep responses under 200 words
5. Use markdown formatting for better readability

RESPONSE:`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    return {
      success: true,
      response: text,
      suggestions: generateSuggestions(input.query, text),
    };
  } catch (error) {
    console.error("Gemini API Error:", error);
    return {
      success: false,
      response: "Sorry, I'm having trouble processing your request right now. Please try again.",
      suggestions: [],
    };
  }
}

function generateSuggestions(query: string, response: string) {
  const suggestions = [];
  
  if (query.toLowerCase().includes('invoice') || response.toLowerCase().includes('invoice')) {
    suggestions.push({
      title: "View Invoices",
      description: "Manage and review invoices",
      href: "/dashboard/invoices",
      icon: "Receipt"
    });
  }
  
  if (query.toLowerCase().includes('vendor') || response.toLowerCase().includes('vendor')) {
    suggestions.push({
      title: "Vendor Management",
      description: "View and manage vendors",
      href: "/dashboard/vendors",
      icon: "Users"
    });
  }
  
  if (query.toLowerCase().includes('contract') || response.toLowerCase().includes('contract')) {
    suggestions.push({
      title: "Contracts",
      description: "Review contract details",
      href: "/dashboard/contracts",
      icon: "FileText"
    });
  }

  if (query.toLowerCase().includes('report') || query.toLowerCase().includes('analytic')) {
    suggestions.push({
      title: "Analytics",
      description: "View business analytics",
      href: "/dashboard/analytics",
      icon: "BarChart"
    });
  }

  return suggestions;
}