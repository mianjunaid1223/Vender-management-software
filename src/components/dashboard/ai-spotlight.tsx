"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Search, Wand2, CornerDownLeft } from "lucide-react";
import type { Invoice, Vendor, User } from "@/lib/types";
import { getAIAssistantResponse } from "@/ai/flows/ai-assistant-flow";
import { Skeleton } from "@/components/ui/skeleton";

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
      console.error("Error getting AI assistant response:", error);
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
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          className="relative w-full max-w-sm justify-start text-sm text-muted-foreground"
        >
          <Search className="h-4 w-4 mr-2" />
          <span>Ask AI...</span>
          <kbd className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
            <span className="text-xs">⌘</span>K
          </kbd>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl p-0 gap-0 overflow-hidden">
        <form onSubmit={handleSubmit}>
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="Ask about your vendors, invoices, or spending..."
              className="h-14 pl-12 text-base border-0 focus-visible:ring-0 shadow-none"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <Button
              type="submit"
              size="icon"
              className="absolute right-4 top-1/2 -translate-y-1/2"
              disabled={isLoading || !query}
            >
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CornerDownLeft className="h-4 w-4" />}
              <span className="sr-only">Submit</span>
            </Button>
          </div>
        </form>
        {(isLoading || response) && (
          <div className="p-6 pt-0 border-t">
            {isLoading && (
              <div className="space-y-3 pt-6">
                <Skeleton className="h-5 w-32" />
                <div className="space-y-2 rounded-md">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-[85%]" />
                </div>
              </div>
            )}
            {response && !isLoading && (
              <div className="animate-fade-in pt-6">
                <h3 className="font-semibold mb-2 flex items-center gap-2 text-primary">
                  <Wand2 className="h-5 w-5" />
                  Assistant Response
                </h3>
                <div className="prose prose-sm max-w-none text-sm text-foreground/80">
                  <p>{response}</p>
                </div>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
