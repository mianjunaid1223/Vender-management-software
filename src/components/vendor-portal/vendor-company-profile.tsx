'use client';

import { useState, useEffect, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { 
  Building2, 
  Users, 
  FileText, 
  Calendar,
  Mail,
  Phone,
  Globe,
  MapPin,
  TrendingUp,
  ExternalLink,
  RefreshCw,
  CreditCard,
  DollarSign,
  Hash
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Address {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

interface Contact {
  id: string;
  name: string;
  email: string;
  phone?: string;
  isPrimary: boolean;
  role: string;
}

interface Preferences {
  defaultPaymentTerms: string;
  baseCurrency: string;
}

interface CompanyProfileData {
  company: {
    _id: { $oid: string } | string;
    name: string;
    industry?: string;
    businessType?: string;
    description?: string;
    taxId?: string;
    legalId?: string;
    addresses?: Address[];
    primaryAddress?: Address;
    website?: string;
    contacts?: Contact[];
    preferences?: Preferences;
  };

  users: Array<{
    id: string;
    name: string;
    email: string;
    role: string;
    joinedAt: string;
  }>;
  vendorAccess: {
    isRegisteredUser: boolean;
    vendorSince: string;
    vendorStatus: string;
  };
}

interface VendorCompanyProfileProps {
  companyId: string;
}

export function VendorCompanyProfile({ companyId }: VendorCompanyProfileProps) {
  const { toast } = useToast();
  const pathname = usePathname();
  const [data, setData] = useState<CompanyProfileData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Determine auth mode based on URL pattern
  const authMode = pathname === '/vendor-portal/dashboard' ? 'vendor' : 'company';

  const fetchCompanyProfile = useCallback(async () => {
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

      const response = await fetch(`/api/vendor/company-profile/${companyId}`, {
        method: 'GET',
        headers
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Authentication expired');
        }
        if (response.status === 403) {
          throw new Error('Access denied to this company');
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const profileData = await response.json();
      setData(profileData);
    } catch (error) {
      console.error('Error fetching company profile:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to load company profile',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, [companyId, authMode, toast]);

  useEffect(() => {
    if (companyId) {
      fetchCompanyProfile();
    }
  }, [companyId, fetchCompanyProfile]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchCompanyProfile();
  }, [fetchCompanyProfile]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatAddress = (address: Address) => {
    return `${address.street}, ${address.city}, ${address.state} ${address.zipCode}, ${address.country}`;
  };

  const getPrimaryContact = () => {
    return data?.company.contacts?.find(contact => contact.isPrimary) || data?.company.contacts?.[0];
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Company Profile Not Available</h3>
          <p className="text-muted-foreground mb-4">Unable to load company information.</p>
          <Button onClick={handleRefresh} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </div>
      </div>
    );
  }

  const primaryContact = getPrimaryContact();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Company Profile</h2>
          <p className="text-muted-foreground">Information about your associated company</p>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleRefresh}
          disabled={refreshing}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Company Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Company Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold">{data.company.name}</h3>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="secondary">
                    {data.vendorAccess.vendorStatus}
                  </Badge>
                  {data.company.businessType && (
                    <Badge variant="outline">
                      {data.company.businessType}
                    </Badge>
                  )}
                  {data.vendorAccess.isRegisteredUser && (
                    <Badge variant="outline">
                      Registered User
                    </Badge>
                  )}
                </div>
              </div>

              {primaryContact?.email && (
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span>{primaryContact.email}</span>
                </div>
              )}

              {primaryContact?.phone && (
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span>{primaryContact.phone}</span>
                </div>
              )}

              {data.company.website && (
                <div className="flex items-center gap-2 text-sm">
                  <Globe className="h-4 w-4 text-muted-foreground" />
                  <a 
                    href={data.company.website} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-primary hover:underline flex items-center gap-1"
                  >
                    {data.company.website}
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              )}

              {data.company.primaryAddress && (
                <div className="flex items-start gap-2 text-sm">
                  <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <span>{formatAddress(data.company.primaryAddress)}</span>
                </div>
              )}
            </div>

            <div className="space-y-4">
              {data.company.industry && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Industry</label>
                  <p className="text-sm">{data.company.industry}</p>
                </div>
              )}

              <div>
                <label className="text-sm font-medium text-muted-foreground">Vendor Since</label>
                <p className="text-sm">{formatDate(data.vendorAccess.vendorSince)}</p>
              </div>

        
              {data.company.taxId && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Tax ID</label>
                  <p className="text-sm">{data.company.taxId}</p>
                </div>
              )}

              {data.company.legalId && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Legal ID</label>
                  <p className="text-sm">{data.company.legalId}</p>
                </div>
              )}
            </div>
          </div>

          {data.company.description && (
            <>
              <Separator />
              <div>
                <label className="text-sm font-medium text-muted-foreground">Description</label>
                <p className="text-sm mt-1">{data.company.description}</p>
              </div>
            </>
          )}

          {/* Company Preferences */}
          {data.company.preferences && (
            <>
              <Separator />
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-3">Business Preferences</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-2 text-sm">
                    <CreditCard className="h-4 w-4 text-muted-foreground" />
                    <span>Payment Terms: {data.company.preferences.defaultPaymentTerms}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                    <span>Base Currency: {data.company.preferences.baseCurrency}</span>
                  </div>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Contacts */}
      {data.company.contacts && data.company.contacts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Company Contacts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.company.contacts.map((contact) => (
                <div key={contact.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <h4 className="font-medium flex items-center gap-2">
                      {contact.name}
                      {contact.isPrimary && (
                        <Badge variant="default" className="text-xs">Primary</Badge>
                      )}
                    </h4>
                    <p className="text-sm text-muted-foreground">{contact.email}</p>
                    {contact.phone && (
                      <p className="text-sm text-muted-foreground">{contact.phone}</p>
                    )}
                  </div>
                  <div className="text-right">
                    <Badge variant="outline">{contact.role}</Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Additional Addresses */}
      {data.company.addresses && data.company.addresses.length > 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Additional Addresses
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.company.addresses
                .filter(addr => addr !== data.company.primaryAddress)
                .map((address, index) => (
                <div key={index} className="p-3 border rounded-lg">
                  <p className="text-sm">{formatAddress(address)}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}



        
    </div>
  );
}
