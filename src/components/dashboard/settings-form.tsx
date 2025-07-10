"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { User } from "@/lib/types";
import { updateUser } from "@/lib/data";

interface SettingsFormProps {
  user: User;
}

export function SettingsForm({ user }: SettingsFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    name: user.name,
    email: user.email,
    businessInfo: {
      companyName: user.businessInfo?.companyName || '',
      industry: user.businessInfo?.industry || '',
      size: user.businessInfo?.size || 'Medium',
      location: user.businessInfo?.location || '',
      vendorPolicies: user.businessInfo?.vendorPolicies || '',
      priorities: user.businessInfo?.priorities || [],
      operationalFocus: user.businessInfo?.operationalFocus || '',
      complianceRequirements: user.businessInfo?.complianceRequirements || [],
    },
    preferences: {
      notifications: {
        email: user.preferences?.notifications?.email ?? true,
        inApp: user.preferences?.notifications?.inApp ?? true,
        contractRenewals: user.preferences?.notifications?.contractRenewals ?? true,
        complianceAlerts: user.preferences?.notifications?.complianceAlerts ?? true,
        invoiceApprovals: user.preferences?.notifications?.invoiceApprovals ?? true,
      },
      dashboard: {
        layout: user.preferences?.dashboard?.layout || 'detailed',
        defaultView: user.preferences?.dashboard?.defaultView || 'overview',
        kpiPreferences: user.preferences?.dashboard?.kpiPreferences || ['financial', 'compliance', 'performance'],
      },
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await updateUser(user.id, {
        name: formData.name,
        email: formData.email,
        businessInfo: formData.businessInfo,
        preferences: formData.preferences,
      });

      toast({
        title: "Settings updated",
        description: "Your settings have been successfully updated.",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update settings. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePriorityChange = (priority: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      businessInfo: {
        ...prev.businessInfo,
        priorities: checked 
          ? [...prev.businessInfo.priorities, priority]
          : prev.businessInfo.priorities.filter(p => p !== priority)
      }
    }));
  };

  const handleComplianceChange = (requirement: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      businessInfo: {
        ...prev.businessInfo,
        complianceRequirements: checked 
          ? [...prev.businessInfo.complianceRequirements, requirement]
          : prev.businessInfo.complianceRequirements.filter(r => r !== requirement)
      }
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2">
        {/* User Profile */}
        <Card>
          <CardHeader>
            <CardTitle>Profile Information</CardTitle>
            <CardDescription>Update your personal details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                required
              />
            </div>
          </CardContent>
        </Card>

        {/* Business Information */}
        <Card>
          <CardHeader>
            <CardTitle>Business Information</CardTitle>
            <CardDescription>Help AI understand your business context</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="companyName">Company Name</Label>
              <Input
                id="companyName"
                value={formData.businessInfo.companyName}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  businessInfo: { ...prev.businessInfo, companyName: e.target.value }
                }))}
                placeholder="Your company name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="industry">Industry</Label>
              <Input
                id="industry"
                value={formData.businessInfo.industry}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  businessInfo: { ...prev.businessInfo, industry: e.target.value }
                }))}
                placeholder="e.g., Technology, Healthcare, Manufacturing"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="size">Company Size</Label>
              <Select 
                value={formData.businessInfo.size} 
                onValueChange={(value) => setFormData(prev => ({
                  ...prev,
                  businessInfo: { ...prev.businessInfo, size: value as 'Small' | 'Medium' | 'Large' }
                }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Small">Small (1-50 employees)</SelectItem>
                  <SelectItem value="Medium">Medium (51-200 employees)</SelectItem>
                  <SelectItem value="Large">Large (200+ employees)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                value={formData.businessInfo.location}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  businessInfo: { ...prev.businessInfo, location: e.target.value }
                }))}
                placeholder="City, State/Country"
              />
            </div>
          </CardContent>
        </Card>

        {/* Vendor Policies */}
        <Card>
          <CardHeader>
            <CardTitle>Vendor Policies</CardTitle>
            <CardDescription>Define your vendor management policies</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="vendorPolicies">Vendor Policies</Label>
              <Textarea
                id="vendorPolicies"
                value={formData.businessInfo.vendorPolicies}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  businessInfo: { ...prev.businessInfo, vendorPolicies: e.target.value }
                }))}
                placeholder="Describe your vendor selection criteria, approval processes, and policies..."
                rows={4}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="operationalFocus">Operational Focus</Label>
              <Textarea
                id="operationalFocus"
                value={formData.businessInfo.operationalFocus}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  businessInfo: { ...prev.businessInfo, operationalFocus: e.target.value }
                }))}
                placeholder="What are your main operational priorities and focus areas?"
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {/* Business Priorities */}
        <Card>
          <CardHeader>
            <CardTitle>Business Priorities</CardTitle>
            <CardDescription>Select your key business priorities</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              {[
                'Cost Reduction',
                'Quality Improvement',
                'Risk Management',
                'Compliance',
                'Innovation',
                'Sustainability',
                'Speed to Market',
                'Customer Satisfaction'
              ].map((priority) => (
                <div key={priority} className="flex items-center space-x-2">
                  <Checkbox
                    id={priority}
                    checked={formData.businessInfo.priorities.includes(priority)}
                    onCheckedChange={(checked) => handlePriorityChange(priority, checked as boolean)}
                  />
                  <Label htmlFor={priority}>{priority}</Label>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Compliance Requirements */}
        <Card>
          <CardHeader>
            <CardTitle>Compliance Requirements</CardTitle>
            <CardDescription>Select applicable compliance standards</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              {[
                'SOX (Sarbanes-Oxley)',
                'GDPR',
                'HIPAA',
                'PCI DSS',
                'ISO 27001',
                'SOC 2',
                'Industry-specific regulations',
                'Custom compliance requirements'
              ].map((requirement) => (
                <div key={requirement} className="flex items-center space-x-2">
                  <Checkbox
                    id={requirement}
                    checked={formData.businessInfo.complianceRequirements.includes(requirement)}
                    onCheckedChange={(checked) => handleComplianceChange(requirement, checked as boolean)}
                  />
                  <Label htmlFor={requirement}>{requirement}</Label>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Notification Preferences */}
        <Card>
          <CardHeader>
            <CardTitle>Notification Preferences</CardTitle>
            <CardDescription>Choose how you want to receive notifications</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="email-notifications"
                  checked={formData.preferences.notifications.email}
                  onCheckedChange={(checked) => setFormData(prev => ({
                    ...prev,
                    preferences: {
                      ...prev.preferences,
                      notifications: {
                        ...prev.preferences.notifications,
                        email: checked as boolean
                      }
                    }
                  }))}
                />
                <Label htmlFor="email-notifications">Email notifications</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="in-app-notifications"
                  checked={formData.preferences.notifications.inApp}
                  onCheckedChange={(checked) => setFormData(prev => ({
                    ...prev,
                    preferences: {
                      ...prev.preferences,
                      notifications: {
                        ...prev.preferences.notifications,
                        inApp: checked as boolean
                      }
                    }
                  }))}
                />
                <Label htmlFor="in-app-notifications">In-app notifications</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="contract-renewals"
                  checked={formData.preferences.notifications.contractRenewals}
                  onCheckedChange={(checked) => setFormData(prev => ({
                    ...prev,
                    preferences: {
                      ...prev.preferences,
                      notifications: {
                        ...prev.preferences.notifications,
                        contractRenewals: checked as boolean
                      }
                    }
                  }))}
                />
                <Label htmlFor="contract-renewals">Contract renewal alerts</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="compliance-alerts"
                  checked={formData.preferences.notifications.complianceAlerts}
                  onCheckedChange={(checked) => setFormData(prev => ({
                    ...prev,
                    preferences: {
                      ...prev.preferences,
                      notifications: {
                        ...prev.preferences.notifications,
                        complianceAlerts: checked as boolean
                      }
                    }
                  }))}
                />
                <Label htmlFor="compliance-alerts">Compliance alerts</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="invoice-approvals"
                  checked={formData.preferences.notifications.invoiceApprovals}
                  onCheckedChange={(checked) => setFormData(prev => ({
                    ...prev,
                    preferences: {
                      ...prev.preferences,
                      notifications: {
                        ...prev.preferences.notifications,
                        invoiceApprovals: checked as boolean
                      }
                    }
                  }))}
                />
                <Label htmlFor="invoice-approvals">Invoice approval requests</Label>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-end">
        <Button type="submit" disabled={isLoading}>
          {isLoading ? "Saving..." : "Save Settings"}
        </Button>
      </div>
    </form>
  );
}
