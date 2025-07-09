"use client";

import { useState } from "react";
import { summarizeSpendingTrends } from "@/ai/flows/summarize-spending-trends";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Lightbulb, Loader2 } from "lucide-react";
import type { Invoice, Vendor } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";

export function SpendingInsights({ invoices, vendors }: { invoices: Invoice[], vendors: Vendor[] }) {
  const [query, setQuery] = useState("");
  const [summary, setSummary] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query) return;

    setIsLoading(true);
    setSummary("");

    try {
      const result = await summarizeSpendingTrends({
        query: query,
        invoiceData: JSON.stringify(invoices),
        vendorPaymentHistory: JSON.stringify(vendors)
      });
      setSummary(result.summary);
    } catch (error) {
      console.error("Error summarizing spending trends:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to generate spending insights. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative rounded-lg bg-gradient-to-r from-indigo-600 to-cyan-500 p-px shadow-[0_7px_20px_4px_#4f46e520]">
      <Card className="rounded-[calc(var(--radius)-1px)] border-0 h-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 bg-gradient-to-r from-indigo-500 to-cyan-500 bg-clip-text text-transparent">
            <Lightbulb className="h-6 w-6 text-indigo-500" />
            AI Spending Insights
          </CardTitle>
          <CardDescription>
            Ask questions about your spending trends and get AI-powered answers.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent>
            <Textarea
              placeholder="e.g., 'Summarize my spending for July 2024'"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              disabled={isLoading}
            />
          </CardContent>
          <CardFooter>
            <Button type="submit" disabled={isLoading || !query} className="w-full bg-gradient-to-r from-indigo-600 to-cyan-600 text-white hover:opacity-90 transition-opacity">
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Generate Insights
            </Button>
          </CardFooter>
        </form>
        <div className="p-6 pt-0">
          {isLoading && (
              <div className="space-y-3">
              <Skeleton className="h-5 w-32" />
              <div className="space-y-2 rounded-md border p-4">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-[85%]" />
              </div>
              </div>
          )}
          {summary && !isLoading && (
              <div className="animate-fade-in">
                  <h3 className="font-semibold mb-2 bg-clip-text text-transparent bg-gradient-to-r from-primary to-foreground/70">Analysis Result:</h3>
                  <div className="prose prose-sm max-w-none rounded-md border bg-muted/50 p-4 text-sm">
                      <p>{summary}</p>
                  </div>
              </div>
          )}
        </div>
      </Card>
    </div>
  );
}
