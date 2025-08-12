import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI("AIzaSyBAERi_GFCgfRRZg-Y0jWJKYdkNXzGenxY");

export interface ExtractedInvoiceData {
  vendorName: string;
  invoiceNumber: string;
  invoiceDate: string;
  dueDate: string;
  amount: number;
  currency: string;
  description: string;
  lineItems: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }>;
  taxAmount?: number;
  subtotal?: number;
  vendorAddress?: string;
  vendorEmail?: string;
  vendorPhone?: string;
}

export async function extractInvoiceData(
  imageBase64: string,
  mimeType: string
): Promise<ExtractedInvoiceData> {
  try {
    // Validate API key


    // Validate input
    if (!imageBase64 || !mimeType) {
      throw new Error('Invalid file data provided');
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const prompt = `
You are an expert invoice data extraction system. Your task is to analyze the provided image and determine if it contains invoice information.

FIRST, determine if this image contains an invoice, bill, receipt, or similar financial document. If it does NOT contain invoice-like content (e.g., it's a random photo, document, screenshot, etc.), respond with:
{"isInvoice": false, "reason": "This image does not appear to be an invoice or financial document"}

If it IS an invoice or similar financial document, extract the following information and respond with a JSON object:
      
      {
        "isInvoice": true,
        "vendorName": "Company name that issued the invoice",
        "amount": 1234.56,
        "invoiceNumber": "INV-001",
        "invoiceDate": "2024-01-15",
        "dueDate": "2024-02-15",
        "description": "Brief description of services/products",
        "currency": "USD",
        "lineItems": [
          {
            "description": "Item description",
            "quantity": "Quantity as number",
            "unitPrice": "Unit price as number",
            "total": "Line total as number"
          }
        ],
        "taxAmount": "Tax amount as number (optional)",
        "subtotal": "Subtotal before tax as number (optional)",
        "vendorAddress": "Vendor address (optional)",
        "vendorEmail": "Vendor email (optional)",
        "vendorPhone": "Vendor phone (optional)"
      }
      
      Important:
      - Return only valid JSON
      - Use null for missing values
      - Convert all amounts to numbers
      - Use ISO date format (YYYY-MM-DD)
      - If currency is not clear, use "USD" as default
    `;

    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          data: imageBase64,
          mimeType: mimeType,
        },
      },
    ]);

    const response = await result.response;
    const text = response.text();
    
    // Parse the JSON response
    const jsonMatch = result.response.text().match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('AI could not process the image. Please ensure the image is clear and contains invoice information.');
    }

    const extractedData = JSON.parse(jsonMatch[0]) as any;
    
    // Check if it's actually an invoice
    if (extractedData.isInvoice === false) {
      throw new Error(`This doesn't appear to be an invoice. ${extractedData.reason || 'Please upload a valid invoice, bill, or receipt.'}`);
    }
    
    // Validate required fields
    if (!extractedData.vendorName || !extractedData.amount) {
      throw new Error('This image appears to be an invoice, but some required information is missing or unclear. Please ensure the vendor name and amount are clearly visible.');
    }

    return extractedData;
  } catch (error) {
    if (error instanceof Error) {
      // Pass through specific error messages
      if (error.message.includes('API key') || error.message.includes('not configured')) {
        throw error;
      }
      if (error.message.includes('quota') || error.message.includes('limit')) {
        throw new Error('AI service quota exceeded. Please try again later.');
      }
      if (error.message.includes('network') || error.message.includes('fetch')) {
        throw new Error('Network error. Please check your connection and try again.');
      }
    }
    
    throw new Error('Failed to extract invoice data. Please try again or enter manually.');
  }
}

export async function processInvoiceFile(file: File): Promise<ExtractedInvoiceData> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = async (e) => {
      try {
        const base64Data = (e.target?.result as string).split(',')[1];
        const extractedData = await extractInvoiceData(base64Data, file.type);
        resolve(extractedData);
      } catch (error) {
        reject(error);
      }
    };
    
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}
