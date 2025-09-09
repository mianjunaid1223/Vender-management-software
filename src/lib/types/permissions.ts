// Permission system types for vendor portal access control

export type PermissionAction = 'read' | 'create' | 'edit' | 'delete';

export type PermissionResource = 
  | 'invoices' 
  | 'contracts' 
  | 'profile' 
  | 'company_info' 
  | 'messages' 
  | 'notifications'
  | 'reports'
  | 'documents';

export type Permission = {
  id: string;
  resource: PermissionResource;
  actions: PermissionAction[];
  conditions?: PermissionCondition[];
  description?: string;
};

export type PermissionCondition = {
  field: string;
  operator: 'equals' | 'not_equals' | 'in' | 'not_in' | 'greater_than' | 'less_than';
  value: any;
};

export type VendorPermissions = {
  id: string;
  vendorId: string;
  companyId: string;
  permissions: Permission[];
  isActive: boolean;
  grantedBy: string;
  grantedAt: string;
  expiresAt?: string;
  lastUpdated: string;
  notes?: string;
};

export type PermissionTemplate = {
  id: string;
  name: string;
  description: string;
  permissions: Omit<Permission, 'id'>[];
  isDefault?: boolean;
};

// Pre-defined permission templates
export const PERMISSION_TEMPLATES: PermissionTemplate[] = [
  {
    id: 'basic_vendor',
    name: 'Basic Vendor Access',
    description: 'Read-only access to invoices and profile management',
    permissions: [
      {
        resource: 'invoices',
        actions: ['read'],
        description: 'View own invoices'
      },
      {
        resource: 'profile',
        actions: ['read', 'edit'],
        description: 'Manage own profile'
      },
      {
        resource: 'company_info',
        actions: ['read'],
        description: 'View company information'
      }
    ],
    isDefault: true
  },
  {
    id: 'full_vendor',
    name: 'Full Vendor Access',
    description: 'Complete access to all vendor features',
    permissions: [
      {
        resource: 'invoices',
        actions: ['read', 'create', 'edit'],
        description: 'Full invoice management'
      },
      {
        resource: 'contracts',
        actions: ['read'],
        description: 'View contracts'
      },
      {
        resource: 'profile',
        actions: ['read', 'edit'],
        description: 'Manage own profile'
      },
      {
        resource: 'company_info',
        actions: ['read'],
        description: 'View company information'
      },
      {
        resource: 'messages',
        actions: ['read', 'create'],
        description: 'Send and receive messages'
      },
      {
        resource: 'documents',
        actions: ['read', 'create'],
        description: 'Upload and view documents'
      }
    ]
  },
  {
    id: 'limited_vendor',
    name: 'Limited Vendor Access',
    description: 'Restricted access for new or probationary vendors',
    permissions: [
      {
        resource: 'invoices',
        actions: ['read'],
        description: 'View invoices only'
      },
      {
        resource: 'profile',
        actions: ['read'],
        description: 'View profile only'
      },
      {
        resource: 'company_info',
        actions: ['read'],
        description: 'View company information'
      }
    ]
  }
];

// Permission checking utilities
export class PermissionChecker {
  private permissions: Permission[];

  constructor(permissions: Permission[]) {
    this.permissions = permissions;
  }

  hasPermission(resource: PermissionResource, action: PermissionAction): boolean {
    const permission = this.permissions.find(p => p.resource === resource);
    return permission ? permission.actions.includes(action) : false;
  }

  canRead(resource: PermissionResource): boolean {
    return this.hasPermission(resource, 'read');
  }

  canCreate(resource: PermissionResource): boolean {
    return this.hasPermission(resource, 'create');
  }

  canEdit(resource: PermissionResource): boolean {
    return this.hasPermission(resource, 'edit');
  }

  canDelete(resource: PermissionResource): boolean {
    return this.hasPermission(resource, 'delete');
  }

  getResourcePermissions(resource: PermissionResource): PermissionAction[] {
    const permission = this.permissions.find(p => p.resource === resource);
    return permission ? permission.actions : [];
  }

  getAllowedResources(): PermissionResource[] {
    return this.permissions.map(p => p.resource);
  }

  // Check if vendor has at least one read permission (minimum requirement)
  hasMinimumAccess(): boolean {
    return this.permissions.some(p => p.actions.includes('read'));
  }

  // Get dependent permissions (if read is granted, enable related create/edit/delete)
  getDependentPermissions(resource: PermissionResource): PermissionAction[] {
    const basePermissions = this.getResourcePermissions(resource);
    
    if (!basePermissions.includes('read')) {
      return [];
    }

    // If read is granted, return all granted permissions for this resource
    return basePermissions;
  }
}