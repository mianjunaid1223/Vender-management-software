"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Search, ArrowRight, FileText, Users, Receipt, Building2, Clock, TrendingUp, FileClock, CornerDownLeft } from "lucide-react";
import type { Invoice, Vendor, User, Contract, Company } from "@/lib/types";
import { geminiService } from "@/ai/gemini-service";
import { cn } from "@/lib/utils";

interface SpotlightProps {
  user: User;
  invoices: Invoice[];
  vendors: Vendor[];
  contracts?: Contract[];
  company?: Company;
}

interface SearchResult {
  type: 'response' | 'action' | 'data';
  title: string;
  subtitle?: string;
  icon: React.ReactNode;
  action?: () => void;
  href?: string;
}

export function Spotlight({ user, invoices, vendors, contracts, company }: SpotlightProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [aiResponse, setAiResponse] = useState("");
  const [suggestedActions, setSuggestedActions] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  // Perform AI search on Enter key or explicit submission
  const handleSearch = useCallback(async () => {
    if (!query.trim() || query.length <= 2) {
      console.log("Query too short or empty:", query);
      return;
    }

    console.log("Starting search for:", query);
    setIsLoading(true);
    setAiResponse("");
    setSuggestedActions([]);
    
    try {
      const response = await geminiService.querySpotlight({
        query: `${query}. 

CONTEXT: I am a business intelligence assistant that provides insights only. I cannot perform actions, create reports, or execute tasks - I can only analyze data and provide professional business insights.

INSTRUCTIONS:
- Provide a brief, professional, and comprehensive answer that eliminates the need for follow-up questions
- Be direct and actionable in your insights
- Use plain text only - no markdown, bullet points, or special formatting
- Keep response concise but complete
- Focus on business intelligence and data insights
- End with 2-3 relevant action suggestions from this list: "View Invoices,View Vendors,View Contracts,Analytics Dashboard,Company Settings,Financial Reports,Vendor Performance,Invoice Management,Contract Management,Payment Tracking"

Format your response as: [Your analysis] ACTIONS: [comma-separated action suggestions]`,
        userData: JSON.stringify({ name: user.name, role: user.role }),
        vendorData: JSON.stringify(vendors.slice(0, 50)),
        invoiceData: JSON.stringify(invoices.slice(0, 50)),
        contractData: JSON.stringify(contracts?.slice(0, 20) || []),
        companyData: company ? JSON.stringify(company) : undefined
      });

      console.log("AI Response received:", response);

      // Parse response and extract actions
      const responseText = response.response
        .replace(/\*\*/g, '') // Remove bold markers
        .replace(/\*/g, '') // Remove italic markers
        .replace(/`/g, '') // Remove code markers
        .replace(/#{1,6}\s/g, '') // Remove headers
        .replace(/^\s*[-*+]\s/gm, '') // Remove bullet points
        .replace(/^\s*\d+\.\s/gm, '') // Remove numbered lists
        .trim();

      // Extract actions from response
      const actionMatch = responseText.match(/ACTIONS:\s*(.+)$/);
      if (actionMatch) {
        const actions = actionMatch[1].split(',').map(action => action.trim()).filter(Boolean);
        setSuggestedActions(actions.slice(0, 4)); // Limit to 4 actions
        setAiResponse(responseText.replace(/ACTIONS:\s*.+$/, '').trim());
      } else {
        setAiResponse(responseText);
        // Default actions if AI doesn't provide them
        setSuggestedActions(['View Invoices', 'Analytics Dashboard', 'View Vendors']);
      }
    } catch (error) {
      console.error("Error searching with AI:", error);
      setAiResponse("I'm unable to process your request at the moment. Please try again or check specific sections of your dashboard for the information you need.");
      setSuggestedActions(['View Invoices', 'Analytics Dashboard', 'View Vendors']);
    } finally {
      setIsLoading(false);
    }
  }, [query, user, vendors, invoices, contracts, company]);

  // Handle Cmd+K to open/close with smooth transitions
  const handleOpenChange = useCallback((newOpen: boolean) => {
    if (!newOpen) {
      // Clear AI response and loading state first for smooth collapse
      setAiResponse("");
      setSuggestedActions([]);
      setIsLoading(false);
      
      // Small delay to allow content to animate out before closing dialog
      setTimeout(() => {
        setOpen(false);
        setQuery("");
        setResults([]);
        setSelectedIndex(0);
      }, 100);
    } else {
      setOpen(true);
    }
  }, []);

  // Open Spotlight with Cmd+K (changed from Cmd+Space)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen(!open);
      }
      if (e.key === "Escape") {
        setOpen(false);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open]);

  // Focus input when opened
  useEffect(() => {
    if (open && inputRef.current) {
      inputRef.current.focus();
    }
  }, [open]);

  // Generate quick results based on query
  const generateQuickResults = useCallback((searchQuery: string): SearchResult[] => {
    if (!searchQuery.trim()) {
      // Default suggestions when no query
      return [
        {
          type: 'action',
          title: 'Show overdue invoices',
          subtitle: 'View all unpaid invoices',
          icon: <Clock className="h-4 w-4" />,
          href: '/dashboard/invoices?status=overdue'
        },
        {
          type: 'action',
          title: 'View all vendors',
          subtitle: `${vendors.length} vendors total`,
          icon: <Users className="h-4 w-4" />,
          href: '/dashboard/vendors'
        },
        {
          type: 'action',
          title: 'Recent invoices',
          subtitle: `${invoices.length} invoices`,
          icon: <Receipt className="h-4 w-4" />,
          href: '/dashboard/invoices'
        },
        {
          type: 'action',
          title: 'Company settings',
          subtitle: 'Manage your company profile',
          icon: <Building2 className="h-4 w-4" />,
          href: '/dashboard/company'
        }
      ];
    }

    const results: SearchResult[] = [];
    const lowerQuery = searchQuery.toLowerCase();

    // Search vendors
    const matchingVendors = vendors.filter(vendor => 
      vendor.name.toLowerCase().includes(lowerQuery) ||
      vendor.email?.toLowerCase().includes(lowerQuery)
    ).slice(0, 3);

    matchingVendors.forEach(vendor => {
      results.push({
        type: 'data',
        title: vendor.name,
        subtitle: vendor.email || 'Vendor',
        icon: <Users className="h-4 w-4" />,
        href: `/dashboard/vendors/${vendor.id}`
      });
    });

    // Search invoices
    const matchingInvoices = invoices.filter(invoice => 
      invoice.invoiceNumber?.toLowerCase().includes(lowerQuery) ||
      invoice.seller?.name?.toLowerCase().includes(lowerQuery)
    ).slice(0, 3);

    matchingInvoices.forEach(invoice => {
      results.push({
        type: 'data',
        title: `Invoice ${invoice.invoiceNumber}`,
        subtitle: `${invoice.seller?.name || 'Vendor'} - $${invoice.totalAmount}`,
        icon: <Receipt className="h-4 w-4" />,
        href: `/dashboard/invoices/${invoice.id}`
      });
    });

    // Search contracts
    const matchingContracts = contracts?.filter(contract => 
      contract.title?.toLowerCase().includes(lowerQuery) ||
      contract.partyA?.name?.toLowerCase().includes(lowerQuery) ||
      contract.partyB?.name?.toLowerCase().includes(lowerQuery)
    ).slice(0, 2) || [];

    matchingContracts.forEach(contract => {
      results.push({
        type: 'data',
        title: contract.title || 'Contract',
        subtitle: contract.partyA?.name || contract.partyB?.name,
        icon: <FileText className="h-4 w-4" />,
        href: `/dashboard/contracts/${contract.id}`
      });
    });

    return results;
  }, [vendors, invoices, contracts]);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!open) return;
      
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % results.length);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + results.length) % results.length);
      } else if (e.key === "Enter") {
        e.preventDefault();
        // If there are search results, execute the selected one
        if (results.length > 0) {
          const selected = results[selectedIndex];
          if (selected?.action) {
            selected.action();
            setOpen(false);
          } else if (selected?.href) {
            window.location.href = selected.href;
            setOpen(false);
          }
        } else if (query.trim() && query.length > 2) {
          // Otherwise, trigger AI search
          handleSearch();
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, results, selectedIndex, query, handleSearch]);

  // Remove the duplicate handleKeyPress function as it's not needed

  // Handle search input changes - only show quick results, no auto AI search
  useEffect(() => {
    if (query.length > 0) {
      setResults(generateQuickResults(query));
    } else {
      setResults([]);
      setAiResponse("");
    }
    setSelectedIndex(0);
  }, [query, generateQuickResults]);

  return (
    <>
      {/* Trigger Search Bar - Fully Responsive Design */}
      <div 
        onClick={() => setOpen(true)}
        className="flex items-center justify-center mx-auto w-full max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg xl:max-w-xl cursor-pointer relative px-4 sm:px-0"
      >
        {/* Responsive Glow effects */}
        <div className="absolute -inset-2 sm:-inset-3 bg-gradient-to-r from-purple-600/30 via-blue-600/30 to-pink-600/30 rounded-lg sm:rounded-xl blur-md sm:blur-lg opacity-40 sm:opacity-50" />
        <div className="absolute -inset-1 sm:-inset-2 bg-gradient-to-br from-purple-500/20 via-blue-500/20 to-pink-500/20 rounded-md sm:rounded-lg blur-sm sm:blur-md opacity-30 sm:opacity-40" />
        
        <div className="relative flex items-center space-x-2 sm:space-x-3 px-3 sm:px-4 py-2 sm:py-2.5 bg-background border border-border rounded-md hover:bg-accent hover:text-accent-foreground transition-all duration-300 ease-out w-full shadow-sm hover:shadow-md">
          <TrendingUp className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary flex-shrink-0" />
          <span className="text-xs sm:text-sm text-muted-foreground flex-1 truncate">AI Spotlight</span>
          <kbd className="hidden xs:inline-flex px-1.5 sm:px-2 py-0.5 sm:py-1 text-xs text-muted-foreground bg-muted rounded border">
            ⌘K
          </kbd>
        </div>
      </div>

      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="w-[95vw] sm:w-[90vw] md:w-[85vw] lg:w-[80vw] xl:w-[75vw] 2xl:w-[70vw] max-w-4xl mx-auto p-0 gap-0 [&>button]:hidden rounded-2xl sm:rounded-[3.125rem] overflow-visible">
          {/* Responsive Dialog Glow */}
          <div className="absolute -inset-4 sm:-inset-6 md:-inset-8 bg-gradient-to-r from-purple-600/30 via-blue-600/30 to-pink-600/30 rounded-2xl sm:rounded-3xl blur-2xl sm:blur-3xl opacity-60 sm:opacity-80" />
          <div className="absolute -inset-3 sm:-inset-4 md:-inset-6 bg-gradient-to-br from-purple-500/25 via-blue-500/25 to-pink-500/25 rounded-xl sm:rounded-2xl blur-xl sm:blur-2xl opacity-40 sm:opacity-60" />
          <div className="absolute -inset-2 sm:-inset-3 md:-inset-4 bg-gradient-to-tl from-purple-400/15 via-blue-400/15 to-pink-400/15 rounded-lg sm:rounded-xl blur-lg sm:blur-xl opacity-30 sm:opacity-40" />
          
          <div className="relative flex flex-col w-full">
            {/* Responsive Google-like Search Input */}
            <div className="relative w-full">
              {/* Responsive Input Background Glow */}
              <div className={cn(
                "absolute -inset-1 sm:-inset-2 bg-gradient-to-r from-purple-500/25 via-blue-500/25 to-pink-500/25 blur-md sm:blur-lg opacity-50 sm:opacity-60 transition-all duration-700 ease-out",
                (isLoading || aiResponse) 
                  ? "rounded-t-xl sm:rounded-t-3xl rounded-b-none" 
                  : "rounded-2xl sm:rounded-full"
              )} />
              
              <div className={cn(
                "relative bg-background/95 backdrop-blur-xl border border-border/50 shadow-2xl transition-all duration-700 ease-out",
                (isLoading || aiResponse) 
                  ? "rounded-t-xl sm:rounded-t-3xl rounded-b-none" 
                  : "rounded-2xl sm:rounded-full"
              )}>
                {/* Responsive Input Container */}
                <div className="flex items-center p-2 sm:p-3 md:p-4 gap-2">
                  <div className="flex items-center w-full min-w-0">
                    <Input
                      ref={inputRef}
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder="Ask me anything about your business..."
                      className="flex-1 h-8 sm:h-10 text-sm sm:text-base md:text-lg border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-muted-foreground/60 min-w-0"
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && query.trim() && query.length > 2) {
                          e.preventDefault();
                          e.stopPropagation();
                          handleSearch();
                        }
                      }}
                    />
                    
                    {query.trim() && query.length > 2 && (
                      <Button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleSearch();
                        }}
                        disabled={isLoading}
                        size="sm"
                        className="ml-1 sm:ml-2 h-8 sm:h-10 px-2 sm:px-3 rounded-md sm:rounded-lg bg-blue-500 hover:bg-blue-600 text-white transition-all duration-300 flex-shrink-0"
                      >
                        {isLoading ? (
                          <div className="w-3 h-3 sm:w-4 sm:h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                          <CornerDownLeft className="h-3 w-3 sm:h-4 sm:w-4" />
                        )}
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Responsive Expandable Content Area */}
            <div 
              className={cn(
                "relative bg-background/95 backdrop-blur-xl border-x border-b border-border/50 shadow-2xl will-change-transform transition-all duration-700 ease-out",
                "rounded-b-xl sm:rounded-b-3xl",
                (isLoading || aiResponse) 
                  ? "max-h-[60vh] sm:max-h-[70vh] opacity-100 translate-y-0 scale-100 visible" 
                  : "max-h-0 opacity-0 -translate-y-1 scale-98 invisible"
              )}
              style={{ 
                transformOrigin: 'top center',
                transition: 'max-height 0.7s ease-out, opacity 0.7s ease-out, transform 0.7s ease-out, visibility 0.7s ease-out'
              }}
            >
              <div 
                className="overflow-y-auto max-h-[60vh] sm:max-h-[70vh] overscroll-contain"
                style={{ 
                  scrollbarWidth: 'thin',
                  scrollbarColor: 'rgba(0,0,0,0.2) transparent'
                }}
              >
                {/* Responsive Loading Skeleton */}
                {isLoading && (
                  <div className="p-3 sm:p-4 md:p-6 space-y-2 sm:space-y-3 animate-in fade-in duration-500">
                    <div className="space-y-2 sm:space-y-3">
                      <div className="h-3 sm:h-4 bg-muted rounded animate-pulse w-full" />
                      <div className="h-3 sm:h-4 bg-muted rounded animate-pulse w-4/5" />
                      <div className="h-3 sm:h-4 bg-muted rounded animate-pulse w-3/5" />
                      <div className="h-3 sm:h-4 bg-muted rounded animate-pulse w-5/6" />
                    </div>
                  </div>
                )}

                {/* Responsive AI Response */}
                {aiResponse && (
                  <div className="p-3 sm:p-4 md:p-6 animate-in fade-in slide-in-from-bottom-2 duration-700">
                    <div className="text-xs sm:text-sm md:text-base leading-relaxed whitespace-pre-wrap text-foreground mb-4 sm:mb-6">
                      {aiResponse}
                    </div>
                    
                    {/* Responsive Dynamic Action Suggestions */}
                    {suggestedActions.length > 0 && (
                      <div className="space-y-2 sm:space-y-3">
                        <div className="text-xs sm:text-sm font-medium text-muted-foreground">
                          Recommended actions:
                        </div>
                        <div className="flex flex-wrap gap-1.5 sm:gap-2">
                          {suggestedActions.map((action, index) => {
                            const actionMap: Record<string, string> = {
                              'View Invoices': '/dashboard/invoices',
                              'View Vendors': '/dashboard/vendors',
                              'View Contracts': '/dashboard/contracts',
                              'Analytics Dashboard': '/dashboard/analytics',
                              'Company Settings': '/dashboard/company',
                              'Financial Reports': '/dashboard/reports',
                              'Vendor Performance': '/dashboard/vendors',
                              'Invoice Management': '/dashboard/invoices',
                              'Contract Management': '/dashboard/contracts',
                              'Payment Tracking': '/dashboard/invoices?status=paid'
                            };
                            
                            return (
                              <Button
                                key={index}
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  const href = actionMap[action] || '/dashboard';
                                  window.location.href = href;
                                }}
                                className="h-6 sm:h-8 text-xs sm:text-sm px-2 sm:px-3 rounded-md sm:rounded-lg hover:bg-primary/5 transition-colors duration-200 whitespace-nowrap"
                              >
                                {action}
                              </Button>
                            );
                          })}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setAiResponse("");
                              setSuggestedActions([]);
                              setQuery("");
                              if (inputRef.current) {
                                inputRef.current.focus();
                              }
                            }}
                            className="h-6 sm:h-8 text-xs sm:text-sm px-2 sm:px-3 rounded-md sm:rounded-lg hover:bg-primary/5 transition-colors duration-200 whitespace-nowrap"
                          >
                            Ask another question
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}