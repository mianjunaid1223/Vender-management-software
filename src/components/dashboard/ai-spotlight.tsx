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
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <div className="relative group">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-apple-ai-pink to-apple-ai-blue rounded-lg blur-lg opacity-40 group-hover:opacity-60 transition duration-300"></div>
          <button className="relative w-full max-w-sm flex items-center justify-start text-sm h-10 px-4 py-2 text-muted-foreground bg-zinc-900/80 rounded-md border border-transparent">
            <Search className="h-4 w-4 mr-2" />
            <span>Ask AI...</span>
            <kbd className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
              <span className="text-xs">⌘</span>K
            </kbd>
          </button>
        </div>
      </DialogTrigger>
      <DialogContent hideCloseButton className="sm:max-w-2xl p-0 gap-0 overflow-hidden border-none bg-transparent shadow-2xl">
        <div className="fixed inset-0 -z-20 bg-gradient-to-br from-apple-ai-purple/10 via-transparent to-apple-ai-blue/10" />
        <div className={cn(
          "absolute inset-0 -z-10 rounded-xl bg-gradient-to-r from-apple-ai-purple via-apple-ai-pink to-apple-ai-blue bg-[200%_auto] blur-3xl opacity-50",
          isLoading && "animate-gradient-shift"
        )} />
        <div className="relative rounded-lg overflow-hidden bg-background/80 backdrop-blur-2xl">
            <form onSubmit={handleSubmit}>
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  placeholder="Ask about your vendors, invoices, or spending..."
                  className="h-14 pl-12 text-base border-0 focus-visible:ring-0 shadow-none bg-transparent"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
                <Button
                  type="submit"
                  size="icon"
                  className="absolute right-4 top-1/2 -translate-y-1/2 bg-transparent hover:bg-white/10"
                  disabled={isLoading || !query}
                >
                  {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CornerDownLeft className="h-4 w-4" />}
                  <span className="sr-only">Submit</span>
                </Button>
              </div>
            </form>
            {(isLoading || response) && (
              <div className="p-6 pt-0 border-t border-white/10 animate-fade-in">
                {isLoading && (
                  <div className="space-y-3 pt-6">
                    <Skeleton className="h-5 w-32 bg-white/20" />
                    <div className="space-y-2 rounded-md">
                      <Skeleton className="h-4 w-full bg-white/20" />
                      <Skeleton className="h-4 w-full bg-white/20" />
                      <Skeleton className="h-4 w-[85%] bg-white/20" />
                    </div>
                  </div>
                )}
                {response && !isLoading && (
                  <div className="pt-6">
                    <h3 className="font-semibold mb-2 flex items-center gap-2 text-transparent bg-clip-text bg-gradient-to-r from-apple-ai-pink to-apple-ai-blue">
                      <Wand2 className="h-5 w-5 text-apple-ai-purple" />
                      Assistant Response
                    </h3>
                    <div className="prose prose-sm max-w-none text-sm text-foreground/80">
                      <p>{response}</p>
                    </div>
                  </div>
                )}
              </div>
            )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
