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
import { Loader2, Search, Wand2, CornerDownLeft, ExternalLink, Building2, FileText, Users, Receipt } from "lucide-react";
import type { Invoice, Vendor, User, Contract, Company } from "@/lib/types";
import { getAIAssistantResponse } from "@/ai/flows/ai-assistant-flow";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

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
    description: string;
    href: string;
    icon: React.ReactNode;
  }>>([]);
  const { toast } = useToast();

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

  const generateSuggestedActions = useCallback((response: string) => {
    const actions: Array<{
      title: string;
      description: string;
      href: string;
      icon: React.ReactNode;
    }> = [];

    // Analyze response for suggested actions
    if (response.toLowerCase().includes('vendor')) {
      actions.push({
        title: 'View Vendors',
        description: 'Manage your vendor relationships',
        href: '/dashboard/vendors',
        icon: <Users className="h-4 w-4" />
      });
    }
    
    if (response.toLowerCase().includes('invoice')) {
      actions.push({
        title: 'View Invoices',
        description: 'Review and manage invoices',
        href: '/dashboard/invoices',
        icon: <Receipt className="h-4 w-4" />
      });
    }
    
    if (response.toLowerCase().includes('contract')) {
      actions.push({
        title: 'View Contracts',
        description: 'Manage contract agreements',
        href: '/dashboard/contracts',
        icon: <FileText className="h-4 w-4" />
      });
    }

    if (response.toLowerCase().includes('company') || response.toLowerCase().includes('profile')) {
      actions.push({
        title: 'Company Profile',
        description: 'Update company information',
        href: '/dashboard/company',
        icon: <Building2 className="h-4 w-4" />
      });
    }

    setSuggestedActions(actions);
  }, []);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setIsLoading(true);
    setResponse("");
    setSuggestedActions([]);

    try {
      // Prepare contextual data with better filtering
      const relevantInvoices = invoices.slice(0, 50); // Limit to recent invoices
      const relevantVendors = vendors.slice(0, 100); // Limit vendor data
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
      generateSuggestedActions(result.response);
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
  }, [query, user, invoices, vendors, contracts, toast, generateSuggestedActions]);

  const handleActionClick = (href: string) => {
    window.location.href = href;
    setOpen(false);
  };

  const quickPrompts = [
    "Show me overdue invoices",
    "Top performing vendors",
    "Contracts expiring soon",
    "Company financial overview",
    "Vendor payment trends",
    "Invoice status summary"
  ];

  const handleQuickPrompt = (prompt: string) => {
    setQuery(prompt);
    // Auto-submit the prompt
    setTimeout(() => {
      handleSubmit({ preventDefault: () => {} } as React.FormEvent);
    }, 100);
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
      <DialogContent className="sm:max-w-[800px] max-h-[600px] overflow-hidden">
        <DialogTitle className="sr-only">AI Assistant</DialogTitle>
        <div className="flex flex-col space-y-4 h-full">
          <div className="flex items-center space-x-2 border-b pb-4">
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
          </div>

          <form onSubmit={handleSubmit} className="flex space-x-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Ask about your business data..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="pl-9 pr-9"
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

          {/* Quick Prompts */}
          <div className="flex flex-wrap gap-2">
            {quickPrompts.map((prompt) => (
              <Button
                key={prompt}
                variant="outline"
                size="sm"
                onClick={() => handleQuickPrompt(prompt)}
                disabled={isLoading}
                className="text-xs"
              >
                {prompt}
              </Button>
            ))}
          </div>

          {/* Response Area */}
          <div className="flex-1 overflow-y-auto">
            {isLoading && (
              <div className="space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-4 w-5/6" />
              </div>
            )}
            {response && (
              <div className="space-y-4">
                <div className="prose prose-sm max-w-none">
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {response}
                  </p>
                </div>
                
                {/* Suggested Actions */}
                {suggestedActions.length > 0 && (
                  <div className="space-y-2">
                    <h3 className="text-sm font-medium">Suggested Actions:</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {suggestedActions.map((action) => (
                        <Button
                          key={action.href}
                          variant="outline"
                          size="sm"
                          onClick={() => handleActionClick(action.href)}
                          className="justify-start h-auto p-3"
                        >
                          <div className="flex items-center space-x-2">
                            {action.icon}
                            <div className="text-left">
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
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
