"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Search, Wand2, CornerDownLeft, ExternalLink, Building2, FileText, Users, Receipt, Eye, Edit, Trash2, Plus } from "lucide-react";
import type { Invoice, Vendor, User, Contract, Company } from "@/lib/types";
import { getAIAssistantResponse } from "@/ai/flows/ai-assistant-flow";
import { Skeleton } from "@/components/ui/skeleton";
import { useRouter } from "next/navigation";

interface AISpotlightProps {
  user: User;
  invoices: Invoice[];
  vendors: Vendor[];
  contracts?: Contract[];
  company?: Company;
}

export function AISpotlight({
  user,
  invoices,
  vendors,
  contracts,
  company,
}: AISpotlightProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [response, setResponse] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [suggestedActions, setSuggestedActions] = useState<Array<{
    title: string;
    type: 'navigate' | 'action';
    href?: string;
    action?: () => void;
    icon: React.ReactNode;
    description: string;
  }>>([]);
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);
  
  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (!isOpen) {
      setQuery("");
      setResponse("");
      setSuggestedActions([]);
    }
  };

  const generateIntelligentActions = useCallback((response: string, query: string) => {
    const actions: Array<{
      title: string;
      type: 'navigate' | 'action';
      href?: string;
      action?: () => void;
      icon: React.ReactNode;
      description: string;
    }> = [];

    // Parse response for specific entities and actions
    const lowerQuery = query.toLowerCase();
    const lowerResponse = response.toLowerCase();

    // Check for specific vendor names
    vendors.forEach(vendor => {
      if (lowerResponse.includes(vendor.name.toLowerCase()) || lowerQuery.includes(vendor.name.toLowerCase())) {
        actions.push({
          title: `View ${vendor.name}`,
          type: 'navigate',
          href: `/dashboard/vendors?search=${encodeURIComponent(vendor.name)}`,
          icon: <Eye className="h-4 w-4" />,
          description: `View details for ${vendor.name}`
        });
      }
    });

    // Check for specific invoice numbers or statuses
    if (lowerResponse.includes('overdue') || lowerQuery.includes('overdue')) {
      actions.push({
        title: 'View Overdue Invoices',
        type: 'navigate',
        href: '/dashboard/invoices?filter=overdue',
        icon: <Receipt className="h-4 w-4" />,
        description: 'Show all overdue invoices'
      });
    }

    // Check for contract mentions
    if (lowerResponse.includes('expiring') || lowerQuery.includes('expiring')) {
      actions.push({
        title: 'View Expiring Contracts',
        type: 'navigate',
        href: '/dashboard/contracts?filter=expiring',
        icon: <FileText className="h-4 w-4" />,
        description: 'Show contracts expiring soon'
      });
    }

    // Add general navigation based on context
    if (lowerResponse.includes('vendor') && !actions.some(a => a.href?.includes('/vendors'))) {
      actions.push({
        title: 'Manage Vendors',
        type: 'navigate',
        href: '/dashboard/vendors',
        icon: <Users className="h-4 w-4" />,
        description: 'View and manage all vendors'
      });
    }

    if (lowerResponse.includes('invoice') && !actions.some(a => a.href?.includes('/invoices'))) {
      actions.push({
        title: 'View Invoices',
        type: 'navigate',
        href: '/dashboard/invoices',
        icon: <Receipt className="h-4 w-4" />,
        description: 'View and manage invoices'
      });
    }

    if (lowerResponse.includes('contract') && !actions.some(a => a.href?.includes('/contracts'))) {
      actions.push({
        title: 'View Contracts',
        type: 'navigate',
        href: '/dashboard/contracts',
        icon: <FileText className="h-4 w-4" />,
        description: 'View and manage contracts'
      });
    }

    if (lowerResponse.includes('company') || lowerResponse.includes('profile')) {
      actions.push({
        title: 'Company Profile',
        type: 'navigate',
        href: '/dashboard/company',
        icon: <Building2 className="h-4 w-4" />,
        description: 'Update company information'
      });
    }

    // Add create actions if mentioned
    if (lowerResponse.includes('add') || lowerResponse.includes('create') || lowerResponse.includes('new')) {
      if (lowerResponse.includes('vendor')) {
        actions.push({
          title: 'Add New Vendor',
          type: 'navigate',
          href: '/dashboard/vendors?action=add',
          icon: <Plus className="h-4 w-4" />,
          description: 'Create a new vendor'
        });
      }
      if (lowerResponse.includes('contract')) {
        actions.push({
          title: 'Add New Contract',
          type: 'navigate',
          href: '/dashboard/contracts?action=add',
          icon: <Plus className="h-4 w-4" />,
          description: 'Create a new contract'
        });
      }
    }

    // Limit to 4 most relevant actions
    setSuggestedActions(actions.slice(0, 4));
  }, [vendors, router]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setIsLoading(true);
    setResponse("");
    setSuggestedActions([]);

    try {
      // Prepare contextual data with better filtering
      const relevantInvoices = invoices.slice(0, 50);
      const relevantVendors = vendors.slice(0, 100);
      const relevantContracts = contracts?.slice(0, 50) || [];
      
      const result = await getAIAssistantResponse({
        query: query,
        userData: JSON.stringify({
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        }),
        invoiceData: JSON.stringify(relevantInvoices),
        vendorData: JSON.stringify(relevantVendors),
        contractData: JSON.stringify(relevantContracts),
        companyData: company ? JSON.stringify(company) : "{}",
      });
      
      setResponse(result.response);
      generateIntelligentActions(result.response, query);
    } catch (error) {
      console.error('AI Assistant Error:', error);
      toast({
        title: "Error",
        description: "Failed to get AI response. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [query, user, invoices, vendors, contracts, company, toast, generateIntelligentActions]);

  const handleActionClick = (action: typeof suggestedActions[0]) => {
    if (action.type === 'navigate' && action.href) {
      router.push(action.href);
      setOpen(false);
    } else if (action.type === 'action' && action.action) {
      action.action();
      setOpen(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <div className="relative group">
          <Button
            variant="outline"
            className="relative h-10 w-10 rounded-full"
            size="icon"
          >
            <Wand2 className="h-4 w-4" />
            <span className="sr-only">AI Assistant</span>
          </Button>
          <div className="absolute -top-2 -right-2 h-4 w-4 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full animate-pulse" />
        </div>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] max-h-[80vh] overflow-hidden">
        <DialogTitle className="sr-only">AI Assistant</DialogTitle>
        <div className="flex flex-col space-y-4 h-full">
          <div className="flex items-center space-x-2">
            <div className="h-8 w-8 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
              <Wand2 className="h-4 w-4 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">AI Assistant</h2>
              <p className="text-sm text-muted-foreground">
                Ask me anything about your vendors, invoices, or contracts
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="flex space-x-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Ask about your business data..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="pl-9 pr-12"
                disabled={isLoading}
              />
              <kbd className="absolute right-3 top-2.5 text-xs text-muted-foreground">
                ⌘K
              </kbd>
            </div>
            <Button type="submit" disabled={isLoading || !query.trim()}>
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <CornerDownLeft className="h-4 w-4" />
              )}
            </Button>
          </form>

          <div className="flex-1 overflow-y-auto space-y-4">
            {isLoading && (
              <div className="space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-4 w-5/6" />
              </div>
            )}
            
            {response && (
              <div className="rounded-lg border bg-muted/50 p-4">
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {response}
                </p>
              </div>
            )}

            {suggestedActions.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-sm font-medium">Actions:</h3>
                <div className="space-y-1">
                  {suggestedActions.map((action, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      size="sm"
                      onClick={() => handleActionClick(action)}
                      className="w-full justify-start h-auto p-3"
                    >
                      <div className="flex items-center space-x-2 w-full">
                        {action.icon}
                        <div className="text-left flex-1">
                          <div className="font-medium text-xs">{action.title}</div>
                          <div className="text-xs text-muted-foreground">
                            {action.description}
                          </div>
                        </div>
                        <ExternalLink className="h-3 w-3 ml-auto" />
                      </div>
                    </Button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
