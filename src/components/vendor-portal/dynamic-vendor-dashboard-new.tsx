'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { VendorProfileSettings } from './vendor-profile-settings';
import { 
  Building2, 
  FileText, 
  Receipt, 
  DollarSign,
  TrendingUp,
  Calendar,
  AlertCircle,
  CheckCircle,
  Clock,
  Download,
  Eye,
  RefreshCw,
  Settings,
  BarChart3,
  User
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface VendorDashboardData {
  vendor: {
    id: string;
    name: string;
    email: string;
    status: string;
    company: {
      name: string;
      id: string;
    };
  };
  stats: {
    totalContracts: number;
    activeContracts: number;
    totalInvoices: number;
    paidInvoices: number;
    pendingInvoices: number;
    overdueInvoices: number;
    totalRevenue: number;
    pendingPayments: number;
  };
  recentInvoices: Array<{
    id: string;
    invoiceNumber: string;
    amount: number;
    currency: string;
    status: string;
    dueDate: string;
    issueDate: string;
    companyName: string;
  }>;
  contracts: Array<{
    id: string;
    title: string;
    status: string;
    startDate: string;
    endDate: string;
    value: number;
    currency: string;
    companyName: string;
  }>;
  notifications: Array<{
    id: string;
    type: string;
    message: string;
    date: string;
    read: boolean;
  }>;
}

interface DynamicVendorDashboardProps {
  vendorId: string;
}

export function DynamicVendorDashboard({ vendorId }: DynamicVendorDashboardProps) {
  const { toast } = useToast();
  const [data, setData] = useState<VendorDashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchDashboardData = async () => {
    try {
      // Get authentication token
      const token = sessionStorage.getItem('vendorToken');
      
      if (!token) {
        throw new Error('No authentication token available');
      }

      const response = await fetch(`/api/vendor/dashboard/${vendorId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Authentication expired');
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const dashboardData = await response.json();
      setData(dashboardData);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to load dashboard data',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (vendorId) {
      fetchDashboardData();
    }
  }, [vendorId]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchDashboardData();
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'paid': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'overdue': return 'bg-red-100 text-red-800';
      case 'active': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'paid': return <CheckCircle className="h-4 w-4" />;
      case 'pending': return <Clock className="h-4 w-4" />;
      case 'overdue': return <AlertCircle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const formatCurrency = (amount: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
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
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">No Data Available</h2>
          <Button onClick={fetchDashboardData}>Try Again</Button>
        </div>
      </div>
    );
  }

  const paymentCompletionRate = data.stats.totalInvoices > 0 
    ? Math.round((data.stats.paidInvoices / data.stats.totalInvoices) * 100) 
    : 0;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Vendor Dashboard</h1>
            <p className="text-gray-600 mt-1">
              Welcome back, {data.vendor.name} • {data.vendor.company.name}
            </p>
          </div>
          <Button 
            variant="outline" 
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(data.stats.totalRevenue)}
              </div>
              <p className="text-xs text-muted-foreground">
                From {data.stats.totalInvoices} invoices
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Contracts</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data.stats.activeContracts}</div>
              <p className="text-xs text-muted-foreground">
                Of {data.stats.totalContracts} total contracts
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Payments</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(data.stats.pendingPayments)}
              </div>
              <p className="text-xs text-muted-foreground">
                From {data.stats.pendingInvoices} pending invoices
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Payment Rate</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{paymentCompletionRate}%</div>
              <Progress value={paymentCompletionRate} className="mt-2" />
            </CardContent>
          </Card>
        </div>

        {/* Notifications */}
        {data.notifications.length > 0 && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center">
                <AlertCircle className="h-5 w-5 mr-2" />
                Recent Notifications
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {data.notifications.slice(0, 3).map((notification) => (
                  <div key={notification.id} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <p className="text-sm">{notification.message}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatDate(notification.date)}
                      </p>
                    </div>
                    {!notification.read && (
                      <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Main Content Tabs */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">
              <BarChart3 className="h-4 w-4 mr-2" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="invoices">
              <Receipt className="h-4 w-4 mr-2" />
              Invoices
            </TabsTrigger>
            <TabsTrigger value="contracts">
              <FileText className="h-4 w-4 mr-2" />
              Contracts
            </TabsTrigger>
            <TabsTrigger value="profile">
              <User className="h-4 w-4 mr-2" />
              Profile
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Recent Invoices Summary */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Receipt className="h-5 w-5 mr-2" />
                    Recent Invoices
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {data.recentInvoices.length === 0 ? (
                    <div className="text-center py-8">
                      <Receipt className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500">No invoices found</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {data.recentInvoices.slice(0, 5).map((invoice) => (
                        <div key={invoice.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 transition-colors">
                          <div className="flex items-center space-x-3">
                            <div className="bg-blue-100 p-2 rounded">
                              <Receipt className="h-4 w-4 text-blue-600" />
                            </div>
                            <div>
                              <h4 className="font-medium text-sm">{invoice.invoiceNumber}</h4>
                              <p className="text-xs text-gray-600">{invoice.companyName}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-medium text-sm">{formatCurrency(invoice.amount, invoice.currency)}</p>
                            <Badge className={`${getStatusColor(invoice.status)} text-xs`}>
                              {getStatusIcon(invoice.status)}
                              <span className="ml-1">{invoice.status}</span>
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Active Contracts Summary */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <FileText className="h-5 w-5 mr-2" />
                    Active Contracts
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {data.contracts.length === 0 ? (
                    <div className="text-center py-8">
                      <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500">No contracts found</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {data.contracts.slice(0, 5).map((contract) => (
                        <div key={contract.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 transition-colors">
                          <div className="flex items-center space-x-3">
                            <div className="bg-green-100 p-2 rounded">
                              <FileText className="h-4 w-4 text-green-600" />
                            </div>
                            <div>
                              <h4 className="font-medium text-sm">{contract.title}</h4>
                              <p className="text-xs text-gray-600">{contract.companyName}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-medium text-sm">{formatCurrency(contract.value, contract.currency)}</p>
                            <Badge className={`${getStatusColor(contract.status)} text-xs`}>
                              {contract.status}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Payment Analytics */}
              <Card>
                <CardHeader>
                  <CardTitle>Payment Analytics</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Paid Invoices</span>
                      <span className="font-medium text-green-600">{data.stats.paidInvoices}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Pending Invoices</span>
                      <span className="font-medium text-yellow-600">{data.stats.pendingInvoices}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Overdue Invoices</span>
                      <span className="font-medium text-red-600">{data.stats.overdueInvoices}</span>
                    </div>
                    <div className="pt-2 border-t">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">Payment Completion</span>
                        <span className="font-bold">{paymentCompletionRate}%</span>
                      </div>
                      <Progress value={paymentCompletionRate} className="mt-2" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Contract Analytics */}
              <Card>
                <CardHeader>
                  <CardTitle>Contract Overview</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Total Contracts</span>
                      <span className="font-medium">{data.stats.totalContracts}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Active Contracts</span>
                      <span className="font-medium text-blue-600">{data.stats.activeContracts}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Total Revenue</span>
                      <span className="font-medium text-green-600">{formatCurrency(data.stats.totalRevenue)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="invoices">
            <Card>
              <CardHeader>
                <CardTitle>All Invoices</CardTitle>
              </CardHeader>
              <CardContent>
                {data.recentInvoices.length === 0 ? (
                  <div className="text-center py-8">
                    <Receipt className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No invoices found</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {data.recentInvoices.map((invoice) => (
                      <div key={invoice.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                        <div className="flex items-center space-x-4">
                          <div className="bg-blue-100 p-2 rounded">
                            <Receipt className="h-5 w-5 text-blue-600" />
                          </div>
                          <div>
                            <h4 className="font-medium">{invoice.invoiceNumber}</h4>
                            <p className="text-sm text-gray-600">{invoice.companyName}</p>
                            <p className="text-xs text-gray-500">
                              Issue: {formatDate(invoice.issueDate)} • Due: {formatDate(invoice.dueDate)}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">{formatCurrency(invoice.amount, invoice.currency)}</p>
                          <div className="flex items-center space-x-2 mt-1">
                            <Badge className={getStatusColor(invoice.status)}>
                              {getStatusIcon(invoice.status)}
                              <span className="ml-1">{invoice.status}</span>
                            </Badge>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="contracts">
            <Card>
              <CardHeader>
                <CardTitle>All Contracts</CardTitle>
              </CardHeader>
              <CardContent>
                {data.contracts.length === 0 ? (
                  <div className="text-center py-8">
                    <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No contracts found</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {data.contracts.map((contract) => (
                      <div key={contract.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                        <div className="flex items-center space-x-4">
                          <div className="bg-green-100 p-2 rounded">
                            <FileText className="h-5 w-5 text-green-600" />
                          </div>
                          <div>
                            <h4 className="font-medium">{contract.title}</h4>
                            <p className="text-sm text-gray-600">{contract.companyName}</p>
                            <p className="text-xs text-gray-500">
                              {formatDate(contract.startDate)} - {formatDate(contract.endDate)}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">{formatCurrency(contract.value, contract.currency)}</p>
                          <Badge className={getStatusColor(contract.status)}>
                            {contract.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="profile">
            <VendorProfileSettings vendorId={data.vendor.id} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
