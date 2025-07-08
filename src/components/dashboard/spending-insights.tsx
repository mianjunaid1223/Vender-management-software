"use client";

import { useState } from "react";
import { summarizeSpendingTrends } from "@/ai/flows/summarize-spending-trends";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Lightbulb, Loader2 } from "lucide-react";
import type { Invoice, Vendor } from "@/lib/types";

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
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Lightbulb className="h-6 w-6 text-primary" />
          AI Spending Insights
        </CardTitle>
        <CardDescription>
          Ask questions about your spending trends and get AI-powered answers. 
          Try: 'Show unpaid invoices from last month' or 'Which vendor do I spend the most with?'.
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
        <CardFooter className="border-t px-6 py-4">
          <Button type="submit" disabled={isLoading || !query}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Generate Insights
          </Button>
        </CardFooter>
      </form>
      {summary && (
        <div className="p-6 pt-0">
            <h3 className="font-semibold mb-2">Analysis Result:</h3>
            <div className="prose prose-sm max-w-none rounded-md border bg-muted/50 p-4 text-sm">
                <p>{summary}</p>
            </div>
        </div>
      )}
    </Card>
  );
}
