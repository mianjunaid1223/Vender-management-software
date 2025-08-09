'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { 
  DollarSign, 
  FileText, 
  Clock, 
  CheckCircle,
  XCircle,
  TrendingUp,
  Calendar,
  Building2,
  Activity,
  Plus
} from 'lucide-react';

interface VendorData {
  id: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  status: string;
  joinedDate: string;
  pin: string;
}

interface DashboardData {
  vendor: VendorData;
  company: {
    id: string;
    name: string;
    email: string;
    logo?: string;
  } | null;
  metrics: {
    totalInvoices: number;
    pendingInvoices: number;
    approvedInvoices: number;
    paidInvoices: number;
    totalAmountPending: number;
    totalAmountPaid: number;
  };
  recentInvoices: Array<{
    id: string;
    number: string;
    amount: number;
    status: string;
    dueDate: string;
    createdAt: string;
    description: string;
  }>;
  contracts: Array<{
    id: string;
    title: string;
    status: string;
    startDate: string;
    endDate: string;
    value: number;
    createdAt: string;
  }>;
  recentActivities: Array<{
    id: string;
    type: string;
    title: string;
    description: string;
    createdAt: string;
    metadata: any;
  }>;
  upcomingPayments: Array<{
    id: string;
    number: string;
    amount: number;
    dueDate: string;
    description: string;
  }>;
}

interface VendorOverviewProps {
  vendor: VendorData;
  onTabChange: (tab: string) => void;
}

export function VendorOverview({ vendor, onTabChange }: VendorOverviewProps) {
  const { toast } = useToast();
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const response = await fetch(`/api/vendor/dashboard-data?vendorId=${vendor.id}`);
        if (!response.ok) {
          throw new Error('Failed to fetch dashboard data');
        }
        const data = await response.json();
        setDashboardData(data);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        toast({
          title: 'Error',
          description: 'Failed to load dashboard data. Please try again.',
          variant: 'destructive'
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, [vendor.id, toast]);

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { variant: 'secondary' as const, label: 'Pending' },
      submitted: { variant: 'secondary' as const, label: 'Submitted' },
      under_review: { variant: 'default' as const, label: 'Under Review' },
      approved: { variant: 'default' as const, label: 'Approved' },
      paid: { variant: 'default' as const, label: 'Paid' },
      rejected: { variant: 'destructive' as const, label: 'Rejected' },
      overdue: { variant: 'destructive' as const, label: 'Overdue' }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || { variant: 'secondary' as const, label: status };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-gray-200 h-32 rounded-lg"></div>
            ))}
          </div>
          <div className="bg-gray-200 h-96 rounded-lg"></div>
        </div>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="text-center py-12">
        <Building2 className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">No data available</h3>
        <p className="mt-1 text-sm text-gray-500">Failed to load dashboard data.</p>
      </div>
    );
  }

  const { metrics, recentInvoices, recentActivities, upcomingPayments, company } = dashboardData;

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-lg border">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Welcome back, {vendor.name}!</h2>
            <p className="mt-1 text-sm text-gray-600">
              {company ? `Connected to ${company.name}` : 'Vendor Portal Dashboard'}
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-500">Your PIN</p>
            <p className="text-lg font-mono font-bold text-blue-600">{vendor.pin}</p>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Invoices</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalInvoices}</div>
            <p className="text-xs text-muted-foreground">All time invoices</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Invoices</CardTitle>
            <Clock className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{metrics.pendingInvoices}</div>
            <p className="text-xs text-muted-foreground">Awaiting approval</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Amount Pending</CardTitle>
            <DollarSign className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {formatCurrency(metrics.totalAmountPending)}
            </div>
            <p className="text-xs text-muted-foreground">Pending payment</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Amount Paid</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(metrics.totalAmountPaid)}
            </div>
            <p className="text-xs text-muted-foreground">Total received</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Invoices */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Recent Invoices</CardTitle>
            <Button size="sm" onClick={() => onTabChange('invoices')}>
              <Plus className="h-4 w-4 mr-2" />
              View All
            </Button>
          </CardHeader>
          <CardContent>
            {recentInvoices.length > 0 ? (
              <div className="space-y-4">
                {recentInvoices.map((invoice) => (
                  <div key={invoice.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <p className="font-medium">{invoice.number}</p>
                        {getStatusBadge(invoice.status)}
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{invoice.description}</p>
                      <p className="text-xs text-gray-500">Due: {formatDate(invoice.dueDate)}</p>
                    </div>
                    <div className="text-right ml-4">
                      <p className="font-semibold">{formatCurrency(invoice.amount)}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <FileText className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No invoices yet</h3>
                <p className="mt-1 text-sm text-gray-500">Create your first invoice to get started.</p>
                <div className="mt-6">
                  <Button onClick={() => onTabChange('invoices')}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Invoice
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Activities */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            {recentActivities.length > 0 ? (
              <div className="space-y-4">
                {recentActivities.map((activity) => (
                  <div key={activity.id} className="flex items-start space-x-3">
                    <div className="flex-shrink-0">
                      <Activity className="h-5 w-5 text-blue-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">{activity.title}</p>
                      <p className="text-sm text-gray-500">{activity.description}</p>
                      <p className="text-xs text-gray-400">{formatDate(activity.createdAt)}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Activity className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No recent activity</h3>
                <p className="mt-1 text-sm text-gray-500">Your activity will appear here.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Upcoming Payments */}
      {upcomingPayments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Calendar className="h-5 w-5 mr-2" />
              Upcoming Payments
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {upcomingPayments.map((payment) => (
                <div key={payment.id} className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div>
                    <p className="font-medium">{payment.number}</p>
                    <p className="text-sm text-gray-600">{payment.description}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-green-600">{formatCurrency(payment.amount)}</p>
                    <p className="text-xs text-gray-500">Due: {formatDate(payment.dueDate)}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
