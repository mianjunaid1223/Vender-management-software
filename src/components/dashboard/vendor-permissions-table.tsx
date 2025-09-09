'use client';

import { useState, useEffect } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { VendorPermissionManager } from '@/components/vendor-portal/vendor-permission-manager';
import { useToast } from '@/hooks/use-toast';
import {
  MoreHorizontal,
  Shield,
  Eye,
  Edit,
  Trash2,
  Search,
  Plus,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle
} from 'lucide-react';
import { VendorPermissions } from '@/lib/types/permissions';

interface VendorWithPermissions {
  id: string;
  name: string;
  email: string;
  status: string;
  permissions?: VendorPermissions;
  hasAccess: boolean;
  lastActivity?: string;
}

interface VendorPermissionsTableProps {
  vendors: VendorWithPermissions[];
  onPermissionsUpdated?: () => void;
}

export function VendorPermissionsTable({ 
  vendors: initialVendors, 
  onPermissionsUpdated 
}: VendorPermissionsTableProps) {
  const [vendors, setVendors] = useState(initialVendors);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const filteredVendors = vendors.filter(vendor =>
    vendor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    vendor.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handlePermissionsUpdated = (vendorId: string, permissions: VendorPermissions) => {
    setVendors(prev => prev.map(vendor => 
      vendor.id === vendorId 
        ? { ...vendor, permissions, hasAccess: true }
        : vendor
    ));
    onPermissionsUpdated?.();
    toast({
      title: 'Success',
      description: 'Vendor permissions updated successfully.'
    });
  };

  const handleRevokeAccess = async (vendorId: string) => {
    try {
      const response = await fetch(`/api/vendor/permissions/${vendorId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error('Failed to revoke access');
      }

      setVendors(prev => prev.map(vendor => 
        vendor.id === vendorId 
          ? { ...vendor, permissions: undefined, hasAccess: false }
          : vendor
      ));

      toast({
        title: 'Access Revoked',
        description: 'Vendor access has been revoked successfully.'
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to revoke vendor access.',
        variant: 'destructive'
      });
    }
  };

  const getAccessStatusBadge = (vendor: VendorWithPermissions) => {
    if (!vendor.hasAccess || !vendor.permissions) {
      return <Badge variant="secondary">No Access</Badge>;
    }

    const permissionCount = vendor.permissions.permissions.length;
    const hasWriteAccess = vendor.permissions.permissions.some(p => 
      p.actions.some(action => ['create', 'edit', 'delete'].includes(action))
    );

    if (hasWriteAccess) {
      return <Badge className="bg-green-100 text-green-800">Full Access</Badge>;
    } else {
      return <Badge className="bg-blue-100 text-blue-800">Read Only</Badge>;
    }
  };

  const getPermissionSummary = (permissions?: VendorPermissions) => {
    if (!permissions) return 'No permissions';
    
    const resources = permissions.permissions.map(p => p.resource);
    const totalActions = permissions.permissions.reduce((sum, p) => sum + p.actions.length, 0);
    
    return `${resources.length} resources, ${totalActions} actions`;
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Vendor Permissions</h2>
          <p className="text-muted-foreground">
            Manage access levels and permissions for your vendors
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Vendors</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{vendors.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">With Access</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {vendors.filter(v => v.hasAccess).length}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">No Access</CardTitle>
            <XCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {vendors.filter(v => !v.hasAccess).length}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Full Access</CardTitle>
            <Shield className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {vendors.filter(v => 
                v.permissions?.permissions.some(p => 
                  p.actions.some(action => ['create', 'edit', 'delete'].includes(action))
                )
              ).length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search vendors..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>
      </div>

      {/* Vendors Table */}
      <Card>
        <CardHeader>
          <CardTitle>Vendor Access Management</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Vendor</TableHead>
                  <TableHead>Access Status</TableHead>
                  <TableHead>Permissions</TableHead>
                  <TableHead>Last Updated</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredVendors.map((vendor) => (
                  <TableRow key={vendor.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{vendor.name}</div>
                        <div className="text-sm text-muted-foreground">{vendor.email}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {getAccessStatusBadge(vendor)}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {getPermissionSummary(vendor.permissions)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {vendor.permissions?.lastUpdated 
                          ? new Date(vendor.permissions.lastUpdated).toLocaleDateString()
                          : 'Never'
                        }
                      </div>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          
                          <VendorPermissionManager
                            vendorId={vendor.id}
                            vendorName={vendor.name}
                            currentPermissions={vendor.permissions}
                            onPermissionsUpdated={(permissions) => 
                              handlePermissionsUpdated(vendor.id, permissions)
                            }
                          />
                          
                          {vendor.hasAccess && (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem 
                                onClick={() => handleRevokeAccess(vendor.id)}
                                className="text-red-600"
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Revoke Access
                              </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            
            {filteredVendors.length === 0 && (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No vendors found matching your criteria.</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}