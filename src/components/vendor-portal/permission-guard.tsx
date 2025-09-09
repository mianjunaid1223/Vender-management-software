'use client';

import { ReactNode } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Lock, AlertTriangle } from 'lucide-react';
import { PermissionChecker, PermissionResource, PermissionAction } from '@/lib/types/permissions';

interface PermissionGuardProps {
  permissionChecker: PermissionChecker | null;
  resource: PermissionResource;
  action?: PermissionAction;
  children: ReactNode;
  fallback?: ReactNode;
  showMessage?: boolean;
}

export function PermissionGuard({
  permissionChecker,
  resource,
  action = 'read',
  children,
  fallback,
  showMessage = true
}: PermissionGuardProps) {
  // If no permission checker, deny access
  if (!permissionChecker) {
    if (fallback) return <>{fallback}</>;
    
    if (!showMessage) return null;
    
    return (
      <Card className="border-red-200 bg-red-50">
        <CardContent className="flex flex-col items-center justify-center py-8">
          <AlertTriangle className="h-12 w-12 text-red-400 mb-4" />
          <h3 className="text-lg font-medium text-red-800 mb-2">Access Not Configured</h3>
          <p className="text-red-600 text-center">
            Permissions have not been set up for this vendor.
          </p>
        </CardContent>
      </Card>
    );
  }

  // Check if user has the required permission
  const hasPermission = permissionChecker.hasPermission(resource, action);
  
  if (!hasPermission) {
    if (fallback) return <>{fallback}</>;
    
    if (!showMessage) return null;
    
    return (
      <Card className="border-gray-200 bg-gray-50">
        <CardContent className="flex flex-col items-center justify-center py-8">
          <Lock className="h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-600 mb-2">Access Restricted</h3>
          <p className="text-gray-500 text-center">
            You don't have permission to {action} {resource.replace('_', ' ')}.
          </p>
        </CardContent>
      </Card>
    );
  }

  return <>{children}</>;
}

// Hook for permission checking
export function usePermissionGuard(permissionChecker: PermissionChecker | null) {
  const canAccess = (resource: PermissionResource, action: PermissionAction = 'read') => {
    return permissionChecker?.hasPermission(resource, action) ?? false;
  };

  const canRead = (resource: PermissionResource) => canAccess(resource, 'read');
  const canCreate = (resource: PermissionResource) => canAccess(resource, 'create');
  const canEdit = (resource: PermissionResource) => canAccess(resource, 'edit');
  const canDelete = (resource: PermissionResource) => canAccess(resource, 'delete');

  const getResourceActions = (resource: PermissionResource) => {
    return permissionChecker?.getResourcePermissions(resource) ?? [];
  };

  const hasMinimumAccess = () => {
    return permissionChecker?.hasMinimumAccess() ?? false;
  };

  return {
    canAccess,
    canRead,
    canCreate,
    canEdit,
    canDelete,
    getResourceActions,
    hasMinimumAccess,
    permissionChecker
  };
}