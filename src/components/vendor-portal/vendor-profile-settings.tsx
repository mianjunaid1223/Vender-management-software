'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Save, User, Building2, MapPin, Phone, Mail, Globe } from 'lucide-react';

interface VendorProfile {
  id: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
  website?: string;
  description?: string;
  taxId?: string;
  businessType?: string;
  contactPerson?: string;
}

interface VendorProfileSettingsProps {
  vendorId: string;
}

export function VendorProfileSettings({ vendorId }: VendorProfileSettingsProps) {
  const { toast } = useToast();
  const [profile, setProfile] = useState<VendorProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState<Partial<VendorProfile>>({});

  useEffect(() => {
    fetchProfile();
  }, [vendorId]);

  const fetchProfile = async () => {
    try {
      const token = sessionStorage.getItem('vendorToken');
      
      if (!token) {
        throw new Error('No authentication token available');
      }

      const response = await fetch(`/api/vendor/${vendorId}/profile`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
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

  const handleInputChange = (field: keyof VendorProfile, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const token = sessionStorage.getItem('vendorToken');
      
      if (!token) {
        throw new Error('No authentication token available');
      }

      const response = await fetch(`/api/vendor/${vendorId}/profile`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
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
              <Label htmlFor="businessType">Business Type</Label>
              <Input
                id="businessType"
                value={formData.businessType || ''}
                onChange={(e) => handleInputChange('businessType', e.target.value)}
                placeholder="e.g., Manufacturing, Services, Technology"
              />
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description || ''}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Brief description of your business"
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
              <Label htmlFor="website">Website</Label>
              <Input
                id="website"
                value={formData.website || ''}
                onChange={(e) => handleInputChange('website', e.target.value)}
                placeholder="https://your-website.com"
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
                  value={formData.address || ''}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                  placeholder="Enter street address"
                />
              </div>
              <div>
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  value={formData.city || ''}
                  onChange={(e) => handleInputChange('city', e.target.value)}
                  placeholder="Enter city"
                />
              </div>
              <div>
                <Label htmlFor="state">State/Province</Label>
                <Input
                  id="state"
                  value={formData.state || ''}
                  onChange={(e) => handleInputChange('state', e.target.value)}
                  placeholder="Enter state or province"
                />
              </div>
              <div>
                <Label htmlFor="zipCode">ZIP/Postal Code</Label>
                <Input
                  id="zipCode"
                  value={formData.zipCode || ''}
                  onChange={(e) => handleInputChange('zipCode', e.target.value)}
                  placeholder="Enter ZIP or postal code"
                />
              </div>
              <div>
                <Label htmlFor="country">Country</Label>
                <Input
                  id="country"
                  value={formData.country || ''}
                  onChange={(e) => handleInputChange('country', e.target.value)}
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
