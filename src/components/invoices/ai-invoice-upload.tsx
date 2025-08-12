'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Upload, FileText, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { processInvoiceFile, ExtractedInvoiceData } from '@/lib/ai/invoice-parser';
import { getCurrencySelectOptions } from '@/lib/utils/currency';
import { convertToBaseCurrency } from '@/lib/utils/currency-conversion';
import { useToast } from '@/hooks/use-toast';

interface AIInvoiceUploadProps {
  onDataExtracted: (data: ExtractedInvoiceData) => void;
  onCancel: () => void;
  baseCurrency?: string;
}

export function AIInvoiceUpload({ onDataExtracted, onCancel, baseCurrency = 'USD' }: AIInvoiceUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [extractedData, setExtractedData] = useState<ExtractedInvoiceData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [fileCurrency, setFileCurrency] = useState<string>('');
  const [exchangeRate, setExchangeRate] = useState<string>('');
  const [convertCurrency, setConvertCurrency] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const { toast } = useToast();

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
      if (!allowedTypes.includes(selectedFile.type)) {
        toast({ title: 'Error', description: 'Please upload a valid image file (JPEG, PNG, WebP) or PDF', variant: 'destructive' });
        return;
      }

      // Validate file size (max 10MB)
      if (selectedFile.size > 10 * 1024 * 1024) {
        toast({ title: 'Error', description: 'File size must be less than 10MB', variant: 'destructive' });
        return;
      }

      setFile(selectedFile);
    }
  };

  const processInvoice = async () => {
    if (!file) return;

    setIsProcessing(true);
    try {
      const data = await processInvoiceFile(file);
      setExtractedData(data);
      toast({ title: 'Success', description: 'Invoice data extracted successfully!' });
    } catch (error) {
      console.error('Error processing invoice:', error);
      
      let errorMessage = 'Failed to extract invoice data. Please try again or enter manually.';
      
      if (error instanceof Error) {
        if (error.message.includes("doesn't appear to be an invoice")) {
          errorMessage = error.message;
        } else if (error.message.includes('missing or unclear')) {
          errorMessage = error.message;
        } else if (error.message.includes('AI service not configured')) {
          errorMessage = 'AI service is not configured. Please contact your administrator.';
        } else if (error.message.includes('quota exceeded')) {
          errorMessage = 'AI service quota exceeded. Please try again later.';
        } else if (error.message.includes('network') || error.message.includes('fetch')) {
          errorMessage = 'Network error. Please check your connection and try again.';
        }
      }
      
      toast({ 
        title: 'AI Extraction Failed', 
        description: errorMessage, 
        variant: 'destructive' 
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDataChange = (field: keyof ExtractedInvoiceData, value: any) => {
    if (!extractedData) return;
    setExtractedData({
      ...extractedData,
      [field]: value
    });
  };

  const handleConfirm = () => {
    if (extractedData) {
      onDataExtracted(extractedData);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            AI Invoice Data Extraction
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {!file && (
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
              <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <div className="space-y-2">
                <p className="text-lg font-medium">Upload Invoice Image</p>
                <p className="text-sm text-gray-500">
                  Supports JPEG, PNG, WebP, and PDF files up to 10MB
                </p>
                <div>
                  <Input
                    id="invoice-file"
                    type="file"
                    accept="image/jpeg,image/png,image/webp,application/pdf"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  <Button 
                    variant="outline" 
                    className="mt-2"
                    onClick={() => document.getElementById('invoice-file')?.click()}
                    type="button"
                  >
                    Choose File
                  </Button>
                </div>
              </div>
            </div>
          )}

          {file && !extractedData && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 p-4 bg-blue-50 rounded-lg">
                <FileText className="h-5 w-5 text-blue-600" />
                <span className="font-medium">{file.name}</span>
                <span className="text-sm text-gray-500">
                  ({(file.size / 1024 / 1024).toFixed(2)} MB)
                </span>
              </div>
              
              <div className="flex gap-2">
                <Button 
                  onClick={processInvoice} 
                  disabled={isProcessing}
                  className="flex-1"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Extracting Data...
                    </>
                  ) : (
                    <>
                      <FileText className="h-4 w-4 mr-2" />
                      Extract Invoice Data
                    </>
                  )}
                </Button>
                <Button variant="outline" onClick={() => setFile(null)}>
                  Remove
                </Button>
              </div>
            </div>
          )}

          {extractedData && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 p-4 bg-green-50 rounded-lg">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <span className="font-medium text-green-800">
                  Data extracted successfully! Review and confirm below.
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsEditing(!isEditing)}
                  className="ml-auto"
                >
                  {isEditing ? 'View' : 'Edit'}
                </Button>
              </div>

              {isEditing ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="vendorName">Vendor Name</Label>
                    <Input
                      id="vendorName"
                      value={extractedData.vendorName}
                      onChange={(e) => handleDataChange('vendorName', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="invoiceNumber">Invoice Number</Label>
                    <Input
                      id="invoiceNumber"
                      value={extractedData.invoiceNumber}
                      onChange={(e) => handleDataChange('invoiceNumber', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="invoiceDate">Invoice Date</Label>
                    <Input
                      id="invoiceDate"
                      type="date"
                      value={extractedData.invoiceDate}
                      onChange={(e) => handleDataChange('invoiceDate', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="dueDate">Due Date</Label>
                    <Input
                      id="dueDate"
                      type="date"
                      value={extractedData.dueDate}
                      onChange={(e) => handleDataChange('dueDate', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="amount">Amount</Label>
                    <Input
                      id="amount"
                      type="number"
                      step="0.01"
                      value={extractedData.amount}
                      onChange={(e) => handleDataChange('amount', parseFloat(e.target.value))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="currency">Currency</Label>
                    <Select
                      value={extractedData.currency}
                      onValueChange={(value) => handleDataChange('currency', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="USD">USD - US Dollar</SelectItem>
                        <SelectItem value="EUR">EUR - Euro</SelectItem>
                        <SelectItem value="GBP">GBP - British Pound</SelectItem>
                        <SelectItem value="CAD">CAD - Canadian Dollar</SelectItem>
                        <SelectItem value="AUD">AUD - Australian Dollar</SelectItem>
                        <SelectItem value="JPY">JPY - Japanese Yen</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="md:col-span-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={extractedData.description}
                      onChange={(e) => handleDataChange('description', e.target.value)}
                    />
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Vendor:</span> {extractedData.vendorName}
                  </div>
                  <div>
                    <span className="font-medium">Invoice #:</span> {extractedData.invoiceNumber}
                  </div>
                  <div>
                    <span className="font-medium">Date:</span> {extractedData.invoiceDate}
                  </div>
                  <div>
                    <span className="font-medium">Due:</span> {extractedData.dueDate}
                  </div>
                  <div>
                    <span className="font-medium">Amount:</span> {extractedData.currency} {extractedData.amount.toFixed(2)}
                  </div>
                  <div className="md:col-span-2">
                    <span className="font-medium">Description:</span> {extractedData.description}
                  </div>
                </div>
              )}

              <div className="flex gap-2 pt-4">
                <Button onClick={handleConfirm} className="flex-1">
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Confirm & Create Invoice
                </Button>
                <Button variant="outline" onClick={() => setExtractedData(null)}>
                  Re-extract
                </Button>
                <Button variant="outline" onClick={onCancel}>
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
