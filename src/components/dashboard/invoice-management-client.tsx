"use client";

import { useState, useTransition } from "react";
import { InvoicesTable } from "@/components/dashboard/invoices-table";
import { InvoiceDialog } from "@/components/dashboard/invoice-dialog";
import { 
  createInvoiceAction, 
  updateInvoiceAction, 
  deleteInvoiceAction, 
  updateInvoiceStatusAction 
} from "@/app/actions";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import type { Invoice, Vendor, Contract } from "@/lib/types";

interface InvoiceManagementClientProps {
  initialInvoices: Invoice[];
  vendors: Vendor[];
  contracts: Contract[];
}

export function InvoiceManagementClient({ 
  initialInvoices, 
  vendors, 
  contracts 
}: InvoiceManagementClientProps) {
  const [invoices, setInvoices] = useState<Invoice[]>(initialInvoices);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const handleInvoiceCreate = async (invoiceData: Partial<Invoice>) => {
    startTransition(async () => {
      try {
        const result = await createInvoiceAction(invoiceData);
        if (result.success && result.data) {
          setInvoices(prev => [result.data, ...prev]);
          toast({
            title: "Success",
            description: "Invoice created successfully.",
          });
        } else {
          toast({
            title: "Error",
            description: result.error || "Failed to create invoice.",
            variant: "destructive",
          });
        }
      } catch (error) {
        toast({
          title: "Error",
          description: "An unexpected error occurred.",
          variant: "destructive",
        });
      }
    });
  };

  const handleInvoiceUpdate = async (invoiceData: Partial<Invoice>) => {
    if (!invoiceData.id) return;
    
    const invoiceId = invoiceData.id;
    
    // Optimistic update
    setInvoices(prev => prev.map(inv => 
      inv.id === invoiceId ? { ...inv, ...invoiceData } : inv
    ));
    
    startTransition(async () => {
      try {
        const result = await updateInvoiceAction(invoiceId, invoiceData);
        if (result.success && result.data) {
          setInvoices(prev => prev.map(inv => 
            inv.id === invoiceId ? result.data : inv
          ));
          toast({
            title: "Success",
            description: "Invoice updated successfully.",
          });
        } else {
          // Revert optimistic update on error
          setInvoices(prev => prev.map(inv => 
            inv.id === invoiceId ? inv : inv
          ));
          toast({
            title: "Error",
            description: result.error || "Failed to update invoice.",
            variant: "destructive",
          });
        }
      } catch (error) {
        // Revert optimistic update on error
        setInvoices(prev => prev.map(inv => 
          inv.id === invoiceId ? inv : inv
        ));
        toast({
          title: "Error",
          description: "An unexpected error occurred.",
          variant: "destructive",
        });
      }
    });
  };

  const handleInvoiceDelete = async (invoiceId: string) => {
    // Optimistic update
    const originalInvoices = invoices;
    setInvoices(prev => prev.filter(inv => inv.id !== invoiceId));
    
    startTransition(async () => {
      try {
        const result = await deleteInvoiceAction(invoiceId);
        if (result.success) {
          toast({
            title: "Success",
            description: "Invoice deleted successfully.",
          });
        } else {
          // Revert optimistic update on error
          setInvoices(originalInvoices);
          toast({
            title: "Error",
            description: result.error || "Failed to delete invoice.",
            variant: "destructive",
          });
        }
      } catch (error) {
        // Revert optimistic update on error
        setInvoices(originalInvoices);
        toast({
          title: "Error",
          description: "An unexpected error occurred.",
          variant: "destructive",
        });
      }
    });
  };

  const handleStatusChange = async (invoiceId: string, status: Invoice['status']) => {
    // Optimistic update
    setInvoices(prev => prev.map(inv => 
      inv.id === invoiceId 
        ? { 
            ...inv, 
            status,
            paymentStatus: status === 'Paid' ? 'Paid' : status === 'Overdue' ? 'Overdue' : 'Pending'
          }
        : inv
    ));
    
    startTransition(async () => {
      try {
        const result = await updateInvoiceStatusAction(invoiceId, status);
        if (result.success) {
          toast({
            title: "Success",
            description: `Invoice marked as ${status.toLowerCase()}.`,
          });
        } else {
          // Revert optimistic update on error
          setInvoices(prev => prev.map(inv => 
            inv.id === invoiceId ? inv : inv
          ));
          toast({
            title: "Error",
            description: result.error || "Failed to update invoice status.",
            variant: "destructive",
          });
        }
      } catch (error) {
        // Revert optimistic update on error
        setInvoices(prev => prev.map(inv => 
          inv.id === invoiceId ? inv : inv
        ));
        toast({
          title: "Error",
          description: "An unexpected error occurred.",
          variant: "destructive",
        });
      }
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Invoice Management</h2>
          <p className="text-muted-foreground">
            Create, track, and manage all your vendor invoices with comprehensive business insights.
          </p>
        </div>
        <InvoiceDialog
          vendors={vendors}
          contracts={contracts}
          onSubmit={handleInvoiceCreate}
          mode="create"
          trigger={
            <Button disabled={isPending}>
              <Plus className="mr-2 h-4 w-4" />
              Create Invoice
            </Button>
          }
        />
      </div>
      
      <InvoicesTable 
        data={invoices} 
        vendors={vendors}
        contracts={contracts}
        onInvoiceUpdate={handleInvoiceUpdate}
        onInvoiceDelete={handleInvoiceDelete}
        onStatusChange={handleStatusChange}
      />
    </div>
  );
}
