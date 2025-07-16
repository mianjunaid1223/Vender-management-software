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
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { 
  Loader2, 
  Search, 
  Wand2, 
  CornerDownLeft, 
  Brain, 
  AlertCircle,
  CheckCircle,
  Clock,
  TrendingUp
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { getEnhancedAIAssistantResponse, EnhancedAIAssistantOutput } from "@/ai/flows/enhanced-ai-assistant";
import { useRouter } from "next/navigation";

interface EnhancedAISpotlightProps {
  userId: string;
  currentModule: string;
  triggerClassName?: string;
  placeholder?: string;
}

export function EnhancedAISpotlight({
  userId,
  currentModule,
  triggerClassName,
  placeholder = "Ask AI anything about your business..."
}: EnhancedAISpotlightProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [response, setResponse] = useState<EnhancedAIAssistantOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [queryHistory, setQueryHistory] = useState<string[]>([]);
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
      setResponse(null);
    }
  };

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim() || isLoading) return;

    setIsLoading(true);
    const currentQuery = query.trim();
    
    try {
      const result = await getEnhancedAIAssistantResponse({
        query: currentQuery,
        userId,
        currentModule,
      });

      setResponse(result);
      setQueryHistory(prev => {
        const newHistory = [currentQuery, ...prev.filter(q => q !== currentQuery)];
        return newHistory.slice(0, 10); // Keep last 10 queries
      });

      toast({
        title: "AI Response Generated",
        description: `Response confidence: ${(result.confidence * 100).toFixed(0)}%`,
      });
    } catch (error) {
      console.error('AI Error:', error);
      toast({
        title: "AI Error",
        description: "Failed to get AI response. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [query, userId, currentModule, isLoading, toast]);

  const handleSuggestedAction = (action: string) => {
    // Handle suggested actions based on action type
    if (action.includes('navigate to')) {
      const route = action.match(/navigate to (.+)/)?.[1];
      if (route) {
        router.push(`/dashboard/${route}`);
        setOpen(false);
      }
    } else if (action.includes('create')) {
      // Handle create actions
      setQuery(action);
    } else {
      // Use the action as a new query
      setQuery(action);
    }
  };

  const handleHistoryQuery = (historicalQuery: string) => {
    setQuery(historicalQuery);
  };

  const getPriorityColor = (priority: 'high' | 'medium' | 'low') => {
    switch (priority) {
      case 'high': return 'bg-red-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-green-500';
    }
  };

  const getPriorityIcon = (priority: 'high' | 'medium' | 'low') => {
    switch (priority) {
      case 'high': return AlertCircle;
      case 'medium': return Clock;
      case 'low': return CheckCircle;
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-600';
    if (confidence >= 0.6) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          size="sm"
          className={cn(
            "relative h-8 w-full justify-start rounded-[0.5rem] bg-background text-sm font-normal text-muted-foreground shadow-none sm:pr-12 md:w-40 lg:w-64",
            triggerClassName
          )}
        >
          <Brain className="mr-2 h-4 w-4" />
          <span className="hidden lg:inline-flex">{placeholder}</span>
          <span className="inline-flex lg:hidden">AI Search...</span>
          <kbd className="pointer-events-none absolute right-[0.3rem] top-[0.3rem] hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
            <span className="text-xs">⌘</span>K
          </kbd>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[85vh] p-0">
        <DialogTitle className="sr-only">AI Spotlight</DialogTitle>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="px-6 py-4 border-b">
            <div className="flex items-center gap-2 mb-3">
              <Brain className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-semibold">AI Spotlight</h2>
              <Badge variant="secondary" className="text-xs">
                {currentModule}
              </Badge>
            </div>
            <form onSubmit={handleSubmit} className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={placeholder}
                  className="pl-10 pr-10"
                  disabled={isLoading}
                />
                {query && (
                  <button
                    type="button"
                    onClick={() => setQuery("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    ×
                  </button>
                )}
              </div>
              <Button type="submit" disabled={isLoading || !query.trim()}>
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <CornerDownLeft className="h-4 w-4" />
                )}
              </Button>
            </form>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-hidden">
            <ScrollArea className="h-full">
              <div className="p-6 space-y-6">
                {/* Query History */}
                {queryHistory.length > 0 && !response && (
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm">Recent Queries</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-2">
                        {queryHistory.map((historicalQuery, index) => (
                          <Button
                            key={index}
                            variant="ghost"
                            size="sm"
                            onClick={() => handleHistoryQuery(historicalQuery)}
                            className="h-auto p-2 text-xs"
                          >
                            {historicalQuery}
                          </Button>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* AI Response */}
                {response && (
                  <div className="space-y-4">
                    {/* Main Response */}
                    <Card>
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-sm">AI Response</CardTitle>
                          <div className="flex items-center gap-2">
                            <TrendingUp className="h-4 w-4" />
                            <span className={cn("text-sm font-medium", getConfidenceColor(response.confidence))}>
                              {(response.confidence * 100).toFixed(0)}% confident
                            </span>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="prose prose-sm max-w-none">
                          <p className="text-sm leading-relaxed">{response.response}</p>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Suggested Actions */}
                    {response.suggestedActions.length > 0 && (
                      <Card>
                        <CardHeader className="pb-3">
                          <CardTitle className="text-sm">Suggested Actions</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2">
                            {response.suggestedActions.map((action, index) => {
                              const Icon = getPriorityIcon(action.priority);
                              return (
                                <div
                                  key={index}
                                  className="flex items-start gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer"
                                  onClick={() => handleSuggestedAction(action.action)}
                                >
                                  <div className="flex items-center gap-2">
                                    <div className={cn("w-2 h-2 rounded-full", getPriorityColor(action.priority))} />
                                    <Icon className="h-4 w-4 text-muted-foreground" />
                                  </div>
                                  <div className="flex-1">
                                    <p className="font-medium text-sm">{action.action}</p>
                                    <p className="text-xs text-muted-foreground mt-1">{action.description}</p>
                                  </div>
                                  <Badge variant="outline" className="text-xs">
                                    {action.priority}
                                  </Badge>
                                </div>
                              );
                            })}
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {/* Relevant Data */}
                    {response.relevantData.length > 0 && (
                      <Card>
                        <CardHeader className="pb-3">
                          <CardTitle className="text-sm">Relevant Data</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2">
                            {response.relevantData.map((data, index) => (
                              <div
                                key={index}
                                className="flex items-center justify-between p-2 rounded-lg bg-muted/30"
                              >
                                <div className="flex items-center gap-2">
                                  <Badge variant="outline" className="text-xs">
                                    {data.type}
                                  </Badge>
                                  <span className="text-sm font-medium">{data.id}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
                                    <div
                                      className="h-full bg-primary transition-all duration-500"
                                      style={{ width: `${data.relevanceScore * 100}%` }}
                                    />
                                  </div>
                                  <span className="text-xs text-muted-foreground">
                                    {(data.relevanceScore * 100).toFixed(0)}%
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                )}

                {/* Empty State */}
                {!response && !isLoading && (
                  <div className="text-center py-12">
                    <Wand2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">Ask AI anything about your business</h3>
                    <p className="text-muted-foreground text-sm mb-4">
                      Get intelligent insights about your vendors, contracts, invoices, and more
                    </p>
                    <div className="flex flex-wrap justify-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setQuery("Show me my overdue invoices")}
                      >
                        Overdue invoices
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setQuery("Which contracts are expiring soon?")}
                      >
                        Expiring contracts
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setQuery("Analyze my vendor performance")}
                      >
                        Vendor performance
                      </Button>
                    </div>
                  </div>
                )}

                {/* Loading State */}
                {isLoading && (
                  <div className="text-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
                    <p className="text-muted-foreground">AI is analyzing your business context...</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
