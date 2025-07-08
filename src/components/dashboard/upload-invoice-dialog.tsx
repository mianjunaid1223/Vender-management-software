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
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { PlusCircle, Upload, FileText, Loader2, Wand2 } from "lucide-react";
import {
  extractInvoiceData,
  type ExtractInvoiceDataOutput,
} from "@/ai/flows/extract-invoice-data";

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

      form.reset({
        ...extractedData,
        invoiceDueDate: extractedData.invoiceDueDate.split('T')[0],
        invoiceDate: extractedData.invoiceDate.split('T')[0],
      });
      toast({
        title: "Data Extracted Successfully",
        description: "Please review the extracted information below.",
      });
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
  
  const onSubmit = (values: z.infer<typeof formSchema>) => {
    console.log("Submitting new invoice:", values);
    toast({
        title: "Invoice Submitted",
        description: `${values.invoiceNumber} from ${values.vendorName} has been added.`,
    })
    setFile(null);
    form.reset();
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
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
          <div className="flex flex-col items-center justify-center gap-4 p-6 border-2 border-dashed rounded-lg">
            <Upload className="h-10 w-10 text-muted-foreground" />
            <Input id="invoice-file" type="file" onChange={handleFileChange} className="w-full" />
            {file && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground mt-2">
                <FileText className="h-4 w-4" />
                <span>{file.name}</span>
              </div>
            )}
            <Button onClick={handleExtractData} disabled={!file || isExtracting} className="w-full mt-4">
              {isExtracting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Wand2 className="mr-2 h-4 w-4" />
              )}
              {isExtracting ? "Extracting..." : "Extract Data with AI"}
            </Button>
          </div>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="vendorName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Vendor Name</FormLabel>
                    <FormControl><Input {...field} /></FormControl>
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
                    <FormControl><Input {...field} /></FormControl>
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
                    <FormControl><Input type="number" step="0.01" {...field} /></FormControl>
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
                    <FormControl><Input type="date" {...field} /></FormControl>
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
                    <FormControl><Input type="date" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </form>
          </Form>
        </div>
        <DialogFooter>
          <Button type="submit" onClick={form.handleSubmit(onSubmit)}>Save Invoice</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
