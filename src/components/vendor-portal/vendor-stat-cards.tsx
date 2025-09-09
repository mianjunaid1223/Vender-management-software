'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  DollarSign, 
  FileText, 
  Clock, 
  CheckCircle,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  Receipt,
  Calendar,
  Target,
  Activity
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatCardData {
  title: string;
  value: string | number;
  subtitle?: string;
  change?: {
    value: number;
    type: 'increase' | 'decrease' | 'neutral';
    period: string;
  };
  progress?: {
    value: number;
    max: number;
    label?: string;
  };
  status?: 'success' | 'warning' | 'error' | 'info';
  icon: React.ComponentType<{ className?: string }>;
  trend?: Array<{ period: string; value: number }>;
}

interface VendorStatCardsProps {
  stats: {
    totalRevenue: number;
    pendingPayments: number;
    totalInvoices: number;
    paidInvoices: number;
    pendingInvoices: number;
    overdueInvoices: number;
    activeContracts: number;
    totalContracts: number;
    averagePaymentTime?: number;
    paymentSuccessRate?: number;
  };
  currency?: string;
  className?: string;
}

export function VendorStatCards({ stats, currency = 'USD', className }: VendorStatCardsProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const calculatePaymentRate = () => {
    if (stats.totalInvoices === 0) return 0;
    return Math.round((stats.paidInvoices / stats.totalInvoices) * 100);
  };

  const calculateContractUtilization = () => {
    if (stats.totalContracts === 0) return 0;
    return Math.round((stats.activeContracts / stats.totalContracts) * 100);
  };

  const getRevenueChange = () => {
    // Mock calculation - in real app, this would compare with previous period
    const mockChange = Math.random() * 20 - 10; // -10% to +10%
    return {
      value: Math.abs(mockChange),
      type: mockChange >= 0 ? 'increase' as const : 'decrease' as const,
      period: 'vs last month'
    };
  };

  const statCards: StatCardData[] = [
    {
      title: 'Total Revenue',
      value: formatCurrency(stats.totalRevenue),
      subtitle: `From ${stats.totalInvoices} invoices`,
      change: getRevenueChange(),
      icon: DollarSign,
      status: 'success'
    },
    {
      title: 'Pending Payments',
      value: formatCurrency(stats.pendingPayments),
      subtitle: `${stats.pendingInvoices} pending invoices`,
      icon: Clock,
      status: stats.pendingInvoices > 0 ? 'warning' : 'success'
    },
    {
      title: 'Payment Success Rate',
      value: `${calculatePaymentRate()}%`,
      subtitle: `${stats.paidInvoices} of ${stats.totalInvoices} paid`,
      progress: {
        value: stats.paidInvoices,
        max: stats.totalInvoices,
        label: 'Payment completion'
      },
      icon: CheckCircle,
      status: calculatePaymentRate() >= 80 ? 'success' : calculatePaymentRate() >= 60 ? 'warning' : 'error'
    },
    {
      title: 'Active Contracts',
      value: stats.activeContracts,
      subtitle: `${calculateContractUtilization()}% utilization`,
      progress: {
        value: stats.activeContracts,
        max: stats.totalContracts,
        label: 'Contract utilization'
      },
      icon: FileText,
      status: 'info'
    },
    {
      title: 'Overdue Invoices',
      value: stats.overdueInvoices,
      subtitle: stats.overdueInvoices > 0 ? 'Requires attention' : 'All up to date',
      icon: AlertCircle,
      status: stats.overdueInvoices > 0 ? 'error' : 'success'
    },
    {
      title: 'Average Payment Time',
      value: `${stats.averagePaymentTime || 28} days`,
      subtitle: 'Average time to payment',
      icon: Calendar,
      status: (stats.averagePaymentTime || 28) <= 30 ? 'success' : 'warning'
    }
  ];

  const getStatusColor = (status: StatCardData['status']) => {
    switch (status) {
      case 'success':
        return 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950';
      case 'warning':
        return 'border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-950';
      case 'error':
        return 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950';
      case 'info':
        return 'border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950';
      default:
        return '';
    }
  };

  const getIconColor = (status: StatCardData['status']) => {
    switch (status) {
      case 'success':
        return 'text-green-600';
      case 'warning':
        return 'text-yellow-600';
      case 'error':
        return 'text-red-600';
      case 'info':
        return 'text-blue-600';
      default:
        return 'text-muted-foreground';
    }
  };

  const getTrendIcon = (type: 'increase' | 'decrease' | 'neutral') => {
    switch (type) {
      case 'increase':
        return <TrendingUp className="h-3 w-3 text-green-600" />;
      case 'decrease':
        return <TrendingDown className="h-3 w-3 text-red-600" />;
      default:
        return <Activity className="h-3 w-3 text-muted-foreground" />;
    }
  };

  return (
    <div className={cn("grid gap-4 md:grid-cols-2 lg:grid-cols-3", className)}>
      {statCards.map((stat, index) => {
        const Icon = stat.icon;
        
        return (
          <Card 
            key={index} 
            className={cn(
              "transition-all duration-200 hover:shadow-md",
              getStatusColor(stat.status)
            )}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <Icon className={cn("h-4 w-4", getIconColor(stat.status))} />
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="text-2xl font-bold">{stat.value}</div>
                
                {stat.subtitle && (
                  <p className="text-xs text-muted-foreground">
                    {stat.subtitle}
                  </p>
                )}
                
                {stat.change && (
                  <div className="flex items-center gap-1 text-xs">
                    {getTrendIcon(stat.change.type)}
                    <span className={cn(
                      "font-medium",
                      stat.change.type === 'increase' ? 'text-green-600' : 
                      stat.change.type === 'decrease' ? 'text-red-600' : 
                      'text-muted-foreground'
                    )}>
                      {stat.change.value.toFixed(1)}%
                    </span>
                    <span className="text-muted-foreground">{stat.change.period}</span>
                  </div>
                )}
                
                {stat.progress && (
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">
                        {stat.progress.label || 'Progress'}
                      </span>
                      <span className="font-medium">
                        {stat.progress.value}/{stat.progress.max}
                      </span>
                    </div>
                    <Progress 
                      value={(stat.progress.value / stat.progress.max) * 100} 
                      className="h-2"
                    />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}