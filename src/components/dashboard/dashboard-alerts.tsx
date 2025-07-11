'use client';

import { useState, useEffect } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  AlertTriangle, 
  Clock, 
  DollarSign, 
  X, 
  ExternalLink,
  Calendar,
  Bell,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { InvoiceAlert } from '@/lib/invoice-status-manager';

interface DashboardAlertsProps {
  alerts: InvoiceAlert[];
  onDismissAlert?: (alertId: string) => void;
  onViewInvoice?: (invoiceId: string) => void;
}

export function DashboardAlerts({ 
  alerts = [], 
  onDismissAlert, 
  onViewInvoice 
}: DashboardAlertsProps) {
  const [visibleAlerts, setVisibleAlerts] = useState(alerts);
  const [isExpanded, setIsExpanded] = useState(true);

  useEffect(() => {
    setVisibleAlerts(alerts);
  }, [alerts]);

  const handleDismiss = (alertId: string) => {
    setVisibleAlerts(prev => prev.filter(alert => alert.id !== alertId));
    onDismissAlert?.(alertId);
  };

  const getAlertIcon = (type: InvoiceAlert['type']) => {
    switch (type) {
      case 'overdue':
        return <AlertTriangle className="h-4 w-4" />;
      case 'due_today':
        return <Clock className="h-4 w-4" />;
      case 'upcoming':
        return <Calendar className="h-4 w-4" />;
      default:
        return <Bell className="h-4 w-4" />;
    }
  };

  const getAlertVariant = (severity: InvoiceAlert['severity']) => {
    switch (severity) {
      case 'high':
        return 'destructive';
      case 'medium':
        return 'default';
      case 'low':
        return 'secondary';
      default:
        return 'default';
    }
  };

  const getAlertBadgeColor = (type: InvoiceAlert['type']) => {
    switch (type) {
      case 'overdue':
        return 'bg-red-100 text-red-800 hover:bg-red-200';
      case 'due_today':
        return 'bg-orange-100 text-orange-800 hover:bg-orange-200';
      case 'upcoming':
        return 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 hover:bg-gray-200';
    }
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

  if (visibleAlerts.length === 0) {
    return (
      <Card className="relative overflow-hidden">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Alerts
              <Badge variant="secondary">0</Badge>
            </CardTitle>
            
            {/* Overlay Expand/Collapse Button with inset edges */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="relative h-8 w-8 p-0 rounded-md border border-border/50 bg-background/80 backdrop-blur-sm 
                         shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1),inset_0_-1px_0_0_rgba(0,0,0,0.1)] 
                         hover:bg-background/90 hover:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.2),inset_0_-1px_0_0_rgba(0,0,0,0.2)]
                         transition-all duration-200 ease-in-out"
            >
              {isExpanded ? (
                <ChevronUp className="h-4 w-4 transition-transform duration-200" />
              ) : (
                <ChevronDown className="h-4 w-4 transition-transform duration-200" />
              )}
              <span className="sr-only">
                {isExpanded ? 'Collapse alerts' : 'Expand alerts'}
              </span>
            </Button>
          </div>
        </CardHeader>
        
        {/* Animated Content Container */}
        <div 
          className={`transition-all duration-300 ease-in-out overflow-hidden ${
            isExpanded ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
          }`}
        >
          <CardContent>
            <div className="text-center py-6 text-muted-foreground animate-fade-in">
              <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>All caught up! No payment alerts at this time.</p>
            </div>
          </CardContent>
        </div>
      </Card>
    );
  }

  // Group alerts by severity
  const groupedAlerts = visibleAlerts.reduce((acc, alert) => {
    if (!acc[alert.severity]) acc[alert.severity] = [];
    acc[alert.severity].push(alert);
    return acc;
  }, {} as Record<string, InvoiceAlert[]>);

  return (
    <Card className="relative overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Payment Alerts
            <Badge variant="secondary">
              {visibleAlerts.length}
            </Badge>
          </CardTitle>
          
          {/* Overlay Expand/Collapse Button with inset edges */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="relative h-8 w-8 p-0 rounded-md border border-border/50 bg-background/80 backdrop-blur-sm 
                       shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1),inset_0_-1px_0_0_rgba(0,0,0,0.1)] 
                       hover:bg-background/90 hover:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.2),inset_0_-1px_0_0_rgba(0,0,0,0.2)]
                       transition-all duration-200 ease-in-out"
          >
            {isExpanded ? (
              <ChevronUp className="h-4 w-4 transition-transform duration-200" />
            ) : (
              <ChevronDown className="h-4 w-4 transition-transform duration-200" />
            )}
            <span className="sr-only">
              {isExpanded ? 'Collapse alerts' : 'Expand alerts'}
            </span>
          </Button>
        </div>
      </CardHeader>
      
      {/* Animated Content Container */}
      <div 
        className={`transition-all duration-300 ease-in-out overflow-hidden ${
          isExpanded ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <CardContent className="space-y-4 pt-0">
          {/* High severity alerts first */}
          {groupedAlerts.high && (
            <div className="space-y-3 animate-fade-in">
              {groupedAlerts.high.map((alert) => (
                <Alert
                  key={alert.id}
                  variant="destructive"
                  className="relative pr-10 transition-all duration-200 hover:shadow-md"
                >
                  <div className="flex items-start gap-3">
                    {getAlertIcon(alert.type)}
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center justify-between">
                        <AlertTitle className="text-sm font-medium">
                          {alert.type === 'overdue' && 'Payment Overdue'}
                          {alert.type === 'due_today' && 'Payment Due Today'}
                          {alert.type === 'upcoming' && 'Upcoming Payment'}
                        </AlertTitle>
                        <Badge className={getAlertBadgeColor(alert.type)}>
                          {alert.type.replace('_', ' ').toUpperCase()}
                        </Badge>
                      </div>
                      <AlertDescription className="text-sm">
                        <div className="space-y-1">
                          <p>{alert.message}</p>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <DollarSign className="h-3 w-3" />
                              {formatCurrency(alert.amount)}
                            </span>
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              Due: {formatDate(alert.dueDate)}
                            </span>
                          </div>
                        </div>
                      </AlertDescription>
                      <div className="flex items-center gap-2 pt-1">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => onViewInvoice?.(alert.invoiceId)}
                          className="h-7 text-xs transition-all duration-200 hover:scale-105"
                        >
                          <ExternalLink className="h-3 w-3 mr-1" />
                          View Invoice
                        </Button>
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDismiss(alert.id)}
                    className="absolute top-2 right-2 h-6 w-6 p-0 transition-all duration-200 hover:scale-110"
                  >
                    <X className="h-3 w-3" />
                    <span className="sr-only">Dismiss</span>
                  </Button>
                </Alert>
              ))}
            </div>
          )}

          {/* Medium severity alerts */}
          {groupedAlerts.medium && (
            <div className="space-y-3 animate-fade-in">
              {groupedAlerts.medium.map((alert) => (
                <Alert
                  key={alert.id}
                  className="relative pr-10 border-orange-200 bg-orange-50 transition-all duration-200 hover:shadow-md"
                >
                  <div className="flex items-start gap-3">
                    {getAlertIcon(alert.type)}
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center justify-between">
                        <AlertTitle className="text-sm font-medium text-orange-800">
                          Upcoming Payment
                        </AlertTitle>
                        <Badge className={getAlertBadgeColor(alert.type)}>
                          {alert.daysToDue} DAY{alert.daysToDue !== 1 ? 'S' : ''}
                        </Badge>
                      </div>
                      <AlertDescription className="text-sm text-orange-700">
                        <div className="space-y-1">
                          <p>{alert.message}</p>
                          <div className="flex items-center gap-4 text-xs text-orange-600">
                            <span className="flex items-center gap-1">
                              <DollarSign className="h-3 w-3" />
                              {formatCurrency(alert.amount)}
                            </span>
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              Due: {formatDate(alert.dueDate)}
                            </span>
                          </div>
                        </div>
                      </AlertDescription>
                      <div className="flex items-center gap-2 pt-1">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => onViewInvoice?.(alert.invoiceId)}
                          className="h-7 text-xs transition-all duration-200 hover:scale-105"
                        >
                          <ExternalLink className="h-3 w-3 mr-1" />
                          View Invoice
                        </Button>
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDismiss(alert.id)}
                    className="absolute top-2 right-2 h-6 w-6 p-0 transition-all duration-200 hover:scale-110"
                  >
                    <X className="h-3 w-3" />
                    <span className="sr-only">Dismiss</span>
                  </Button>
                </Alert>
              ))}
            </div>
          )}

          {/* Low severity alerts */}
          {groupedAlerts.low && (
            <div className="space-y-3 animate-fade-in">
              {groupedAlerts.low.map((alert) => (
                <Alert
                  key={alert.id}
                  className="relative pr-10 border-yellow-200 bg-yellow-50 transition-all duration-200 hover:shadow-md"
                >
                  <div className="flex items-start gap-3">
                    {getAlertIcon(alert.type)}
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center justify-between">
                        <AlertTitle className="text-sm font-medium text-yellow-800">
                          Payment Reminder
                        </AlertTitle>
                        <Badge className={getAlertBadgeColor(alert.type)}>
                          {alert.daysToDue} DAYS
                        </Badge>
                      </div>
                      <AlertDescription className="text-sm text-yellow-700">
                        <div className="space-y-1">
                          <p>{alert.message}</p>
                          <div className="flex items-center gap-4 text-xs text-yellow-600">
                            <span className="flex items-center gap-1">
                              <DollarSign className="h-3 w-3" />
                              {formatCurrency(alert.amount)}
                            </span>
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              Due: {formatDate(alert.dueDate)}
                            </span>
                          </div>
                        </div>
                      </AlertDescription>
                      <div className="flex items-center gap-2 pt-1">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => onViewInvoice?.(alert.invoiceId)}
                          className="h-7 text-xs transition-all duration-200 hover:scale-105"
                        >
                          <ExternalLink className="h-3 w-3 mr-1" />
                          View Invoice
                        </Button>
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDismiss(alert.id)}
                    className="absolute top-2 right-2 h-6 w-6 p-0 transition-all duration-200 hover:scale-110"
                  >
                    <X className="h-3 w-3" />
                    <span className="sr-only">Dismiss</span>
                  </Button>
                </Alert>
              ))}
            </div>
          )}
        </CardContent>
      </div>
    </Card>
  );
}
