"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/shared/components/ui/dialog";
import { Button } from "@/shared/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/shared/components/ui/form";
import { Input } from "@/shared/components/ui/input";
import { useToast } from "@/shared/hooks/use-toast";
import { PlusCircle, Upload, FileText, Loader2, Wand2 } from "lucide-react";
import {
  extractInvoiceData,
  type ExtractInvoiceDataOutput,
} from "@/ai/flows/extract-invoice-data";
import { addInvoice } from "@/app/actions";
import { cn } from "@/core/utils/utils";

const formSchema = z.object({
  vendorName: z.string().min(1, "Vendor name is required."),
  invoiceAmount: z.coerce.number().min(0.01, "Amount must be greater than 0."),
  invoiceDueDate: z.string().min(1, "Due date is required."),
  invoiceNumber: z.string().min(1, "Invoice number is required."),
  invoiceDate: z.string().min(1, "Invoice date is required."),
});

function fileToDataURI(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function UploadInvoiceDialog() {
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [isExtracting, setIsExtracting] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      vendorName: "",
      invoiceAmount: 0,
      invoiceDueDate: "",
      invoiceNumber: "",
      invoiceDate: "",
    },
  });

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
    }
  };

  const handleExtractData = async () => {
    if (!file) {
      toast({
        variant: "destructive",
        title: "No file selected",
        description: "Please select an invoice file to extract data from.",
      });
      return;
    }

    setIsExtracting(true);
    try {
      const dataUri = await fileToDataURI(file);
      const extractedData: ExtractInvoiceDataOutput = await extractInvoiceData({
        invoiceDataUri: dataUri,
      });

      if (!extractedData.isInvoice) {
        toast({
          variant: "destructive",
          title: "Not an Invoice",
          description: "The uploaded file does not appear to be an invoice. Please try a different file.",
        });
      } else {
        form.reset({
          vendorName: extractedData.vendorName || "",
          invoiceAmount: extractedData.invoiceAmount || 0,
          invoiceDueDate: extractedData.invoiceDueDate || "",
          invoiceNumber: extractedData.invoiceNumber || "",
          invoiceDate: extractedData.invoiceDate || "",
        });
        toast({
          title: "Data Extracted Successfully",
          description: "Please review the extracted information below.",
        });
      }
    } catch (error) {
      console.error("Failed to extract invoice data:", error);
      toast({
        variant: "destructive",
        title: "Extraction Failed",
        description: "Could not extract data from the invoice. Please fill out the form manually.",
      });
    } finally {
      setIsExtracting(false);
    }
  };
  
  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsSubmitting(true);
    const result = await addInvoice(values);
    setIsSubmitting(false);

    if (result.success) {
      toast({
        title: "Invoice Submitted",
        description: `Invoice ${values.invoiceNumber} has been added.`,
      });
      setOpen(false);
      form.reset();
      setFile(null);
    } else {
      toast({
        variant: "destructive",
        title: "Error Submitting Invoice",
        description: result.message,
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
        setOpen(isOpen);
        if (!isOpen) {
            form.reset();
            setFile(null);
        }
    }}>
      <DialogTrigger asChild>
        <Button>
          <PlusCircle className="mr-2 h-4 w-4" />
          Upload Invoice
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[625px]">
        <DialogHeader>
          <DialogTitle>Upload New Invoice</DialogTitle>
          <DialogDescription>
            Upload an invoice file and our AI will attempt to extract the details.
          </DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
          <div className={cn(
              "flex flex-col items-center justify-center gap-4 p-6 border-2 border-dashed rounded-lg transition-colors",
              isExtracting && "border-primary/50 bg-primary/10 animate-subtle-pulse"
          )}>
            <Upload className="h-10 w-10 text-muted-foreground" />
            <Input id="invoice-file" type="file" onChange={handleFileChange} className="w-full" disabled={isExtracting || isSubmitting} />
            {file && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground mt-2">
                <FileText className="h-4 w-4" />
                <span>{file.name}</span>
              </div>
            )}
            <Button onClick={handleExtractData} disabled={!file || isExtracting || isSubmitting} className="w-full mt-4">
              {isExtracting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Wand2 className="mr-2 h-4 w-4" />
              )}
              {isExtracting ? "Extracting..." : "Extract Data with AI"}
            </Button>
          </div>
          <Form {...form}>
            <form id="invoice-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="vendorName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Vendor Name</FormLabel>
                    <FormControl><Input {...field} disabled={isSubmitting} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="invoiceNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Invoice Number</FormLabel>
                    <FormControl><Input {...field} disabled={isSubmitting} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
               <FormField
                control={form.control}
                name="invoiceAmount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Amount</FormLabel>
                    <FormControl><Input type="number" step="0.01" {...field} disabled={isSubmitting} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="invoiceDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Invoice Date</FormLabel>
                    <FormControl><Input type="date" {...field} disabled={isSubmitting} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="invoiceDueDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Due Date</FormLabel>
                    <FormControl><Input type="date" {...field} disabled={isSubmitting} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </form>
          </Form>
        </div>
        <DialogFooter>
          <Button type="submit" form="invoice-form" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Invoice
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
