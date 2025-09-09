'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
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
  Eye,
  Edit,
  Plus,
  Trash2,
  Save,
  AlertTriangle,
  CheckCircle,
  Clock,
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
  PERMISSION_TEMPLATES,
  PermissionTemplate
} from '@/lib/types/permissions';

interface VendorPermissionManagerProps {
  vendorId: string;
  vendorName: string;
  currentPermissions?: VendorPermissions;
  onPermissionsUpdated?: (permissions: VendorPermissions) => void;
}

const RESOURCE_CONFIG: Record<PermissionResource, {
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  dependsOn?: PermissionResource[];
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
    dependsOn: ['profile']
  },
  notifications: {
    label: 'Notifications',
    description: 'Receive system notifications',
    icon: Bell,
    dependsOn: ['profile']
  },
  reports: {
    label: 'Reports',
    description: 'Generate and view reports',
    icon: BarChart3,
    dependsOn: ['invoices']
  },
  documents: {
    label: 'Documents',
    description: 'Upload and manage documents',
    icon: FolderOpen,
    dependsOn: ['profile']
  }
};

const ACTION_CONFIG: Record<PermissionAction, {
  label: string;
  description: string;
  color: string;
}> = {
  read: {
    label: 'View',
    description: 'Can view and access information',
    color: 'bg-blue-100 text-blue-800'
  },
  create: {
    label: 'Create',
    description: 'Can create new items',
    color: 'bg-green-100 text-green-800'
  },
  edit: {
    label: 'Edit',
    description: 'Can modify existing items',
    color: 'bg-yellow-100 text-yellow-800'
  },
  delete: {
    label: 'Delete',
    description: 'Can remove items',
    color: 'bg-red-100 text-red-800'
  }
};

export function VendorPermissionManager({
  vendorId,
  vendorName,
  currentPermissions,
  onPermissionsUpdated
}: VendorPermissionManagerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [customPermissions, setCustomPermissions] = useState<Record<PermissionResource, PermissionAction[]>>({
    invoices: [],
    contracts: [],
    profile: [],
    company_info: [],
    messages: [],
    notifications: [],
    reports: [],
    documents: []
  });
  const [notes, setNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (currentPermissions) {
      // Load current permissions into state
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

      currentPermissions.permissions.forEach(permission => {
        permissionMap[permission.resource] = permission.actions;
      });

      setCustomPermissions(permissionMap);
      setNotes(currentPermissions.notes || '');
    }
  }, [currentPermissions]);

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
        // Add the action if not already present
        if (!newPermissions[resource].includes(action)) {
          newPermissions[resource] = [...newPermissions[resource], action];
        }
        
        // Auto-add read permission if any other action is enabled
        if (action !== 'read' && !newPermissions[resource].includes('read')) {
          newPermissions[resource] = ['read', ...newPermissions[resource]];
        }
      } else {
        // Remove the action
        newPermissions[resource] = newPermissions[resource].filter(a => a !== action);
        
        // If removing read permission, remove all other actions too
        if (action === 'read') {
          newPermissions[resource] = [];
        }
      }

      return newPermissions;
    });
  };

  const validateAndSavePermissions = async () => {
    // Convert to Permission array
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
          vendorId,
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

  const getPermissionSummary = () => {
    const totalResources = Object.keys(customPermissions).length;
    const enabledResources = Object.values(customPermissions).filter(actions => actions.length > 0).length;
    const totalActions = Object.values(customPermissions).flat().length;
    
    return { totalResources, enabledResources, totalActions };
  };

  const summary = getPermissionSummary();

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="flex items-center gap-2">
          <Shield className="h-4 w-4" />
          Manage Permissions
        </Button>
      </DialogTrigger>
      
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Vendor Permissions: {vendorName}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Permission Templates */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Quick Setup</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Permission Template</Label>
                <Select value={selectedTemplate} onValueChange={handleTemplateSelect}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a permission template" />
                  </SelectTrigger>
                  <SelectContent>
                    {PERMISSION_TEMPLATES.map(template => (
                      <SelectItem key={template.id} value={template.id}>
                        <div className="flex flex-col">
                          <span className="font-medium">{template.name}</span>
                          <span className="text-xs text-muted-foreground">{template.description}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
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
                      <p className="text-xs text-muted-foreground mb-3">{template.description}</p>
                      <div className="space-y-1">
                        {template.permissions.slice(0, 3).map((permission, index) => (
                          <div key={index} className="text-xs flex items-center gap-1">
                            <div className="w-1 h-1 bg-primary rounded-full" />
                            <span>{RESOURCE_CONFIG[permission.resource].label}</span>
                            <span className="text-muted-foreground">
                              ({permission.actions.join(', ')})
                            </span>
                          </div>
                        ))}
                        {template.permissions.length > 3 && (
                          <div className="text-xs text-muted-foreground">
                            +{template.permissions.length - 3} more...
                          </div>
                        )}
                      </div>
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
                      <div className="flex items-center gap-2">
                        {resourceActions.length > 0 && (
                          <Badge variant="outline" className="text-xs">
                            {resourceActions.length} permission{resourceActions.length > 1 ? 's' : ''}
                          </Badge>
                        )}
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 ml-8">
                      {Object.entries(ACTION_CONFIG).map(([action, actionConfig]) => {
                        const isEnabled = resourceActions.includes(action as PermissionAction);
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
                                  action as PermissionAction, 
                                  checked
                                )
                              }
                            />
                            <Label 
                              htmlFor={`${resource}-${action}`}
                              className={`text-sm ${!canEnable && !isReadAction ? 'text-muted-foreground' : ''}`}
                            >
                              {actionConfig.label}
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
                    
                    <Separator />
                  </div>
                );
              })}
            </CardContent>
          </Card>

          {/* Permission Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Permission Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">{summary.enabledResources}</div>
                  <div className="text-sm text-muted-foreground">Resources Enabled</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{summary.totalActions}</div>
                  <div className="text-sm text-muted-foreground">Total Permissions</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {summary.enabledResources > 0 ? 'Active' : 'Inactive'}
                  </div>
                  <div className="text-sm text-muted-foreground">Access Status</div>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Notes (Optional)</Label>
                <Textarea
                  placeholder="Add notes about these permission settings..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex justify-between items-center pt-4 border-t">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              {summary.enabledResources === 0 ? (
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
                onClick={validateAndSavePermissions}
                disabled={isSaving || summary.enabledResources === 0}
              >
                {isSaving ? (
                  <>
                    <Clock className="h-4 w-4 mr-2 animate-spin" />
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