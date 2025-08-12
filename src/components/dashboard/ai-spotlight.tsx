"use client";

import { useState, useEffect, useCallback } from "react";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import {
  Loader2,
  Search,
  CornerDownLeft,
  ExternalLink,
  Building2,
  FileText,
  Users,
  Receipt,
  Eye,
  Edit,
  Plus,
  ArrowRight,
} from "lucide-react";
import type { Invoice, Vendor, User, Contract, Company } from "@/lib/types";
import { getAIAssistantResponse } from "@/lib/ai/genkit/flows/ai-assistant-flow";
import { Skeleton } from "@/components/ui/skeleton";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils/index"; // likely needed if `cn` is used below

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
  const [suggestedActions, setSuggestedActions] = useState<
    Array<{
      title: string;
      description: string;
      href?: string;
      action?: () => void;
      icon: React.ReactNode;
    }>
  >([]);
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

  const handleActionClick = (action: typeof suggestedActions[0]) => {
    if (action.href) {
      router.push(action.href);
      setOpen(false);
    } else if (action.action) {
      action.action();
      setOpen(false);
    }
  };

  const generateIntelligentActions = useCallback((response: string, query: string) => {
    const actions: Array<{
      title: string;
      description: string;
      href?: string;
      action?: () => void;
      icon: React.ReactNode;
    }> = [];

    const lowerQuery = query.toLowerCase();
    const lowerResponse = response.toLowerCase();

    // Check for specific vendor names
    vendors.forEach(vendor => {
      if (lowerResponse.includes(vendor.name.toLowerCase()) || lowerQuery.includes(vendor.name.toLowerCase())) {
        actions.push({
          title: `View ${vendor.name}`,
          description: `View details for ${vendor.name}`,
          href: `/dashboard/vendors?search=${encodeURIComponent(vendor.name)}`,
          icon: <Eye className="h-4 w-4" />,
        });
      }
    });

    // Check for specific invoice statuses
    if (lowerResponse.includes('overdue') || lowerQuery.includes('overdue')) {
      actions.push({
        title: 'View Overdue Invoices',
        description: 'Show all overdue invoices',
        href: '/dashboard/invoices?filter=overdue',
        icon: <Receipt className="h-4 w-4" />,
      });
    }

    // Check for contract mentions
    if (lowerResponse.includes('expiring') || lowerQuery.includes('expiring')) {
      actions.push({
        title: 'View Expiring Contracts',
        description: 'Show contracts expiring soon',
        href: '/dashboard/contracts?filter=expiring',
        icon: <FileText className="h-4 w-4" />,
      });
    }

    // Add general navigation based on context
    if (lowerResponse.includes('vendor') && !actions.some(a => a.href?.includes('/vendors'))) {
      actions.push({
        title: 'Manage Vendors',
        description: 'View and manage all vendors',
        href: '/dashboard/vendors',
        icon: <Users className="h-4 w-4" />,
      });
    }

    if (lowerResponse.includes('invoice') && !actions.some(a => a.href?.includes('/invoices'))) {
      actions.push({
        title: 'View Invoices',
        description: 'View and manage invoices',
        href: '/dashboard/invoices',
        icon: <Receipt className="h-4 w-4" />,
      });
    }

    if (lowerResponse.includes('contract') && !actions.some(a => a.href?.includes('/contracts'))) {
      actions.push({
        title: 'View Contracts',
        description: 'View and manage contracts',
        href: '/dashboard/contracts',
        icon: <FileText className="h-4 w-4" />,
      });
    }

    if (lowerResponse.includes('company') || lowerResponse.includes('profile')) {
      actions.push({
        title: 'Company Profile',
        description: 'Update company information',
        href: '/dashboard/company',
        icon: <Building2 className="h-4 w-4" />,
      });
    }

    // Add create actions if mentioned
    if (lowerResponse.includes('add') || lowerResponse.includes('create') || lowerResponse.includes('new')) {
      if (lowerResponse.includes('vendor')) {
        actions.push({
          title: 'Add New Vendor',
          description: 'Create a new vendor',
          href: '/dashboard/vendors',
          icon: <Plus className="h-4 w-4" />,
        });
      }
      if (lowerResponse.includes('contract')) {
        actions.push({
          title: 'Add New Contract',
          description: 'Create a new contract',
          href: '/dashboard/contracts',
          icon: <Plus className="h-4 w-4" />,
        });
      }
    }

    // Limit to 4 most relevant actions
    setSuggestedActions(actions.slice(0, 4));
  }, [vendors, router]);

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!query) return;

    setIsLoading(true);
    setResponse("");
    setSuggestedActions([]);

    try {
      const result = await getAIAssistantResponse({
        query: query,
        userData: JSON.stringify(user),
        invoiceData: JSON.stringify(invoices),
        vendorData: JSON.stringify(vendors),
        contractData: JSON.stringify(contracts || []),
        companyData: company ? JSON.stringify(company) : "{}",
      });
      setResponse(result.response);
      generateIntelligentActions(result.response, query);
    } catch {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to get a response from the AI. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <div className="relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-500 via-blue-500 to-pink-500 rounded-lg blur-lg opacity-60 group-hover:opacity-80 transition duration-300"></div>
          <button className="relative w-full max-w-sm flex items-center justify-start text-sm h-10 px-4 py-2 text-muted-foreground bg-background rounded-md border">
            <Search className="h-4 w-4 mr-2" />
            <span>Ask AI...</span>
            <kbd className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
              <span className="text-xs">⌘</span>K
            </kbd>
          </button>
        </div>
      </DialogTrigger>
      <DialogContent
        hideCloseButton
        className="sm:max-w-2xl p-0 gap-0 border-none bg-transparent shadow-none overflow-visible"
      >
        <div className="relative">
           <div
            className={cn(
              'absolute -top-[5%] -left-[5%] h-[110%] w-[110%] -z-10 rounded-2xl',
              'bg-gradient-to-r from-purple-500 via-blue-500 to-pink-500',
              '[background-size:200%_200%]',
              'blur-3xl opacity-80 dark:opacity-70 transition-opacity',
              isLoading && 'animate-gradient-shift'
            )}
          />

          <div className="relative rounded-lg overflow-hidden bg-background border border-border/20 shadow-2xl">
            <DialogTitle className="sr-only">AI Spotlight</DialogTitle>
            <form onSubmit={handleSubmit}>
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  placeholder="Ask about your vendors, invoices, or spending..."
                  className="h-14 pl-12 text-base border-0 shadow-none bg-transparent focus-visible:ring-0"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  disabled={isLoading}
                />
                <Button
                  type="submit"
                  size="icon"
                  className="absolute right-4 top-1/2 -translate-y-1/2 bg-transparent text-muted-foreground hover:text-foreground focus-visible:ring-0 focus-visible:ring-offset-0"
                  disabled={isLoading || !query}
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <CornerDownLeft className="h-4 w-4" />
                  )}
                  <span className="sr-only">Submit</span>
                </Button>
              </div>
            </form>
            <div className={cn(
              "grid transition-all duration-300 ease-in-out",
              (isLoading || response) ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
            )}>
              <div className="overflow-hidden">
                <div className="p-6 min-h-[150px]">
                  {isLoading && (
                    <div className="space-y-3">
                      <Skeleton className="h-5 w-32 bg-muted" />
                      <div className="space-y-2 rounded-md">
                        <Skeleton className="h-4 w-full bg-muted" />
                        <Skeleton className="h-4 w-full bg-muted" />
                        <Skeleton className="h-4 w-[85%] bg-muted" />
                      </div>
                    </div>
                  )}
                  {response && !isLoading && (
                    <div className="space-y-4">
                       <article className="prose prose-sm dark:prose-invert max-w-none markdown-body">
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {response}
                          </ReactMarkdown>
                        </article>
                      {suggestedActions.length > 0 && (
                        <div className="space-y-2">
                          <h4 className="text-sm font-medium text-foreground/80">Quick Actions:</h4>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {suggestedActions.map((action, index) => (
                              <Button
                                key={index}
                                variant="outline"
                                size="sm"
                                onClick={() => handleActionClick(action)}
                                className="h-auto p-3 justify-start"
                              >
                                <div className="flex items-center space-x-2 w-full">
                                  {action.icon}
                                  <div className="text-left flex-1">
                                    <div className="font-medium text-xs">{action.title}</div>
                                    <div className="text-xs text-muted-foreground">
                                      {action.description}
                                    </div>
                                  </div>
                                  <ArrowRight className="h-3 w-3 ml-auto" />
                                </div>
                              </Button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
