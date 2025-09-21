'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Shield, 
  Globe, 
  User, 
  Settings, 
  Eye, 
  Upload, 
  Edit, 
  FileText, 
  CheckCircle,
  AlertCircle,
  Clock,
  Mail,
  Download,
  CreditCard,
  MessageSquare,
  Loader2
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { Vendor } from '@/lib/types';

interface VendorPortalManagementProps {
  vendor: Vendor;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate?: (vendor: Vendor) => void;
}

interface PortalAccess {
  enabled: boolean;
  expired?: boolean;
  expiresAt?: string;
  features: string[];
  mfaRequired: boolean;
  sessionTimeout: number;
  lastLogin?: string;
}

const AVAILABLE_FEATURES = [
  { 
    id: 'view_invoices', 
    label: 'View Invoices', 
    icon: Eye, 
    description: 'View invoice history and status',
    category: 'invoice',
    accessLevels: ['read']
  },
  { 
    id: 'download_invoices', 
    label: 'Download Invoices', 
    icon: Download, 
    description: 'Download invoice documents',
    category: 'invoice',
    accessLevels: ['read']
  },
  { 
    id: 'upload_invoices', 
    label: 'Upload Invoices', 
    icon: Upload, 
    description: 'Submit new invoices (requires company approval)',
    category: 'invoice',
    accessLevels: ['create']
  },
  { 
    id: 'edit_profile', 
    label: 'Edit Profile', 
    icon: Edit, 
    description: 'Update company information (requires company approval)',
    category: 'profile',
    accessLevels: ['edit']
  },
  { 
    id: 'view_contracts', 
    label: 'View Contracts', 
    icon: FileText, 
    description: 'Access contract documents',
    category: 'contract',
    accessLevels: ['read']
  },
  { 
    id: 'create_contracts', 
    label: 'Create Contracts', 
    icon: CheckCircle, 
    description: 'Draft new contracts (requires company approval)',
    category: 'contract',
    accessLevels: ['create']
  },
  { 
    id: 'manage_vendors', 
    label: 'Manage Vendors', 
    icon: User, 
    description: 'Add and manage vendor relationships (requires company approval)',
    category: 'vendor',
    accessLevels: ['edit', 'create']
  },
  { 
    id: 'upload_documents', 
    label: 'Upload Documents', 
    icon: Upload, 
    description: 'Upload various documents',
    category: 'document',
    accessLevels: ['create']
  },
];

export function VendorPortalManagement({ vendor, open, onOpenChange, onUpdate }: VendorPortalManagementProps) {
  const [portalAccess, setPortalAccess] = useState<PortalAccess>({
    enabled: false,
    expired: false,
    features: [
      'view_invoices', 
      'download_invoices',
      'upload_invoices',
      'edit_profile', 
      'view_contracts',
      'create_contracts',
      'manage_vendors',
      'upload_documents'
    ],
    mfaRequired: false,
    sessionTimeout: 480, // 8 hours in minutes
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [isSendingCredentials, setIsSendingCredentials] = useState(false);
  const { toast } = useToast();

  // Load portal access status when dialog opens
  useEffect(() => {
    if (open && vendor.id) {
      checkPortalAccess();
    }
  }, [open, vendor.id]);

  // Check current portal access status
  const checkPortalAccess = async () => {
    setIsChecking(true);
    try {
      console.log('Checking portal access for vendor:', vendor.id);
      const response = await fetch(`/api/admin/vendor-portal-access?vendorId=${vendor.id}`);
      console.log('Response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Portal access data received:', data);
        setPortalAccess(data);
      } else {
        const errorData = await response.text();
        console.error('Failed to fetch portal access:', response.status, errorData);
        // Don't close the modal on error, just show the default state
      }
    } catch (error) {
      console.error('Error checking portal access:', error);
      // Don't close the modal on error
    } finally {
      setIsChecking(false);
    }
  };

  // Enable/Disable portal access
  const togglePortalAccess = async (enabled: boolean) => {
    setIsLoading(true);
    try {
      if (enabled) {
        // Enable access
        const response = await fetch('/api/admin/vendor-portal-access', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            vendorId: vendor.id,
            features: portalAccess.features,
            mfaRequired: portalAccess.mfaRequired,
            sessionTimeout: portalAccess.sessionTimeout,
          }),
        });

        if (response.ok) {
          setPortalAccess(prev => ({ ...prev, enabled: true }));
          toast({
            title: 'Portal Access Enabled',
            description: `${vendor.name} now has access to the vendor portal.`,
          });
        } else {
          throw new Error('Failed to enable portal access');
        }
      } else {
        // Disable access
        const response = await fetch(`/api/admin/vendor-portal-access?vendorId=${vendor.id}`, {
          method: 'DELETE',
        });

        if (response.ok) {
          setPortalAccess(prev => ({ ...prev, enabled: false }));
          toast({
            title: 'Portal Access Disabled',
            description: `${vendor.name}'s portal access has been revoked.`,
          });
        } else {
          throw new Error('Failed to disable portal access');
        }
      }
    } catch (error) {
      console.error('Error toggling portal access:', error);
      toast({
        title: 'Error',
        description: 'Failed to update portal access. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Update feature permissions
  const updateFeatures = async () => {
    if (!portalAccess.enabled) return;

    setIsLoading(true);
    try {
      const response = await fetch('/api/admin/vendor-portal-access', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vendorId: vendor.id,
          features: portalAccess.features,
          mfaRequired: portalAccess.mfaRequired,
          sessionTimeout: portalAccess.sessionTimeout,
        }),
      });

      if (response.ok) {
        toast({
          title: 'Settings Updated',
          description: 'Portal access settings have been updated successfully.',
        });
      } else {
        throw new Error('Failed to update settings');
      }
    } catch (error) {
      console.error('Error updating features:', error);
      toast({
        title: 'Error',
        description: 'Failed to update settings. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Send login credentials to vendor via email
  const sendLoginCredentials = async () => {
    setIsSendingCredentials(true);
    try {
      const response = await fetch('/api/admin/send-vendor-credentials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vendorId: vendor.id,
          vendorEmail: vendor.email,
          vendorName: vendor.name,
        }),
      });

      if (response.ok) {
        toast({
          title: 'Credentials Sent',
          description: `Login credentials have been sent to ${vendor.email}`,
        });
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to send credentials');
      }
    } catch (error) {
      console.error('Error sending credentials:', error);
      toast({
        title: 'Error',
        description: 'Failed to send credentials. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSendingCredentials(false);
    }
  };

  // Handle feature toggle
  const toggleFeature = (featureId: string, checked: boolean) => {
    setPortalAccess(prev => ({
      ...prev,
      features: checked 
        ? [...prev.features, featureId]
        : prev.features.filter(f => f !== featureId)
    }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Vendor Portal Management
          </DialogTitle>
          <DialogDescription>
            Manage {vendor.name}'s access to the vendor self-service portal
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Portal Status Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Portal Access Status
                </span>
                <Badge variant={
                  portalAccess.expired ? 'destructive' : 
                  portalAccess.enabled ? 'default' : 'secondary'
                }>
                  {isChecking ? (
                    <span className="flex items-center gap-1">
                      <Loader2 className="h-3 w-3 animate-spin" />
                      Checking...
                    </span>
                  ) : portalAccess.expired ? 'Expired' : (portalAccess.enabled ? 'Enabled' : 'Disabled')}
                </Badge>
              </CardTitle>
              <CardDescription>
                Control whether this vendor can access the self-service portal
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label htmlFor="portal-access">Enable Portal Access</Label>
                  <p className="text-sm text-muted-foreground">
                    {portalAccess.expired 
                      ? `Access expired on ${portalAccess.expiresAt ? new Date(portalAccess.expiresAt).toLocaleDateString() : 'Unknown date'}. Toggle to re-grant access.`
                      : `Grant ${vendor.name} access to the vendor portal`
                    }
                  </p>
                </div>
                <Switch
                  id="portal-access"
                  checked={portalAccess.enabled && !portalAccess.expired}
                  onCheckedChange={togglePortalAccess}
                  disabled={isLoading}
                />
              </div>

              {portalAccess.enabled && portalAccess.lastLogin && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  Last login: {new Date(portalAccess.lastLogin).toLocaleString()}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Features Card */}
          {(portalAccess.enabled || portalAccess.expired) && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Portal Features
                </CardTitle>
                <CardDescription>
                  {portalAccess.expired 
                    ? "Features that were available before expiration. Re-enable access to restore functionality."
                    : "Select which features this vendor can access in the portal"
                  }
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 gap-4">
                  {AVAILABLE_FEATURES.map((feature) => {
                    const Icon = feature.icon;
                    const accessLevelText = feature.accessLevels.join(', ');
                    const requiresApproval = feature.accessLevels.includes('create') || feature.accessLevels.includes('edit');
                    
                    return (
                      <div key={feature.id} className="flex items-start space-x-3 p-4 border rounded-lg hover:bg-muted/50">
                        <Checkbox
                          id={feature.id}
                          checked={portalAccess.features.includes(feature.id)}
                          onCheckedChange={(checked) => toggleFeature(feature.id, checked as boolean)}
                          disabled={portalAccess.expired}
                        />
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Icon className="h-4 w-4 text-muted-foreground" />
                              <Label htmlFor={feature.id} className="font-medium">
                                {feature.label}
                              </Label>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="text-xs">
                                {feature.category}
                              </Badge>
                              <Badge variant={requiresApproval ? 'secondary' : 'default'} className="text-xs">
                                {accessLevelText}
                              </Badge>
                            </div>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {feature.description}
                          </p>
                          {requiresApproval && (
                            <div className="flex items-center gap-1 text-xs text-amber-600">
                              <AlertCircle className="h-3 w-3" />
                              <span>Changes require company approval</span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Approval Workflow Information */}
          {(portalAccess.enabled || portalAccess.expired) && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5" />
                  Approval Workflow
                </CardTitle>
                <CardDescription>
                  How vendor changes are managed and approved
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-3 border rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="default" className="text-xs">Read</Badge>
                      <span className="font-medium text-sm">View Only</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Vendor can view existing data without making changes
                    </p>
                  </div>
                  <div className="p-3 border rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="secondary" className="text-xs">Edit</Badge>
                      <span className="font-medium text-sm">Requires Approval</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Vendor can modify existing data. Changes need company approval before going live
                    </p>
                  </div>
                  <div className="p-3 border rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="secondary" className="text-xs">Create</Badge>
                      <span className="font-medium text-sm">Requires Approval</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Vendor can create new records. All new items need company approval
                    </p>
                  </div>
                </div>
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-sm">
                    <strong>Note:</strong> All vendor-initiated changes (edits and creates) will appear in your approval queue. 
                    You can review, approve, or reject these changes before they become active in the system.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Security Settings Card */}
          {(portalAccess.enabled || portalAccess.expired) && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Security Settings
                </CardTitle>
                <CardDescription>
                  Configure security requirements for this vendor
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="session-timeout">Session Timeout (minutes)</Label>
                    <Select
                      value={portalAccess.sessionTimeout.toString()}
                      onValueChange={(value) => setPortalAccess(prev => ({ ...prev, sessionTimeout: parseInt(value) }))}
                      disabled={portalAccess.expired}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="60">1 hour</SelectItem>
                        <SelectItem value="240">4 hours</SelectItem>
                        <SelectItem value="480">8 hours</SelectItem>
                        <SelectItem value="720">12 hours</SelectItem>
                        <SelectItem value="1440">24 hours</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="mfa-required"
                        checked={portalAccess.mfaRequired}
                        onCheckedChange={(checked) => setPortalAccess(prev => ({ ...prev, mfaRequired: checked }))}
                        disabled={portalAccess.expired}
                      />
                      <Label htmlFor="mfa-required">Require Multi-Factor Authentication</Label>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Require additional authentication for enhanced security
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Portal Access Instructions */}
          {(portalAccess.enabled || portalAccess.expired) && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Vendor Instructions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="space-y-2 text-sm">
                    <p><strong>Portal URL:</strong> {(typeof window !== 'undefined' ? window.location.origin : '')}/vendor-portal</p>
                    <p><strong>Login:</strong> Vendor will receive email and password via email</p>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button 
                      onClick={sendLoginCredentials}
                      disabled={isLoading || isSendingCredentials || portalAccess.expired}
                      size="sm"
                      variant="outline"
                      className="flex items-center gap-2"
                    >
                      <Mail className="h-4 w-4" />
                      {isSendingCredentials ? 'Sending...' : portalAccess.expired ? 'Enable Access First' : 'Send Login Credentials'}
                    </Button>
                  </div>
                  
                  <p className="text-muted-foreground text-sm">
                    Click "Send Login Credentials" to email {vendor.name} their portal access details.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Close
            </Button>
            {(portalAccess.enabled || portalAccess.expired) && (
              <Button 
                onClick={updateFeatures} 
                disabled={isLoading || portalAccess.expired}
              >
                {isLoading ? 'Saving...' : portalAccess.expired ? 'Enable Access First' : 'Save Settings'}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
