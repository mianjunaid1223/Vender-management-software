'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { VendorInvitation, VendorAuditLog } from '@/lib/vendor-auth';
import { Vendor, Contract, Invoice } from '@/lib/types';
import { 
  Building, 
  FileText, 
  Receipt, 
  Activity, 
  User, 
  Edit3, 
  Eye,
  Calendar,
  DollarSign,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import { VendorProfileForm } from './vendor-profile-form';
import { VendorContractsView } from './vendor-contracts-view';
import { VendorInvoicesView } from './vendor-invoices-view';

interface VendorPortalData {
  vendor: Vendor;
  contracts: Contract[];
  invoices: Invoice[];
  recentActivity: VendorAuditLog[];
}

interface VendorPortalClientProps {
  invitation: VendorInvitation;
  portalData: VendorPortalData;
}

export function VendorPortalClient({ invitation, portalData }: VendorPortalClientProps) {
  const [activeTab, setActiveTab] = useState('overview');
  const [vendorData, setVendorData] = useState(portalData.vendor);

  // Permission checks
  const canEdit = (resource: string) => {
    const permission = invitation.permissions.find(p => p.resource === resource);
    return permission?.actions.includes('edit') || false;
  };

  const canView = (resource: string) => {
    const permission = invitation.permissions.find(p => p.resource === resource);
    return permission?.actions.includes('view') || false;
  };

  // Calculate overview stats
  const stats = {
    totalContracts: portalData.contracts.length,
    activeContracts: portalData.contracts.filter(c => c.status === 'Active').length,
    totalInvoices: portalData.invoices.length,
    paidInvoices: portalData.invoices.filter(i => i.status === 'Paid').length,
    pendingInvoices: portalData.invoices.filter(i => ['Pending', 'Unpaid'].includes(i.status)).length,
    overdueInvoices: portalData.invoices.filter(i => i.status === 'Overdue').length,
    totalValue: portalData.invoices.reduce((sum, inv) => sum + (inv.totalAmount || 0), 0)
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                  <Building className="h-6 w-6 text-white" />
                </div>
              </div>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">Vendor Portal</h1>
                <p className="text-sm text-gray-500">Welcome, {vendorData.name}</p>
              </div>
            </div>
            <Badge variant="outline" className="text-green-600 border-green-600">
              Active Partnership
            </Badge>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="profile" disabled={!canView('profile')}>Profile</TabsTrigger>
            <TabsTrigger value="contracts" disabled={!canView('contracts')}>Contracts</TabsTrigger>
            <TabsTrigger value="invoices" disabled={!canView('invoices')}>Invoices</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Active Contracts</CardTitle>
                  <FileText className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.activeContracts}</div>
                  <p className="text-xs text-muted-foreground">
                    of {stats.totalContracts} total
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Invoices</CardTitle>
                  <Receipt className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalInvoices}</div>
                  <p className="text-xs text-muted-foreground">
                    {stats.paidInvoices} paid, {stats.pendingInvoices} pending
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Value</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">${stats.totalValue.toLocaleString()}</div>
                  <p className="text-xs text-muted-foreground">
                    Across all invoices
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Status</CardTitle>
                  {stats.overdueInvoices > 0 ? (
                    <AlertCircle className="h-4 w-4 text-red-500" />
                  ) : (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  )}
                </CardHeader>
                <CardContent>
                  {stats.overdueInvoices > 0 ? (
                    <div className="text-2xl font-bold text-red-600">{stats.overdueInvoices}</div>
                  ) : (
                    <div className="text-2xl font-bold text-green-600">Good</div>
                  )}
                  <p className="text-xs text-muted-foreground">
                    {stats.overdueInvoices > 0 ? 'overdue invoices' : 'no issues'}
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Activity className="h-5 w-5 mr-2" />
                  Recent Activity
                </CardTitle>
                <CardDescription>Your recent actions and updates</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {portalData.recentActivity.length > 0 ? (
                    portalData.recentActivity.slice(0, 5).map((activity, index) => (
                      <div key={index} className="flex items-center space-x-4 text-sm">
                        <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                        <div className="flex-1">
                          <span className="font-medium">{activity.action.replace('_', ' ')}</span>
                          <span className="text-muted-foreground ml-2">on {activity.resource}</span>
                        </div>
                        <div className="text-muted-foreground text-xs">
                          {new Date(activity.timestamp).toLocaleDateString()}
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-muted-foreground">No recent activity</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Profile Tab */}
          <TabsContent value="profile">
            <VendorProfileForm 
              vendor={vendorData} 
              onUpdate={setVendorData}
              canEdit={canEdit('profile')}
              invitation={invitation}
            />
          </TabsContent>

          {/* Contracts Tab */}
          <TabsContent value="contracts">
            <VendorContractsView 
              contracts={portalData.contracts}
              canView={canView('contracts')}
              canEdit={canEdit('contracts')}
              invitation={invitation}
            />
          </TabsContent>

          {/* Invoices Tab */}
          <TabsContent value="invoices">
            <VendorInvoicesView 
              invoices={portalData.invoices}
              canView={canView('invoices')}
              canEdit={canEdit('invoices')}
              invitation={invitation}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
