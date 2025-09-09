'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import {
  Shield,
  Settings,
  Save,
  AlertTriangle,
  CheckCircle,
  User,
  Building2,
  FileText,
  Receipt,
  MessageSquare,
  Bell,
  BarChart3,
  FolderOpen
} from 'lucide-react';
import {
  VendorPermissions,
  Permission,
  PermissionResource,
  PermissionAction,
  PERMISSION_TEMPLATES
} from '@/lib/types/permissions';

interface VendorPermissionsDialogProps {
  vendor: {
    id: string;
    name: string;
    email: string;
  };
  currentPermissions?: VendorPermissions;
  onPermissionsUpdated?: (permissions: VendorPermissions) => void;
  trigger?: React.ReactNode;
}

const RESOURCE_CONFIG: Record<PermissionResource, {
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}> = {
  invoices: {
    label: 'Invoices',
    description: 'Manage invoice submissions and tracking',
    icon: Receipt,
  },
  contracts: {
    label: 'Contracts',
    description: 'View and manage contract information',
    icon: FileText,
  },
  profile: {
    label: 'Profile',
    description: 'Manage vendor profile and settings',
    icon: User,
  },
  company_info: {
    label: 'Company Information',
    description: 'Access company details and contacts',
    icon: Building2,
  },
  messages: {
    label: 'Messages',
    description: 'Communication with company team',
    icon: MessageSquare,
  },
  notifications: {
    label: 'Notifications',
    description: 'Receive system notifications',
    icon: Bell,
  },
  reports: {
    label: 'Reports',
    description: 'Generate and view reports',
    icon: BarChart3,
  },
  documents: {
    label: 'Documents',
    description: 'Upload and manage documents',
    icon: FolderOpen,
  }
};

export function VendorPermissionsDialog({
  vendor,
  currentPermissions,
  onPermissionsUpdated,
  trigger
}: VendorPermissionsDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [customPermissions, setCustomPermissions] = useState<Record<PermissionResource, PermissionAction[]>>({
    invoices: [],
    contracts: [],
    profile: ['read'], // Default minimum permission
    company_info: [],
    messages: [],
    notifications: [],
    reports: [],
    documents: []
  });
  const [notes, setNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  const handleTemplateSelect = (templateId: string) => {
    const template = PERMISSION_TEMPLATES.find(t => t.id === templateId);
    if (!template) return;

    const permissionMap: Record<PermissionResource, PermissionAction[]> = {
      invoices: [],
      contracts: [],
      profile: [],
      company_info: [],
      messages: [],
      notifications: [],
      reports: [],
      documents: []
    };

    template.permissions.forEach(permission => {
      permissionMap[permission.resource] = permission.actions;
    });

    setCustomPermissions(permissionMap);
    setSelectedTemplate(templateId);
  };

  const handlePermissionToggle = (resource: PermissionResource, action: PermissionAction, enabled: boolean) => {
    setCustomPermissions(prev => {
      const newPermissions = { ...prev };
      
      if (enabled) {
        if (!newPermissions[resource].includes(action)) {
          newPermissions[resource] = [...newPermissions[resource], action];
        }
        
        // Auto-add read permission if any other action is enabled
        if (action !== 'read' && !newPermissions[resource].includes('read')) {
          newPermissions[resource] = ['read', ...newPermissions[resource]];
        }
      } else {
        newPermissions[resource] = newPermissions[resource].filter(a => a !== action);
        
        // If removing read permission, remove all other actions too
        if (action === 'read') {
          newPermissions[resource] = [];
        }
      }

      return newPermissions;
    });
  };

  const savePermissions = async () => {
    const permissions: Omit<Permission, 'id'>[] = [];
    
    Object.entries(customPermissions).forEach(([resource, actions]) => {
      if (actions.length > 0) {
        permissions.push({
          resource: resource as PermissionResource,
          actions,
          description: RESOURCE_CONFIG[resource as PermissionResource].description
        });
      }
    });

    // Validate minimum permissions
    const hasMinimumAccess = permissions.some(p => p.actions.includes('read'));
    if (!hasMinimumAccess) {
      toast({
        title: 'Invalid Permissions',
        description: 'At least one read permission must be granted.',
        variant: 'destructive'
      });
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetch('/api/vendor/permissions', {
        method: currentPermissions ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vendorId: vendor.id,
          permissions,
          notes
        })
      });

      if (!response.ok) {
        throw new Error('Failed to save permissions');
      }

      const result = await response.json();
      
      toast({
        title: 'Success',
        description: 'Vendor permissions updated successfully.'
      });

      onPermissionsUpdated?.(result.permissions);
      setIsOpen(false);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save permissions. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm">
            <Shield className="h-4 w-4 mr-2" />
            Manage Permissions
          </Button>
        )}
      </DialogTrigger>
      
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Vendor Permissions: {vendor.name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Quick Templates */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Permission Templates</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {PERMISSION_TEMPLATES.map(template => (
                  <Card 
                    key={template.id} 
                    className={`cursor-pointer transition-colors ${
                      selectedTemplate === template.id ? 'border-primary bg-primary/5' : 'hover:bg-muted/50'
                    }`}
                    onClick={() => handleTemplateSelect(template.id)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Shield className="h-4 w-4" />
                        <span className="font-medium text-sm">{template.name}</span>
                        {template.isDefault && (
                          <Badge variant="secondary" className="text-xs">Default</Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">{template.description}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Custom Permissions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Custom Permissions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {Object.entries(RESOURCE_CONFIG).map(([resource, config]) => {
                const Icon = config.icon;
                const resourceActions = customPermissions[resource as PermissionResource];
                const hasRead = resourceActions.includes('read');
                
                return (
                  <div key={resource} className="space-y-4">
                    <div className="flex items-center gap-3">
                      <Icon className="h-5 w-5 text-muted-foreground" />
                      <div className="flex-1">
                        <h4 className="font-medium">{config.label}</h4>
                        <p className="text-sm text-muted-foreground">{config.description}</p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 ml-8">
                      {(['read', 'create', 'edit', 'delete'] as PermissionAction[]).map(action => {
                        const isEnabled = resourceActions.includes(action);
                        const isReadAction = action === 'read';
                        const canEnable = isReadAction || hasRead;
                        
                        return (
                          <div key={action} className="flex items-center space-x-2">
                            <Switch
                              id={`${resource}-${action}`}
                              checked={isEnabled}
                              disabled={!canEnable && !isReadAction}
                              onCheckedChange={(checked) => 
                                handlePermissionToggle(
                                  resource as PermissionResource, 
                                  action, 
                                  checked
                                )
                              }
                            />
                            <Label 
                              htmlFor={`${resource}-${action}`}
                              className={`text-sm ${!canEnable && !isReadAction ? 'text-muted-foreground' : ''}`}
                            >
                              {action.charAt(0).toUpperCase() + action.slice(1)}
                            </Label>
                          </div>
                        );
                      })}
                    </div>
                    
                    {!hasRead && resourceActions.some(a => a !== 'read') && (
                      <div className="ml-8 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <div className="flex items-center gap-2 text-yellow-800">
                          <AlertTriangle className="h-4 w-4" />
                          <span className="text-sm font-medium">Read permission required</span>
                        </div>
                        <p className="text-xs text-yellow-700 mt-1">
                          Read access will be automatically granted to enable other actions.
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </CardContent>
          </Card>

          {/* Notes */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder="Add notes about these permission settings..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
              />
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex justify-between items-center pt-4 border-t">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              {Object.values(customPermissions).every(actions => actions.length === 0) ? (
                <>
                  <AlertTriangle className="h-4 w-4 text-yellow-500" />
                  <span>No permissions granted - vendor will have no access</span>
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>Valid permission configuration</span>
                </>
              )}
            </div>
            
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setIsOpen(false)}>
                Cancel
              </Button>
              <Button 
                onClick={savePermissions}
                disabled={isSaving}
              >
                {isSaving ? (
                  <>
                    <Settings className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save Permissions
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}