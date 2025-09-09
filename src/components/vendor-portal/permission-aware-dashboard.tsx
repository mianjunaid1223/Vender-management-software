'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { VendorStatCards } from './vendor-stat-cards';
import { VendorProfileSettings } from './vendor-profile-settings';
import { VendorCompanyProfile } from './vendor-company-profile';
import { useToast } from '@/hooks/use-toast';
import {
  Shield,
  Lock,
  Eye,
  EyeOff,
  AlertTriangle,
  CheckCircle,
  Receipt,
  FileText,
  User,
  Building2,
  MessageSquare,
  Bell,
  BarChart3,
  FolderOpen,
  RefreshCw
} from 'lucide-react';
import {
  VendorPermissions,
  PermissionChecker,
  PermissionResource
} from '@/lib/types/permissions';

interface PermissionAwareDashboardProps {
  vendorId: string;
  companyId: string;
  initialData?: any;
}

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
  permissions: VendorPermissions | null;
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
  recentInvoices: any[];
  contracts: any[];
  notifications: any[];
}

const TAB_CONFIG: Record<string, {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  resource: PermissionResource;
  description: string;
}> = {
  overview: {
    label: 'Overview',
    icon: BarChart3,
    resource: 'profile', // Overview requires at least profile read
    description: 'Dashboard overview and statistics'
  },
  invoices: {
    label: 'Invoices',
    icon: Receipt,
    resource: 'invoices',
    description: 'Invoice management and tracking'
  },
  contracts: {
    label: 'Contracts',
    icon: FileText,
    resource: 'contracts',
    description: 'Contract information and details'
  },
  messages: {
    label: 'Messages',
    icon: MessageSquare,
    resource: 'messages',
    description: 'Communication with company team'
  },
  documents: {
    label: 'Documents',
    icon: FolderOpen,
    resource: 'documents',
    description: 'Document management and uploads'
  },
  company: {
    label: 'Company',
    icon: Building2,
    resource: 'company_info',
    description: 'Company information and contacts'
  },
  profile: {
    label: 'Profile',
    icon: User,
    resource: 'profile',
    description: 'Vendor profile and settings'
  }
};

export function PermissionAwareDashboard({ 
  vendorId, 
  companyId, 
  initialData 
}: PermissionAwareDashboardProps) {
  const [data, setData] = useState<VendorDashboardData | null>(initialData);
  const [isLoading, setIsLoading] = useState(!initialData);
  const [permissionChecker, setPermissionChecker] = useState<PermissionChecker | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const { toast } = useToast();

  useEffect(() => {
    if (!initialData) {
      fetchDashboardData();
    }
  }, [vendorId, companyId]);

  useEffect(() => {
    if (data?.permissions) {
      setPermissionChecker(new PermissionChecker(data.permissions.permissions));
    }
  }, [data?.permissions]);

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);
      
      // Fetch vendor dashboard data with permissions
      const response = await fetch(`/api/vendor/dashboard-with-permissions/${vendorId}`, {
        headers: {
          'X-Company-Id': companyId
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch dashboard data');
      }

      const dashboardData = await response.json();
      setData(dashboardData);
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

  const getAvailableTabs = () => {
    if (!permissionChecker) return [];
    
    return Object.entries(TAB_CONFIG).filter(([_, config]) => 
      permissionChecker.canRead(config.resource)
    );
  };

  const renderPermissionAlert = () => {
    if (!data?.permissions) {
      return (
        <Alert className="border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            No permissions have been granted for this vendor. Contact the company administrator to request access.
          </AlertDescription>
        </Alert>
      );
    }

    if (!permissionChecker?.hasMinimumAccess()) {
      return (
        <Alert className="border-yellow-200 bg-yellow-50">
          <Lock className="h-4 w-4" />
          <AlertDescription>
            Limited access granted. Some features may not be available based on your permission level.
          </AlertDescription>
        </Alert>
      );
    }

    return null;
  };

  const renderRestrictedContent = (resource: PermissionResource, children: React.ReactNode) => {
    if (!permissionChecker?.canRead(resource)) {
      return (
        <Card className="border-gray-200 bg-gray-50">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Lock className="h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-600 mb-2">Access Restricted</h3>
            <p className="text-sm text-gray-500 text-center max-w-md">
              You don't have permission to view this section. Contact your company administrator to request access.
            </p>
          </CardContent>
        </Card>
      );
    }

    return children;
  };

  const renderActionButton = (
    resource: PermissionResource, 
    action: 'create' | 'edit' | 'delete',
    children: React.ReactNode,
    onClick?: () => void
  ) => {
    const hasPermission = permissionChecker?.hasPermission(resource, action);
    
    if (!hasPermission) {
      return (
        <Button variant="outline" disabled className="opacity-50">
          <Lock className="h-4 w-4 mr-2" />
          {action === 'create' ? 'Create' : action === 'edit' ? 'Edit' : 'Delete'}
        </Button>
      );
    }

    return React.cloneElement(children as React.ReactElement, { onClick });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">No Data Available</h2>
          <Button onClick={fetchDashboardData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </div>
      </div>
    );
  }

  const availableTabs = getAvailableTabs();

  return (
    <div className="space-y-6">
      {/* Permission Status Alert */}
      {renderPermissionAlert()}

      {/* Permission Summary */}
      {data.permissions && (
        <Card className="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-800 dark:text-blue-200">
              <Shield className="h-5 w-5" />
              Access Level
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  Permissions granted by {data.vendor.company.name}
                </p>
                <p className="text-xs text-blue-600 dark:text-blue-400">
                  Last updated: {new Date(data.permissions.lastUpdated).toLocaleDateString()}
                </p>
              </div>
              <div className="flex flex-wrap gap-1">
                {data.permissions.permissions.map(permission => (
                  <Badge key={permission.id} variant="outline" className="text-xs">
                    {permission.resource}: {permission.actions.join(', ')}
                  </Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats Cards - Only show if has any read permission */}
      {permissionChecker?.hasMinimumAccess() && (
        <VendorStatCards 
          stats={data.stats} 
          currency="USD"
          className="mb-6"
        />
      )}

      {/* Main Content Tabs */}
      {availableTabs.length > 0 ? (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full" style={{ gridTemplateColumns: `repeat(${availableTabs.length}, 1fr)` }}>
            {availableTabs.map(([tabKey, config]) => {
              const Icon = config.icon;
              return (
                <TabsTrigger key={tabKey} value={tabKey} className="flex items-center gap-2">
                  <Icon className="h-4 w-4" />
                  <span className="hidden sm:inline">{config.label}</span>
                </TabsTrigger>
              );
            })}
          </TabsList>

          <TabsContent value="overview">
            {renderRestrictedContent('profile', (
              <div className="space-y-6">
                {/* Recent Activity */}
                <Card>
                  <CardHeader>
                    <CardTitle>Recent Activity</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {data.recentInvoices.slice(0, 5).map((invoice: any) => (
                        <div key={invoice.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center gap-3">
                            <Receipt className="h-5 w-5 text-blue-600" />
                            <div>
                              <p className="font-medium">{invoice.invoiceNumber}</p>
                              <p className="text-sm text-muted-foreground">
                                {new Date(invoice.issueDate).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-medium">${invoice.amount}</p>
                            <Badge variant="outline">{invoice.status}</Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Quick Actions */}
                <Card>
                  <CardHeader>
                    <CardTitle>Quick Actions</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {renderActionButton('invoices', 'create', (
                        <Button className="w-full">
                          <Receipt className="h-4 w-4 mr-2" />
                          New Invoice
                        </Button>
                      ))}
                      
                      {renderActionButton('profile', 'edit', (
                        <Button variant="outline" className="w-full">
                          <User className="h-4 w-4 mr-2" />
                          Edit Profile
                        </Button>
                      ))}
                      
                      {renderActionButton('messages', 'create', (
                        <Button variant="outline" className="w-full">
                          <MessageSquare className="h-4 w-4 mr-2" />
                          Send Message
                        </Button>
                      ))}
                      
                      {renderActionButton('documents', 'create', (
                        <Button variant="outline" className="w-full">
                          <FolderOpen className="h-4 w-4 mr-2" />
                          Upload Document
                        </Button>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            ))}
          </TabsContent>

          <TabsContent value="invoices">
            {renderRestrictedContent('invoices', (
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>Invoice Management</CardTitle>
                  {renderActionButton('invoices', 'create', (
                    <Button>
                      <Receipt className="h-4 w-4 mr-2" />
                      Create Invoice
                    </Button>
                  ))}
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {data.recentInvoices.map((invoice: any) => (
                      <div key={invoice.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center gap-4">
                          <Receipt className="h-5 w-5 text-blue-600" />
                          <div>
                            <h4 className="font-medium">{invoice.invoiceNumber}</h4>
                            <p className="text-sm text-muted-foreground">{invoice.description}</p>
                            <p className="text-xs text-muted-foreground">
                              Due: {new Date(invoice.dueDate).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">${invoice.amount}</p>
                          <Badge variant="outline">{invoice.status}</Badge>
                          <div className="flex gap-1 mt-2">
                            <Button size="sm" variant="outline">
                              <Eye className="h-3 w-3" />
                            </Button>
                            {renderActionButton('invoices', 'edit', (
                              <Button size="sm" variant="outline">
                                <Edit className="h-3 w-3" />
                              </Button>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="contracts">
            {renderRestrictedContent('contracts', (
              <Card>
                <CardHeader>
                  <CardTitle>Contract Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {data.contracts.map((contract: any) => (
                      <div key={contract.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center gap-4">
                          <FileText className="h-5 w-5 text-green-600" />
                          <div>
                            <h4 className="font-medium">{contract.title}</h4>
                            <p className="text-sm text-muted-foreground">
                              {new Date(contract.startDate).toLocaleDateString()} - {new Date(contract.endDate).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">${contract.value}</p>
                          <Badge variant="outline">{contract.status}</Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="messages">
            {renderRestrictedContent('messages', (
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>Messages</CardTitle>
                  {renderActionButton('messages', 'create', (
                    <Button>
                      <MessageSquare className="h-4 w-4 mr-2" />
                      New Message
                    </Button>
                  ))}
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8">
                    <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No messages yet</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="documents">
            {renderRestrictedContent('documents', (
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>Documents</CardTitle>
                  {renderActionButton('documents', 'create', (
                    <Button>
                      <FolderOpen className="h-4 w-4 mr-2" />
                      Upload Document
                    </Button>
                  ))}
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8">
                    <FolderOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No documents uploaded</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="company">
            {renderRestrictedContent('company_info', (
              <VendorCompanyProfile companyId={companyId} />
            ))}
          </TabsContent>

          <TabsContent value="profile">
            {renderRestrictedContent('profile', (
              <VendorProfileSettings vendorId={vendorId} />
            ))}
          </TabsContent>
        </Tabs>
      ) : (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Lock className="h-16 w-16 text-red-400 mb-4" />
            <h2 className="text-xl font-semibold text-red-800 mb-2">No Access Granted</h2>
            <p className="text-red-600 text-center max-w-md">
              You don't have any permissions to access this vendor portal. 
              Please contact {data.vendor.company.name} to request access.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Permission Details */}
      {data.permissions && permissionChecker && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Your Permissions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.entries(TAB_CONFIG).map(([key, config]) => {
                const Icon = config.icon;
                const permissions = permissionChecker.getResourcePermissions(config.resource);
                const hasAccess = permissions.length > 0;
                
                return (
                  <div key={key} className={cn(
                    "p-4 border rounded-lg",
                    hasAccess ? "border-green-200 bg-green-50" : "border-gray-200 bg-gray-50"
                  )}>
                    <div className="flex items-center gap-3 mb-2">
                      <Icon className={cn("h-5 w-5", hasAccess ? "text-green-600" : "text-gray-400")} />
                      <span className={cn("font-medium", hasAccess ? "text-green-800" : "text-gray-600")}>
                        {config.label}
                      </span>
                      {hasAccess ? (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      ) : (
                        <EyeOff className="h-4 w-4 text-gray-400" />
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mb-3">{config.description}</p>
                    {hasAccess ? (
                      <div className="flex flex-wrap gap-1">
                        {permissions.map(action => (
                          <Badge key={action} variant="outline" className="text-xs">
                            {action}
                          </Badge>
                        ))}
                      </div>
                    ) : (
                      <Badge variant="secondary" className="text-xs">No Access</Badge>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}