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
import { Loader2, Search, Wand2, CornerDownLeft } from "lucide-react";
import type { Invoice, Vendor, User } from "@/lib/types";
import { getAIAssistantResponse } from "@/ai/flows/ai-assistant-flow";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export function AISpotlight({
  user,
  invoices,
  vendors,
}: {
  user: User;
  invoices: Invoice[];
  vendors: Vendor[];
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [response, setResponse] = useState("");
  const [isLoading, setIsLoading] = useState(false);
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
    }
  }

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!query) return;

    setIsLoading(true);
    setResponse("");

    try {
      const result = await getAIAssistantResponse({
        query: query,
        userData: JSON.stringify(user),
        invoiceData: JSON.stringify(invoices),
        vendorData: JSON.stringify(vendors),
      });
      setResponse(result.response);
    } catch (error) {
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
          <div className="absolute -inset-0.5 bg-gradient-to-r from-apple-ai-pink to-apple-ai-blue rounded-lg blur-lg opacity-40 group-hover:opacity-60 transition duration-300"></div>
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
              'bg-gradient-to-br from-apple-ai-blue via-apple-ai-purple to-apple-ai-pink',
              '[background-size:200%_200%]',
              'blur-3xl opacity-70 dark:opacity-50 transition-opacity',
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
                    <p className="text-sm text-foreground/90">
                      {response}
                    </p>
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
