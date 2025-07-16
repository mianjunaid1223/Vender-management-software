"use client";

import { useState, useTransition, useEffect } from "react";
import { InvoicesTable } from "@/components/dashboard/invoices-table";
import { InvoiceDialog } from "@/components/dashboard/invoice-dialog";
import { 
  createInvoiceAction, 
  updateInvoiceAction, 
  deleteInvoiceAction, 
  updateInvoiceStatusAction,
  refreshInvoiceStatusesAction
} from "@/app/actions";
import { Plus, RefreshCw } from "lucide-react";
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

  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        await refreshInvoiceStatusesAction();
      } catch (error) {
        console.error('Auto-refresh failed:', error);
      }
    }, 300000); 

    return () => clearInterval(interval);
  }, []);

  const handleInvoiceCreate = async (invoiceData: Partial<Invoice>) => {
    startTransition(async () => {
      const result = await createInvoiceAction(invoiceData);
      if (result.success && result.data) {
        setInvoices(prev => [result.data, ...prev]);
        toast({ title: "Success", description: "Invoice created successfully." });
      } else {
        toast({ title: "Error", description: result.error || "Failed to create invoice.", variant: "destructive" });
      }
    });
  };

  const handleInvoiceUpdate = async (invoiceData: Partial<Invoice>) => {
    if (!invoiceData.id) return;
    
    const originalInvoices = [...invoices];
    setInvoices(prev => prev.map(inv => 
      inv.id === invoiceData.id ? { ...inv, ...invoiceData } : inv
    ));
    
    startTransition(async () => {
      const result = await updateInvoiceAction(invoiceData.id!, invoiceData);
      if (result.success && result.data) {
        setInvoices(prev => prev.map(inv => 
          inv.id === invoiceData.id ? result.data : inv
        ));
        toast({ title: "Success", description: "Invoice updated successfully." });
      } else {
        setInvoices(originalInvoices);
        toast({ title: "Error", description: result.error || "Failed to update invoice.", variant: "destructive" });
      }
    });
  };

  const handleInvoiceDelete = async (invoiceId: string) => {
    const originalInvoices = invoices;
    setInvoices(prev => prev.filter(inv => inv.id !== invoiceId));
    
    startTransition(async () => {
      const result = await deleteInvoiceAction(invoiceId);
      if (result.success) {
        toast({ title: "Success", description: "Invoice deleted successfully." });
      } else {
        setInvoices(originalInvoices);
        toast({ title: "Error", description: result.error || "Failed to delete invoice.", variant: "destructive" });
      }
    });
  };

  const handleStatusChange = async (invoiceId: string, status: Invoice['status']) => {
    const originalInvoices = [...invoices];
    setInvoices(prev => prev.map(inv => 
      inv.id === invoiceId 
        ? { ...inv, status, paymentStatus: status === 'Paid' ? 'Paid' : 'Pending' }
        : inv
    ));
    
    startTransition(async () => {
      const result = await updateInvoiceStatusAction(invoiceId, status);
      if (!result.success) {
        setInvoices(originalInvoices);
        toast({ title: "Error", description: result.error || "Failed to update status.", variant: "destructive" });
      } else {
         toast({ title: "Success", description: `Invoice status updated to ${status}.` });
      }
    });
  };

  const handleRefreshStatuses = async () => {
    startTransition(async () => {
      const result = await refreshInvoiceStatusesAction();
      if (result.success) {
        window.location.reload();
        toast({ title: "Success", description: result.message });
      } else {
        toast({ title: "Error", description: result.message, variant: "destructive" });
      }
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Invoice Management</h2>
          <p className="text-muted-foreground">
            Create, track, and manage all your vendor invoices.
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={handleRefreshStatuses}
            disabled={isPending}
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${isPending ? 'animate-spin' : ''}`} />
            Refresh Status
          </Button>
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
