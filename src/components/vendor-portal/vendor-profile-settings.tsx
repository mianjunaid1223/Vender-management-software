'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Save, User, Building2, MapPin, Phone, Mail, Globe } from 'lucide-react';

interface VendorProfile {
  _id: string;
  name: string;
  contactPerson: string;
  email: string;
  phone?: string;
  service?: string;
  taxId?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
  };
  paymentTerms?: string;
  notes?: string;
  status?: string;
}

interface VendorProfileSettingsProps {
  vendorId: string;
}

export function VendorProfileSettings({ vendorId }: VendorProfileSettingsProps) {
  const { toast } = useToast();
  const pathname = usePathname();
  const [profile, setProfile] = useState<VendorProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState<Partial<VendorProfile>>({});

  // Determine auth mode based on URL pattern
  const authMode = pathname === '/vendor-portal/dashboard' ? 'vendor' : 'company';

  useEffect(() => {
    fetchProfile();
  }, [vendorId]);

  const fetchProfile = async () => {
    try {
      let headers: Record<string, string> = {
        'Content-Type': 'application/json'
      };

      // Set authentication headers based on mode
      if (authMode === 'company') {
        headers['X-Dashboard-Auth'] = 'true';
      } else {
        // For vendor mode, get token from sessionStorage
        const token = sessionStorage.getItem('vendorToken');
        if (!token) {
          throw new Error('No vendor authentication token available');
        }
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`/api/vendor/${vendorId}/profile`, {
        method: 'GET',
        headers
      });
      
      if (response.ok) {
        const data = await response.json();
        setProfile(data.profile);
        setFormData(data.profile);
      } else if (response.status === 401) {
        throw new Error('Authentication expired. Please log in again.');
      } else {
        throw new Error('Failed to fetch profile');
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to load profile information.',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    if (field.startsWith('address.')) {
      const addressField = field.split('.')[1];
      setFormData(prev => ({
        ...prev,
        address: {
          ...prev.address,
          [addressField]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      let headers: Record<string, string> = {
        'Content-Type': 'application/json'
      };

      // Set authentication headers based on mode
      if (authMode === 'company') {
        headers['X-Dashboard-Auth'] = 'true';
      } else {
        // For vendor mode, get token from sessionStorage
        const token = sessionStorage.getItem('vendorToken');
        if (!token) {
          throw new Error('No vendor authentication token available');
        }
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`/api/vendor/${vendorId}/profile`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        const data = await response.json();
        setProfile(data.profile);
        
        // Update vendor data in session storage if profile contains vendor info
        const sessionVendorData = sessionStorage.getItem('vendorData');
        if (sessionVendorData) {
          const vendorData = JSON.parse(sessionVendorData);
          const updatedVendorData = {
            ...vendorData,
            name: data.profile.name,
            email: data.profile.email,
            phone: data.profile.phone,
            address: data.profile.address
          };
          sessionStorage.setItem('vendorData', JSON.stringify(updatedVendorData));
        }
        
        toast({
          title: 'Success! 🎉',
          description: 'Profile updated successfully.'
        });
      } else if (response.status === 401) {
        throw new Error('Authentication expired. Please log in again.');
      } else {
        throw new Error('Failed to update profile');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update profile. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Profile Settings</h2>
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Save Changes
            </>
          )}
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <User className="h-5 w-5 mr-2" />
              Basic Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="name">Company Name</Label>
              <Input
                id="name"
                value={formData.name || ''}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="Enter company name"
              />
            </div>
            <div>
              <Label htmlFor="contactPerson">Contact Person</Label>
              <Input
                id="contactPerson"
                value={formData.contactPerson || ''}
                onChange={(e) => handleInputChange('contactPerson', e.target.value)}
                placeholder="Enter contact person name"
              />
            </div>
            <div>
              <Label htmlFor="service">Service/Business Type</Label>
              <Input
                id="service"
                value={formData.service || ''}
                onChange={(e) => handleInputChange('service', e.target.value)}
                placeholder="e.g., Data Analytics, Manufacturing, Services"
              />
            </div>
            <div>
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes || ''}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                placeholder="Additional notes about your business"
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {/* Contact Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Phone className="h-5 w-5 mr-2" />
              Contact Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email || ''}
                onChange={(e) => handleInputChange('email', e.target.value)}
                placeholder="Enter email address"
              />
            </div>
            <div>
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                value={formData.phone || ''}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                placeholder="Enter phone number"
              />
            </div>
            <div>
              <Label htmlFor="paymentTerms">Payment Terms</Label>
              <Input
                id="paymentTerms"
                value={formData.paymentTerms || ''}
                onChange={(e) => handleInputChange('paymentTerms', e.target.value)}
                placeholder="e.g., Net 30, Net 45"
              />
            </div>
            <div>
              <Label htmlFor="taxId">Tax ID</Label>
              <Input
                id="taxId"
                value={formData.taxId || ''}
                onChange={(e) => handleInputChange('taxId', e.target.value)}
                placeholder="Enter tax identification number"
              />
            </div>
          </CardContent>
        </Card>

        {/* Address Information */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center">
              <MapPin className="h-5 w-5 mr-2" />
              Address Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <div>
                <Label htmlFor="address">Street Address</Label>
                <Input
                  id="address"
                  value={formData.address?.street || ''}
                  onChange={(e) => handleInputChange('address.street', e.target.value)}
                  placeholder="Enter street address"
                />
              </div>
              <div>
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  value={formData.address?.city || ''}
                  onChange={(e) => handleInputChange('address.city', e.target.value)}
                  placeholder="Enter city"
                />
              </div>
              <div>
                <Label htmlFor="state">State/Province</Label>
                <Input
                  id="state"
                  value={formData.address?.state || ''}
                  onChange={(e) => handleInputChange('address.state', e.target.value)}
                  placeholder="Enter state or province"
                />
              </div>
              <div>
                <Label htmlFor="zipCode">ZIP/Postal Code</Label>
                <Input
                  id="zipCode"
                  value={formData.address?.zipCode || ''}
                  onChange={(e) => handleInputChange('address.zipCode', e.target.value)}
                  placeholder="Enter ZIP or postal code"
                />
              </div>
              <div>
                <Label htmlFor="country">Country</Label>
                <Input
                  id="country"
                  value={formData.address?.country || ''}
                  onChange={(e) => handleInputChange('address.country', e.target.value)}
                  placeholder="Enter country"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
