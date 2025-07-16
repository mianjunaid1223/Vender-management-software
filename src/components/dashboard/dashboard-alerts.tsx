'use client';

import { useState, useEffect } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { 
  AlertTriangle, 
  Clock, 
  DollarSign, 
  X, 
  ExternalLink,
  Calendar,
  Bell,
  ChevronDown,
  ChevronUp,
  FileClock,
} from 'lucide-react';
import { InvoiceAlert } from '@/lib/invoice-status-manager';
import type { Contract } from '@/lib/types';
import { format } from 'date-fns';

interface DashboardAlertsProps {
  invoiceAlerts?: InvoiceAlert[];
  contractAlerts?: Contract[];
  onDismissInvoiceAlert?: (alertId: string) => void;
  onViewInvoice?: (invoiceId: string) => void;
  onViewContracts?: () => void;
}

export function DashboardAlerts({ 
  invoiceAlerts = [], 
  contractAlerts = [],
  onDismissInvoiceAlert, 
  onViewInvoice,
  onViewContracts
}: DashboardAlertsProps) {
  const [visibleInvoiceAlerts, setVisibleInvoiceAlerts] = useState(invoiceAlerts);
  const [isExpanded, setIsExpanded] = useState(true);

  useEffect(() => {
    setVisibleInvoiceAlerts(invoiceAlerts);
  }, [invoiceAlerts]);

  const handleDismiss = (alertId: string) => {
    setVisibleInvoiceAlerts(prev => prev.filter(alert => alert.id !== alertId));
    onDismissInvoiceAlert?.(alertId);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const totalAlerts = visibleInvoiceAlerts.length + (contractAlerts.length > 0 ? 1 : 0);
  
  if (totalAlerts === 0) {
    return null;
  }

  return (
    <Card className="relative overflow-hidden w-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Bell className="h-5 w-5" />
            System Alerts
            <Badge variant="secondary">
              {totalAlerts}
            </Badge>
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="h-8 w-8 p-0 rounded-md"
          >
            {isExpanded ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
            <span className="sr-only">
              {isExpanded ? 'Collapse alerts' : 'Expand alerts'}
            </span>
          </Button>
        </div>
      </CardHeader>
      
      <div 
        className={`transition-all duration-300 ease-in-out overflow-hidden ${
          isExpanded ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <CardContent className="space-y-4 pt-0">
          <div className="grid md:grid-cols-2 gap-4">
            
            {/* Invoice Alerts */}
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-muted-foreground">Payment Alerts</h3>
              {visibleInvoiceAlerts.length > 0 ? visibleInvoiceAlerts.map(alert => (
                <Alert
                  key={alert.id}
                  variant={alert.severity === 'high' ? 'destructive' : 'default'}
                  className="relative pr-10"
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-1">{alert.severity === 'high' ? <AlertTriangle className="h-4 w-4" /> : <Clock className="h-4 w-4" />}</div>
                    <div className="flex-1 space-y-1">
                      <AlertDescription className="text-sm">
                        <p>{alert.message}</p>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1">
                          <span className="flex items-center gap-1">
                            <DollarSign className="h-3 w-3" />
                            {formatCurrency(alert.amount)}
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            Due: {formatDate(alert.dueDate)}
                          </span>
                        </div>
                      </AlertDescription>
                      <div className="pt-1">
                        <Button
                          size="sm"
                          variant="link"
                          onClick={() => onViewInvoice?.(alert.invoiceId)}
                          className="h-auto p-0 text-xs"
                        >
                          View Invoice <ExternalLink className="h-3 w-3 ml-1" />
                        </Button>
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDismiss(alert.id)}
                    className="absolute top-2 right-2 h-6 w-6 p-0"
                  >
                    <X className="h-3 w-3" />
                    <span className="sr-only">Dismiss</span>
                  </Button>
                </Alert>
              )) : (
                <div className="text-sm text-muted-foreground p-4 text-center border rounded-lg">No payment alerts.</div>
              )}
            </div>

            {/* Contract Alerts */}
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-muted-foreground">Contract Alerts</h3>
              {contractAlerts.length > 0 ? (
                <Alert className="border-yellow-200 bg-yellow-50 dark:border-yellow-800/50 dark:bg-yellow-900/20">
                  <div className="flex items-start gap-3">
                    <div className="mt-1"><FileClock className="h-4 w-4 text-yellow-600" /></div>
                    <div className="flex-1 space-y-2">
                       <AlertTitle className="text-yellow-800 dark:text-yellow-300">Expiring Contracts</AlertTitle>
                       <AlertDescription>
                        {contractAlerts.length} contract(s) expiring within 30 days.
                       </AlertDescription>
                       <Button
                          size="sm"
                          variant="link"
                          onClick={onViewContracts}
                          className="h-auto p-0 text-xs text-yellow-700 dark:text-yellow-400"
                        >
                          Review Contracts <ExternalLink className="h-3 w-3 ml-1" />
                        </Button>
                    </div>
                  </div>
                </Alert>
              ) : (
                <div className="text-sm text-muted-foreground p-4 text-center border rounded-lg">No contract alerts.</div>
              )}
            </div>

          </div>
        </CardContent>
      </div>
    </Card>
  );
}
