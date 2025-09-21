'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { 
  FileText, 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  DollarSign, 
  TrendingUp,
  Bell,
  Settings,
  LogOut,
  Building2,
  Upload,
  Download,
  Edit,
  Eye,
  Plus,
  Filter,
  Search,
  MessageSquare,
  CreditCard,
  Shield,
  Users,
  User,
  Key,
  Calendar,
  FileCheck,
  MoreHorizontal
} from 'lucide-react';
import { ThemeToggle } from '@/components/theme-toggle';
import { Logo } from '@/components/logo';
import { useToast } from '@/hooks/use-toast';
import type { VendorUser } from '@/lib/types/vendor-portal';

interface VendorPortalFeatures {
  viewInvoices: boolean;
  downloadInvoices: boolean;
  uploadInvoices: boolean;
  editProfile: boolean;
  viewContracts: boolean;
  createContracts: boolean;
  manageVendors: boolean;
  uploadDocuments: boolean;
}

interface CompanyInfo {
  name: string;
  email?: string;
  phone?: string;
  industry?: string;
  address?: string;
  createdAt?: string | Date;
  features: VendorPortalFeatures;
}

interface DashboardStats {
  totalInvoices: number;
  pendingInvoices: number;
  paidInvoices: number;
  totalAmount: number;
  activeContracts: number;
  complianceScore: number;
}

interface Contract {
  id?: string;
  title: string;
  type?: string;
  status: 'draft' | 'pending_signature' | 'active' | 'completed' | string;
  startDate: string | Date;
  endDate: string | Date;
  value: number;
}

interface Invoice {
  id: string;
  number: string;
  amount: number;
  status: 'pending' | 'approved' | 'paid' | 'rejected';
  dueDate: string;
  uploadDate: string;
  description: string;
}

interface VendorDashboardProps {
  user: VendorUser;
}

export function EnhancedVendorDashboard({ user }: VendorDashboardProps) {
  const [stats, setStats] = useState<DashboardStats>({
    totalInvoices: 0,
    pendingInvoices: 0,
    paidInvoices: 0,
    totalAmount: 0,
    activeContracts: 0,
    complianceScore: 0,
  });

  const [companyInfo, setCompanyInfo] = useState<CompanyInfo | null>(null);
  const [vendorAccess, setVendorAccess] = useState<any>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [invoiceFilter, setInvoiceFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [isProfileDialogOpen, setIsProfileDialogOpen] = useState(false);
  const [permissionsExpanded, setPermissionsExpanded] = useState(false);
  
  const router = useRouter();
  const { toast } = useToast();

  // Fetch invoices with filters
  const fetchInvoices = async (page = 1, status = 'all', search = '') => {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10',
        status,
        search
      });
      
      const response = await fetch(`/api/vendor-portal/invoices?${params}`);
      if (response.ok) {
        const data = await response.json();
        setInvoices(data.data || data.invoices || []);
      }
    } catch (error) {
      console.error('Error fetching invoices:', error);
    }
  };

  // Feature configuration for better UI display
  const getFeatureConfig = (feature: string) => {
    const configs: Record<string, { label: string; icon: string; description: string }> = {
      viewInvoices: { label: 'View Invoices', icon: '�️', description: 'View invoice history and status' },
      downloadInvoices: { label: 'Download Invoices', icon: '⬇️', description: 'Download invoice documents' },
      uploadInvoices: { label: 'Upload Invoices', icon: '⬆️', description: 'Submit new invoices' },
      editProfile: { label: 'Edit Profile', icon: '✏️', description: 'Update company information' },
      viewContracts: { label: 'View Contracts', icon: '📋', description: 'Access contract documents' },
      createContracts: { label: 'Create Contracts', icon: '📝', description: 'Draft and create new contracts' },

      viewPayments: { label: 'View Payments', icon: '�️', description: 'Track payment status' },
      updatePaymentInfo: { label: 'Update Payment Info', icon: '�', description: 'Update payment information' },
      communication: { label: 'Communication', icon: '�', description: 'Send messages and notifications' },
      communicateWithBuyer: { label: 'Communicate with Buyer', icon: '�', description: 'Direct communication with buyers' },
      uploadDocuments: { label: 'Upload Documents', icon: '📎', description: 'Upload various documents' },
      viewComplianceRequirements: { label: 'View Compliance Requirements', icon: '�️', description: 'View compliance requirements' },
    };
    return configs[feature] || { label: feature, icon: '⚙️', description: 'Additional feature' };
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Refetch invoices when filters change
  useEffect(() => {
    if (activeTab === 'invoices') {
      fetchInvoices(currentPage, invoiceFilter, searchTerm);
    }
  }, [activeTab, currentPage, invoiceFilter, searchTerm]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // Fetch all data in parallel
      const [statsRes, companyRes, vendorAccessRes, invoicesRes, contractsRes, activityRes, notificationsRes] = await Promise.all([
        fetch('/api/vendor-portal/dashboard/stats'),
        fetch('/api/vendor-portal/company-info'),
        fetch('/api/admin/vendor-portal-access?companyId=comp_001'),
        fetch('/api/vendor-portal/invoices?limit=5'),
        fetch('/api/vendor-portal/contracts?limit=5'),
        fetch('/api/vendor-portal/dashboard/activity?limit=10'),
        fetch('/api/vendor-portal/notifications?limit=5')
      ]);

      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData);
      }

      if (companyRes.ok) {
        const companyData = await companyRes.json();
        setCompanyInfo(companyData);
      }

      if (vendorAccessRes.ok) {
        const vendorAccessData = await vendorAccessRes.json();
        setVendorAccess(vendorAccessData);
      }

      if (invoicesRes.ok) {
        const invoicesData = await invoicesRes.json();
        // Handle both direct array and object with data property
        const invoicesArray = Array.isArray(invoicesData) 
          ? invoicesData 
          : invoicesData.data || invoicesData.invoices || [];
        setInvoices(invoicesArray);
      }

      if (contractsRes.ok) {
        const contractsData = await contractsRes.json();
        // Handle both direct array and object with data property
        const contractsArray = Array.isArray(contractsData) 
          ? contractsData 
          : contractsData.data || contractsData.contracts || [];
        setContracts(contractsArray);
      }

      if (activityRes.ok) {
        const activityData = await activityRes.json();
        const activitiesArray = Array.isArray(activityData) 
          ? activityData 
          : activityData.data || activityData.activities || [];
        setRecentActivity(activitiesArray);
      }

      if (notificationsRes.ok) {
        const notificationsData = await notificationsRes.json();
        const notificationsArray = Array.isArray(notificationsData) 
          ? notificationsData 
          : notificationsData.data || notificationsData.notifications || [];
        setNotifications(notificationsArray);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load dashboard data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/vendor-portal/auth/logout', { method: 'POST' });
      toast({
        title: 'Logged out',
        description: 'You have been successfully logged out.',
      });
      router.push('/vendor-portal');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const handleInvoiceUpload = async (formData: FormData) => {
    try {
      const response = await fetch('/api/vendor-portal/invoices/upload', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Invoice uploaded successfully',
        });
        setIsUploadDialogOpen(false);
        fetchDashboardData(); // Refresh data
      } else {
        throw new Error('Upload failed');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to upload invoice',
        variant: 'destructive',
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'approved': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'paid': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'rejected': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'active': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'completed': return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const filteredInvoices = invoices.filter(invoice => {
    const matchesSearch = invoice.number.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         invoice.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = invoiceFilter === 'all' || invoice.status === invoiceFilter;
    return matchesSearch && matchesFilter;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
          <p className="mt-4 text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Logo />
            <Separator orientation="vertical" className="h-6" />
            <div className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-primary" />
              <span className="font-semibold text-foreground">Vendor Portal</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm">
              <Bell className="h-4 w-4" />
              {notifications.filter(n => !n.read).length > 0 && (
                <Badge variant="destructive" className="ml-2 h-5 w-5 rounded-full p-0 text-xs">
                  {notifications.filter(n => !n.read).length}
                </Badge>
              )}
            </Button>
            <ThemeToggle />
            <Button variant="ghost" size="sm" onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto p-6">
        {/* Enhanced Welcome Section */}
        <div className="bg-gradient-to-r from-primary/10 to-primary/5 rounded-lg p-6 border mb-6">
          <div className="flex items-start justify-between">
            <div className="space-y-4 flex-1">
              <div>
                <h1 className="text-3xl font-bold text-foreground">
                  Welcome to {companyInfo?.name || 'Vendor Portal'}
                </h1>
                <p className="text-muted-foreground mt-2">
                  Access your business tools and manage your partnership effectively
                </p>
              </div>
              
              {companyInfo && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-primary/20">
                  <div>
                    <h3 className="font-semibold text-foreground mb-3">Company Details</h3>
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground flex items-center gap-2">
                        <Building2 className="h-4 w-4" />
                        <span className="font-medium">Industry:</span> {companyInfo.industry || 'Not specified'}
                      </p>
                      {companyInfo.address && (
                        <p className="text-sm text-muted-foreground flex items-center gap-2">
                          <span className="h-4 w-4" />
                          <span className="font-medium">Address:</span> {companyInfo.address}
                        </p>
                      )}
                    </div>
                  </div>
                  <div>
                    <div 
                      className="flex items-center justify-between cursor-pointer group"
                      onClick={() => setPermissionsExpanded(!permissionsExpanded)}
                    >
                      <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                        <Shield className="h-4 w-4 text-primary" />
                        Your Permissions & Access Level
                      </h3>
                      <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity">
                        {permissionsExpanded ? 
                          <Eye className="h-4 w-4" /> : 
                          <MoreHorizontal className="h-4 w-4" />
                        }
                      </Button>
                    </div>
                    
                    {/* Compact View */}
                    {!permissionsExpanded && (
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="capitalize">
                            {vendorAccess?.accessLevel || 'basic'} Access
                          </Badge>
                          <span className="text-sm text-muted-foreground">
                            {Object.values(companyInfo.features || {}).filter(Boolean).length} features enabled
                          </span>
                        </div>
                        <div className="grid grid-cols-2 lg:grid-cols-3 gap-2">
                          {companyInfo.features && Object.entries(companyInfo.features)
                            .filter(([_, enabled]) => enabled)
                            .slice(0, 6)
                            .map(([feature]) => {
                              const featureConfig = getFeatureConfig(feature);
                              return (
                                <div 
                                  key={feature}
                                  className="flex items-center gap-2 p-2 rounded-md bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800"
                                >
                                  <div className="w-2 h-2 rounded-full bg-green-500" />
                                  <span className="text-xs font-medium text-green-800 dark:text-green-200">
                                    {featureConfig.icon}
                                  </span>
                                  <span className="text-xs text-green-700 dark:text-green-300 truncate">
                                    {featureConfig.label}
                                  </span>
                                </div>
                              );
                            })}
                        </div>
                        {Object.values(companyInfo.features || {}).filter(Boolean).length > 6 && (
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => setPermissionsExpanded(true)}
                            className="text-xs text-muted-foreground hover:text-foreground"
                          >
                            +{Object.values(companyInfo.features || {}).filter(Boolean).length - 6} more permissions
                          </Button>
                        )}
                      </div>
                    )}

                    {/* Expanded View */}
                    {permissionsExpanded && (
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
                          <div>
                            <Label className="text-sm font-medium">Access Level</Label>
                            <p className="text-lg font-semibold capitalize">{vendorAccess?.accessLevel || 'basic'}</p>
                          </div>
                          <div>
                            <Label className="text-sm font-medium">Portal Status</Label>
                            <div className="flex items-center gap-2">
                              <div className={`w-2 h-2 rounded-full ${vendorAccess?.portalAccess ? 'bg-green-500' : 'bg-red-500'}`} />
                              <span className="font-medium">
                                {vendorAccess?.portalAccess ? 'Active' : 'Inactive'}
                              </span>
                            </div>
                          </div>
                          <div>
                            <Label className="text-sm font-medium">Features Enabled</Label>
                            <p className="text-lg font-semibold">
                              {Object.values(companyInfo.features || {}).filter(Boolean).length}
                            </p>
                          </div>
                          <div>
                            <Label className="text-sm font-medium">Last Access</Label>
                            <p className="font-medium">
                              {vendorAccess?.lastLogin ? new Date(vendorAccess.lastLogin).toLocaleDateString() : 'First time'}
                            </p>
                          </div>
                        </div>

                        <div>
                          <h4 className="font-medium mb-3">Detailed Permissions</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {companyInfo.features && Object.entries(companyInfo.features).map(([feature, enabled]) => {
                              const featureConfig = getFeatureConfig(feature);
                              return (
                                <div 
                                  key={feature}
                                  className={`flex items-center justify-between p-3 rounded-lg border ${
                                    enabled 
                                      ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' 
                                      : 'bg-gray-50 dark:bg-gray-900/20 border-gray-200 dark:border-gray-800'
                                  }`}
                                >
                                  <div className="flex items-center gap-3">
                                    <span className="text-lg">{featureConfig.icon}</span>
                                    <div>
                                      <p className="font-medium text-sm">{featureConfig.label}</p>
                                      <p className="text-xs text-muted-foreground">{featureConfig.description}</p>
                                    </div>
                                  </div>
                                  <div className={`w-3 h-3 rounded-full ${enabled ? 'bg-green-500' : 'bg-gray-400'}`} />
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        <div className="pt-2">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => setPermissionsExpanded(false)}
                            className="text-sm text-muted-foreground hover:text-foreground"
                          >
                            Show less
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
            
            {/* Quick Action Buttons */}
            <div className="flex flex-col gap-2 ml-6">
              {companyInfo?.features?.uploadInvoices && (
                <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="w-40">
                      <Plus className="h-4 w-4 mr-2" />
                      Upload Invoice
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Upload New Invoice</DialogTitle>
                      <DialogDescription>
                        Submit a new invoice for processing
                      </DialogDescription>
                    </DialogHeader>
                    <InvoiceUploadForm onSubmit={handleInvoiceUpload} />
                  </DialogContent>
                </Dialog>
              )}
              
              {companyInfo?.features?.editProfile && (
                <Dialog open={isProfileDialogOpen} onOpenChange={setIsProfileDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="w-40">
                      <Edit className="h-4 w-4 mr-2" />
                      Edit Profile
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Update Profile</DialogTitle>
                      <DialogDescription>
                        Update your company profile information
                      </DialogDescription>
                    </DialogHeader>
                    <ProfileEditForm />
                  </DialogContent>
                </Dialog>
              )}
            </div>
          </div>
        </div>

        {/* Enhanced Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <Card className="relative overflow-hidden">
            <div className="absolute top-0 right-0 w-20 h-20 bg-blue-100 rounded-full -translate-y-10 translate-x-10 dark:bg-blue-900/20" />
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Invoices</CardTitle>
              <FileText className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalInvoices}</div>
              <p className="text-xs text-muted-foreground">
                {stats.pendingInvoices} pending review
              </p>
              <div className="mt-2">
                <Progress 
                  value={stats.totalInvoices > 0 ? (stats.paidInvoices / stats.totalInvoices) * 100 : 0} 
                  className="h-1" 
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {stats.totalInvoices > 0 
                    ? Math.round((stats.paidInvoices / stats.totalInvoices) * 100) 
                    : 0}% paid
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden">
            <div className="absolute top-0 right-0 w-20 h-20 bg-green-100 rounded-full -translate-y-10 translate-x-10 dark:bg-green-900/20" />
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Earnings</CardTitle>
              <DollarSign className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${stats.totalAmount.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">
                {stats.paidInvoices} invoices paid
              </p>
              <div className="mt-2">
                <Badge variant="outline" className="text-xs">
                  {stats.totalAmount > 0 ? '+12% from last month' : 'No earnings yet'}
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden">
            <div className="absolute top-0 right-0 w-20 h-20 bg-purple-100 rounded-full -translate-y-10 translate-x-10 dark:bg-purple-900/20" />
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Contracts</CardTitle>
              <FileCheck className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.activeContracts}</div>
              <p className="text-xs text-muted-foreground">
                Contracts in progress
              </p>
              <div className="mt-2">
                <Badge variant="outline" className="text-xs">
                  {stats.activeContracts > 0 ? `${Math.min(2, stats.activeContracts)} expiring soon` : 'No active contracts'}
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden">
            <div className="absolute top-0 right-0 w-20 h-20 bg-orange-100 rounded-full -translate-y-10 translate-x-10 dark:bg-orange-900/20" />
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Compliance Score</CardTitle>
              <Shield className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.complianceScore}%</div>
              <p className="text-xs text-muted-foreground">
                Document compliance
              </p>
              <div className="mt-2">
                <Progress value={stats.complianceScore} className="h-1" />
                <p className="text-xs text-muted-foreground mt-1">
                  {stats.complianceScore >= 90 ? 'Excellent' : 
                   stats.complianceScore >= 70 ? 'Good' : 
                   stats.complianceScore >= 50 ? 'Fair' : 'Needs Improvement'} rating
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Enhanced Main Content with More Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            {companyInfo?.features?.viewInvoices && (
              <TabsTrigger value="invoices">Invoices</TabsTrigger>
            )}
            {companyInfo?.features?.viewContracts && (
              <TabsTrigger value="contracts">Contracts</TabsTrigger>
            )}
            {companyInfo?.features?.manageVendors && (
              <TabsTrigger value="vendors">Vendors</TabsTrigger>
            )}
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Recent Activity */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                  <CardDescription>
                    Your latest actions and updates
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {recentActivity.length > 0 ? (
                      recentActivity.map((activity: any) => (
                        <div key={activity.id} className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                            activity.type === 'invoice' ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/20' :
                            activity.type === 'contract' ? 'bg-green-100 text-green-600 dark:bg-green-900/20' :
                            activity.type === 'payment' ? 'bg-purple-100 text-purple-600 dark:bg-purple-900/20' :
                            'bg-orange-100 text-orange-600 dark:bg-orange-900/20'
                          }`}>
                            {activity.type === 'invoice' ? <FileText className="w-4 h-4" /> :
                             activity.type === 'contract' ? <FileCheck className="w-4 h-4" /> :
                             activity.type === 'payment' ? <DollarSign className="w-4 h-4" /> :
                             <Edit className="w-4 h-4" />}
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium">{activity.description}</p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(activity.timestamp).toLocaleString()}
                            </p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8">
                        <Clock className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                        <p className="text-muted-foreground">No recent activity</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card>
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                  <CardDescription>
                    Frequently used features
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {companyInfo?.features?.uploadInvoices && (
                      <Button className="w-full justify-start" onClick={() => setIsUploadDialogOpen(true)}>
                        <Upload className="w-4 h-4 mr-2" />
                        Upload Invoice
                      </Button>
                    )}
                    {companyInfo?.features?.viewContracts && (
                      <Button className="w-full justify-start" variant="outline">
                        <FileCheck className="w-4 h-4 mr-2" />
                        Review Contracts
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {companyInfo?.features?.viewInvoices && (
            <TabsContent value="invoices" className="space-y-4">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Invoice Management</CardTitle>
                      <CardDescription>
                        View, upload, and track your invoices
                      </CardDescription>
                    </div>
                    {companyInfo?.features?.uploadInvoices && (
                      <Button onClick={() => setIsUploadDialogOpen(true)}>
                        <Plus className="w-4 h-4 mr-2" />
                        Upload Invoice
                      </Button>
                    )}
                  </div>
                  
                  {/* Filters and Search */}
                  <div className="flex items-center gap-4 mt-4">
                    <div className="relative flex-1 max-w-sm">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                      <Input
                        placeholder="Search invoices..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                    <Select value={invoiceFilter} onValueChange={setInvoiceFilter}>
                      <SelectTrigger className="w-40">
                        <SelectValue placeholder="Filter by status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="approved">Approved</SelectItem>
                        <SelectItem value="paid">Paid</SelectItem>
                        <SelectItem value="rejected">Rejected</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Invoice #</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Due Date</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredInvoices.length > 0 ? (
                        filteredInvoices.map((invoice) => (
                          <TableRow key={invoice.id}>
                            <TableCell className="font-medium">{invoice.number}</TableCell>
                            <TableCell>{invoice.description}</TableCell>
                            <TableCell>${invoice.amount.toLocaleString()}</TableCell>
                            <TableCell>
                              <Badge className={getStatusColor(invoice.status)}>
                                {invoice.status}
                              </Badge>
                            </TableCell>
                            <TableCell>{new Date(invoice.dueDate).toLocaleDateString()}</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Button variant="ghost" size="sm">
                                  <Eye className="h-4 w-4" />
                                </Button>
                                {companyInfo?.features?.downloadInvoices && (
                                  <Button variant="ghost" size="sm">
                                    <Download className="h-4 w-4" />
                                  </Button>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-8">
                            <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                            <p className="text-muted-foreground">No invoices found</p>
                            {companyInfo?.features?.uploadInvoices && (
                              <Button className="mt-4" onClick={() => setIsUploadDialogOpen(true)}>
                                Upload Your First Invoice
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>
          )}

          {/* Profile Tab */}
          <TabsContent value="profile" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Company Profile
                </CardTitle>
                <CardDescription>
                  Update your company information and contact details
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h3 className="font-semibold">Current Information</h3>
                    {companyInfo ? (
                      <div className="space-y-2">
                        <div>
                          <Label className="text-sm text-muted-foreground">Company Name</Label>
                          <p className="font-medium">{companyInfo.name}</p>
                        </div>
                        <div>
                          <Label className="text-sm text-muted-foreground">Email</Label>
                          <p className="font-medium">{companyInfo.email}</p>
                        </div>
                        <div>
                          <Label className="text-sm text-muted-foreground">Phone</Label>
                          <p className="font-medium">{companyInfo.phone || 'Not provided'}</p>
                        </div>
                        <div>
                          <Label className="text-sm text-muted-foreground">Address</Label>
                          <p className="font-medium">{companyInfo.address || 'Not provided'}</p>
                        </div>
                        <div>
                          <Label className="text-sm text-muted-foreground">Registration Date</Label>
                          <p className="font-medium">
                            {companyInfo.createdAt ? new Date(companyInfo.createdAt).toLocaleDateString() : 'N/A'}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <p className="text-muted-foreground">Loading profile...</p>
                    )}
                  </div>
                  <div>
                    <h3 className="font-semibold mb-4">Update Profile</h3>
                    <ProfileEditForm 
                      companyInfo={companyInfo || undefined} 
                      onUpdate={(updatedData) => {
                        setCompanyInfo(updatedData);
                        fetchDashboardData();
                      }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Contracts Tab */}
          <TabsContent value="contracts" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Contracts & Agreements
                </CardTitle>
                <CardDescription>
                  View and manage your contracts and service agreements
                </CardDescription>
              </CardHeader>
              <CardContent>
                {contracts.length > 0 ? (
                  <div className="space-y-4">
                    {contracts.map((contract, index) => (
                      <div key={index} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-semibold">{contract.title}</h3>
                          <Badge variant={contract.status === 'active' ? 'default' : 'secondary'}>
                            {contract.status}
                          </Badge>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <Label className="text-muted-foreground">Type</Label>
                            <p>{contract.type || 'Standard'}</p>
                          </div>
                          <div>
                            <Label className="text-muted-foreground">Start Date</Label>
                            <p>{new Date(contract.startDate).toLocaleDateString()}</p>
                          </div>
                          <div>
                            <Label className="text-muted-foreground">End Date</Label>
                            <p>{new Date(contract.endDate).toLocaleDateString()}</p>
                          </div>
                          <div>
                            <Label className="text-muted-foreground">Value</Label>
                            <p>${contract.value.toLocaleString()}</p>
                          </div>
                        </div>
                        <div className="mt-4 flex gap-2">
                          <Button variant="outline" size="sm">
                            <Download className="h-4 w-4 mr-2" />
                            Download
                          </Button>
                          <Button variant="outline" size="sm">
                            <Eye className="h-4 w-4 mr-2" />
                            View Details
                          </Button>
                          {companyInfo?.features?.createContracts && (
                            <Button size="sm">
                              <Plus className="h-4 w-4 mr-2" />
                              Create Contract
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="font-semibold mb-2">No Contracts Found</h3>
                    <p className="text-muted-foreground">You don't have any contracts yet.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Vendors Tab */}
          {companyInfo?.features?.manageVendors && (
            <TabsContent value="vendors" className="space-y-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Vendor Management
                  </CardTitle>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Vendor
                  </Button>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input placeholder="Search vendors..." className="pl-8" />
                      </div>
                      <Button variant="outline">
                        <Filter className="h-4 w-4 mr-2" />
                        Filter
                      </Button>
                    </div>
                    
                    <div className="border rounded-lg">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Last Activity</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          <TableRow>
                            <TableCell className="font-medium">Sample Vendor</TableCell>
                            <TableCell>vendor@example.com</TableCell>
                            <TableCell>
                              <Badge variant="outline" className="text-green-600 border-green-600">Active</Badge>
                            </TableCell>
                            <TableCell>2 hours ago</TableCell>
                            <TableCell className="text-right">
                              <div className="flex gap-2 justify-end">
                                <Button size="sm" variant="outline">
                                  <Eye className="h-4 w-4" />
                                </Button>
                                <Button size="sm" variant="outline">
                                  <Edit className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    </div>
                    
                    <div className="text-center py-4">
                      <p className="text-muted-foreground text-sm">
                        No additional vendors found. Add vendors to manage their access and relationships.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          )}

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Portal Settings
                </CardTitle>
                <CardDescription>
                  Manage your portal preferences and account settings
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="font-semibold mb-4">Notification Preferences</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Email Notifications</Label>
                        <p className="text-sm text-muted-foreground">Receive email updates for important events</p>
                      </div>
                      <input type="checkbox" defaultChecked className="rounded" />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Invoice Reminders</Label>
                        <p className="text-sm text-muted-foreground">Get notified about upcoming invoice due dates</p>
                      </div>
                      <input type="checkbox" defaultChecked className="rounded" />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>System Announcements</Label>
                        <p className="text-sm text-muted-foreground">Receive updates about new features and maintenance</p>
                      </div>
                      <input type="checkbox" className="rounded" />
                    </div>
                  </div>
                </div>

                <Separator />

                <div>
                  <h3 className="font-semibold mb-4">Security Settings</h3>
                  <div className="space-y-4">
                    <Button variant="outline" className="w-full justify-start">
                      <Key className="h-4 w-4 mr-2" />
                      Change Password
                    </Button>
                    <Button variant="outline" className="w-full justify-start">
                      <Shield className="h-4 w-4 mr-2" />
                      Two-Factor Authentication
                    </Button>
                    <Button variant="outline" className="w-full justify-start">
                      <Download className="h-4 w-4 mr-2" />
                      Download Data Export
                    </Button>
                  </div>
                </div>

                <Separator />

                <div>
                  <h3 className="font-semibold mb-4">Portal Information</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <Label className="text-muted-foreground">Access Level</Label>
                      <p className="font-medium capitalize">{vendorAccess?.accessLevel}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Portal Status</Label>
                      <Badge variant={vendorAccess?.portalAccess ? 'default' : 'destructive'}>
                        {vendorAccess?.portalAccess ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Last Login</Label>
                      <p className="font-medium">
                        {vendorAccess?.lastLogin ? new Date(vendorAccess.lastLogin).toLocaleDateString() : 'N/A'}
                      </p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Account Created</Label>
                      <p className="font-medium">
                        {companyInfo?.createdAt ? new Date(companyInfo.createdAt).toLocaleDateString() : 'N/A'}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
        </Tabs>
      </div>
    </div>
  );
}

// Invoice Upload Form Component
function InvoiceUploadForm({ onSubmit }: { onSubmit: (formData: FormData) => void }) {
  const [file, setFile] = useState<File | null>(null);
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [dueDate, setDueDate] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);
    formData.append('description', description);
    formData.append('amount', amount);
    formData.append('dueDate', dueDate);

    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="file">Invoice File</Label>
        <Input
          id="file"
          type="file"
          accept=".pdf,.jpg,.jpeg,.png"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
          required
        />
      </div>
      <div>
        <Label htmlFor="description">Description</Label>
        <Input
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Brief description of the invoice"
          required
        />
      </div>
      <div>
        <Label htmlFor="amount">Amount ($)</Label>
        <Input
          id="amount"
          type="number"
          step="0.01"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="0.00"
          required
        />
      </div>
      <div>
        <Label htmlFor="dueDate">Due Date</Label>
        <Input
          id="dueDate"
          type="date"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
          required
        />
      </div>
      <Button type="submit" className="w-full">
        Upload Invoice
      </Button>
    </form>
  );
}

// Profile Edit Form Component
function ProfileEditForm({ companyInfo, onUpdate }: { 
  companyInfo?: CompanyInfo;
  onUpdate?: (data: any) => void;
}) {
  const [companyName, setCompanyName] = useState(companyInfo?.name || '');
  const [contactEmail, setContactEmail] = useState(companyInfo?.email || '');
  const [phone, setPhone] = useState(companyInfo?.phone || '');
  const [address, setAddress] = useState(companyInfo?.address || '');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (companyInfo) {
      setCompanyName(companyInfo.name || '');
      setContactEmail(companyInfo.email || '');
      setPhone(companyInfo.phone || '');
      setAddress(companyInfo.address || '');
    }
  }, [companyInfo]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch('/api/vendor-portal/profile/update', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: companyName,
          email: contactEmail,
          phone,
          address,
        }),
      });

      if (response.ok) {
        const updatedData = await response.json();
        toast({
          title: "Profile Updated",
          description: "Your company profile has been successfully updated.",
        });
        onUpdate?.(updatedData);
      } else {
        throw new Error('Failed to update profile');
      }
    } catch (error) {
      toast({
        title: "Update Failed",
        description: "Failed to update your profile. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="companyName">Company Name</Label>
        <Input
          id="companyName"
          value={companyName}
          onChange={(e) => setCompanyName(e.target.value)}
          placeholder="Your company name"
          required
        />
      </div>
      <div>
        <Label htmlFor="contactEmail">Contact Email</Label>
        <Input
          id="contactEmail"
          type="email"
          value={contactEmail}
          onChange={(e) => setContactEmail(e.target.value)}
          placeholder="contact@company.com"
          required
        />
      </div>
      <div>
        <Label htmlFor="phone">Phone Number</Label>
        <Input
          id="phone"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="+1 (555) 123-4567"
        />
      </div>
      <div>
        <Label htmlFor="address">Address</Label>
        <Textarea
          id="address"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder="Company address"
          rows={3}
        />
      </div>
      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? 'Updating...' : 'Update Profile'}
      </Button>
    </form>
  );
}

// Create Contract Form Component
function CreateContractForm({ onSuccess }: { onSuccess: () => void }) {
  const [title, setTitle] = useState('');
  const [type, setType] = useState('service');
  const [description, setDescription] = useState('');
  const [value, setValue] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch('/api/vendor-portal/contracts/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title,
          type,
          description,
          value: parseFloat(value),
          startDate,
          endDate,
        }),
      });

      if (response.ok) {
        onSuccess();
      } else {
        throw new Error('Failed to create contract');
      }
    } catch (error) {
      toast({
        title: "Creation Failed",
        description: "Failed to create contract. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="title">Contract Title</Label>
          <Input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g., Service Agreement 2024"
            required
          />
        </div>
        <div>
          <Label htmlFor="type">Contract Type</Label>
          <Select value={type} onValueChange={setType}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="service">Service Agreement</SelectItem>
              <SelectItem value="supply">Supply Contract</SelectItem>
              <SelectItem value="maintenance">Maintenance Contract</SelectItem>
              <SelectItem value="consulting">Consulting Agreement</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Brief description of the contract terms..."
          rows={3}
          required
        />
      </div>
      <div className="grid grid-cols-3 gap-4">
        <div>
          <Label htmlFor="value">Contract Value ($)</Label>
          <Input
            id="value"
            type="number"
            step="0.01"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="0.00"
            required
          />
        </div>
        <div>
          <Label htmlFor="startDate">Start Date</Label>
          <Input
            id="startDate"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            required
          />
        </div>
        <div>
          <Label htmlFor="endDate">End Date</Label>
          <Input
            id="endDate"
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            required
          />
        </div>
      </div>
      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? 'Creating...' : 'Create Contract'}
      </Button>
    </form>
  );
}

// Vendor Management Component
function VendorManagementComponent() {
  const [vendors, setVendors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    fetchVendors();
  }, []);

  const fetchVendors = async () => {
    try {
      const response = await fetch('/api/vendor-portal/vendors');
      if (response.ok) {
        const data = await response.json();
        setVendors(data.vendors || []);
      }
    } catch (error) {
      console.error('Error fetching vendors:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredVendors = vendors.filter(vendor => {
    const matchesSearch = vendor.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = statusFilter === 'all' || vendor.status === statusFilter;
    return matchesSearch && matchesFilter;
  });

  if (loading) {
    return <div className="text-center py-8">Loading vendors...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-4">
        <div className="flex-1">
          <Input
            placeholder="Search vendors..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Add Vendor
        </Button>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Vendor Name</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Contract Value</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredVendors.length > 0 ? (
              filteredVendors.map((vendor, index) => (
                <TableRow key={index}>
                  <TableCell className="font-medium">{vendor.name}</TableCell>
                  <TableCell>{vendor.type || 'General'}</TableCell>
                  <TableCell>
                    <Badge variant={vendor.status === 'active' ? 'default' : 'secondary'}>
                      {vendor.status}
                    </Badge>
                  </TableCell>
                  <TableCell>${(vendor.contractValue || 0).toLocaleString()}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8">
                  No vendors found matching your criteria
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
