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
  ChevronUp,
  FileClock,
  UserPlus,
} from 'lucide-react';
import { format } from 'date-fns';

interface VendorApplicationAlert {
  id: string;
  vendorName: string;
  submittedAt: Date;
  status: 'pending' | 'approved' | 'rejected';
  service: string;
}

// Define a more flexible contract type for the alerts
interface ContractAlert {
  id?: string;
  _id?: string | { toString: () => string };
  contractName?: string;
  name?: string;
  endDate: string | Date | any;
  partyA?: {
    name?: string;
    [key: string]: any;
  };
  [key: string]: any; // Allow any other properties
}

// Define a more flexible invoice alert type
interface InvoiceAlertDetails {
  id: string;
  severity: 'high' | 'medium' | 'low';
  amount?: number;
  dueDate?: Date;
  message: string;
  title?: string;
  details?: string;
}

interface DashboardAlertsProps {
  invoiceAlerts?: InvoiceAlertDetails[];
  contractAlerts?: ContractAlert[];
  vendorApplicationAlerts?: VendorApplicationAlert[];
  onDismissInvoiceAlert?: (alertId: string) => void;
  onViewInvoice?: (invoiceId: string) => void;
  onViewContracts?: () => void;
  onViewVendorApplications?: () => void;
  className?: string;
}

export function DashboardAlerts({ 
  invoiceAlerts = [], 
  contractAlerts = [],
  vendorApplicationAlerts = [],
  onDismissInvoiceAlert, 
  onViewInvoice,
  onViewContracts,
  onViewVendorApplications,
  className = ''
}: DashboardAlertsProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [dismissedAlerts, setDismissedAlerts] = useState<Set<string>>(new Set());

  const handleDismiss = (alertId: string) => {
    setDismissedAlerts(prev => {
      const newSet = new Set(prev);
      newSet.add(alertId);
      return newSet;
    });
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

  // Filter out dismissed alerts
  const activeInvoiceAlerts = invoiceAlerts.filter(alert => !dismissedAlerts.has(`invoice-${alert.id}`));
  const activeContractAlerts = contractAlerts.filter(contract => {
    const contractId = contract.id || (contract._id ? (typeof contract._id === 'string' ? contract._id : contract._id.toString()) : '');
    return !dismissedAlerts.has(`contract-${contractId}`);
  });
  const activeVendorAlerts = vendorApplicationAlerts.filter(app => !dismissedAlerts.has(`vendor-app-${app.id}`));

  const totalAlerts = activeInvoiceAlerts.length + activeContractAlerts.length + activeVendorAlerts.length;
  
  if (totalAlerts === 0) {
    return null;
  }

  return (
    <div className={className}>
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
              className="h-8 w-8 p-0"
            >
              {isExpanded ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
              <span className="sr-only">
                {isExpanded ? 'Collapse' : 'Expand'} alerts
              </span>
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 pt-0">
          {isExpanded && (
            <div className="space-y-4">
              {/* Vendor Application Alerts */}
              {activeVendorAlerts.map(app => (
                <Alert 
                  key={`vendor-app-${app.id}`}
                  className="border-blue-200 bg-blue-50 dark:border-blue-800/50 dark:bg-blue-900/20"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3">
                      <UserPlus className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                      <div className="flex-1">
                        <AlertTitle className="text-blue-800 dark:text-blue-200">
                          New Vendor Application: {app.vendorName}
                        </AlertTitle>
                        <AlertDescription className="text-blue-700 dark:text-blue-300">
                          Service: {app.service}<br />
                          Submitted: {formatDate(app.submittedAt)}
                        </AlertDescription>
                        <div className="mt-2 space-x-2">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="text-xs h-7"
                            onClick={onViewVendorApplications}
                          >
                            View Application
                          </Button>
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 -mt-1 -mr-2"
                      onClick={() => handleDismiss(`vendor-app-${app.id}`)}
                    >
                      <X className="h-3.5 w-3.5" />
                      <span className="sr-only">Dismiss</span>
                    </Button>
                  </div>
                </Alert>
              ))}
              {/* Invoice Alerts */}
              {activeInvoiceAlerts.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-sm font-medium text-muted-foreground">Payment Alerts</h3>
                  {activeInvoiceAlerts.map(alert => (
                    <Alert
                      key={`invoice-${alert.id}`}
                      variant={alert.severity === 'high' ? 'destructive' : 'default'}
                      className="relative"
                    >
                      <div className="flex items-start">
                        <div className="flex-shrink-0 pt-0.5">
                          {alert.severity === 'high' ? (
                            <AlertTriangle className="h-5 w-5 text-destructive-foreground" />
                          ) : (
                            <Clock className="h-5 w-5 text-foreground" />
                          )}
                        </div>
                        <div className="ml-3 flex-1">
                          <AlertTitle className="text-sm font-medium">
                            {alert.message || alert.title || 'Invoice Alert'}
                          </AlertTitle>
                          <AlertDescription className="text-sm mt-1">
                            {alert.details || alert.message || 'Review this invoice for more details'}
                            {alert.amount && (
                              <span className="block font-medium mt-1">
                                {formatCurrency(alert.amount)}
                              </span>
                            )}
                            {alert.dueDate && (
                              <div className="flex items-center mt-1 text-sm">
                                <Calendar className="h-3.5 w-3.5 mr-1.5 opacity-70" />
                                Due {formatDate(alert.dueDate)}
                              </div>
                            )}
                          </AlertDescription>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 -mt-1 -mr-2"
                          onClick={() => handleDismiss(`invoice-${alert.id}`)}
                        >
                          <X className="h-3.5 w-3.5" />
                          <span className="sr-only">Dismiss</span>
                        </Button>
                      </div>
                    </Alert>
                  ))}
                </div>
              )}
              {/* Contract Alerts */}
              {activeContractAlerts.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-sm font-medium text-muted-foreground">Contract Alerts</h3>
                  {activeContractAlerts.map(contract => (
                    <Alert 
                      key={`contract-${contract.id || (contract._id ? (typeof contract._id === 'string' ? contract._id : contract._id.toString()) : '')}`} 
                      className="border-amber-200 bg-amber-50 dark:border-amber-800/50 dark:bg-amber-900/20"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-3">
                          <FileClock className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
                          <div className="flex-1">
                            <AlertTitle className="text-amber-800 dark:text-amber-200">
                              Contract Expiring: {contract.title || contract.name || 'Unnamed Contract'}
                            </AlertTitle>
                            <AlertDescription className="text-amber-700 dark:text-amber-300">
                              Expires on {formatDate(new Date(contract.endDate))}
                              {contract.partyA?.name && (
                                <div className="mt-1">
                                  With: {contract.partyA.id == "company"? contract.partyB.name:contract.partyA.name}
                                </div>
                              )}
                            </AlertDescription>
                            <div className="mt-2">
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="text-xs h-7"
                                onClick={onViewContracts}
                              >
                                View Contract
                              </Button>
                            </div>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 -mt-1 -mr-2"
                          onClick={() => handleDismiss(`contract-${contract.id || (contract._id ? (typeof contract._id === 'string' ? contract._id : contract._id.toString()) : '')}`)}
                        >
                          <X className="h-3.5 w-3.5" />
                          <span className="sr-only">Dismiss</span>
                        </Button>
                      </div>
                    </Alert>
                  ))}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
