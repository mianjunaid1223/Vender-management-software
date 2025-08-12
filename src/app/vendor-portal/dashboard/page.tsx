'use client';

import { Suspense, useEffect, useState, useCallback, memo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { DynamicVendorDashboard } from '@/components/vendor-portal/dynamic-vendor-dashboard';
import { Button } from '@/components/ui/button';
import { LogOut, Building, ChevronDown, ExternalLink } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Logo } from '@/components/layout/logo';
import { ThemeToggle } from '@/components/theme-toggle';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';

interface VendorData {
  id: string;
  name: string;
  email: string;
  status: string;
  applicationId: string;
}

interface CompanyData {
  id: string;
  name: string;
  isVendor: boolean;
  isRegisteredUser: boolean;
  vendorId: string;
  dashboardUrl: string | null;
}

function VendorDashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [vendor, setVendor] = useState<VendorData | null>(null);
  const [companies, setCompanies] = useState<CompanyData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadingCompanies, setLoadingCompanies] = useState(false);

  const fetchCompanies = useCallback(async () => {
    const token = sessionStorage.getItem('vendorToken');
    if (!token) return;

    setLoadingCompanies(true);
    try {
      const response = await fetch('/api/vendor/companies', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setCompanies(data.companies || []);
      } else {
        console.warn('Failed to fetch companies:', response.statusText);
      }
    } catch (error) {
      console.error('Error fetching companies:', error);
    } finally {
      setLoadingCompanies(false);
    }
  }, []);  useEffect(() => {
    const fetchVendorData = async () => {
      try {
        // First, check if vendor data is already in session storage (from PIN login)
        const sessionVendor = sessionStorage.getItem('vendorData');
        const sessionToken = sessionStorage.getItem('vendorToken');
        
        if (sessionVendor && sessionToken) {
          try {
            // Verify token is still valid
            const verifyResponse = await fetch('/api/vendor/pin-auth', {
              method: 'GET',
              headers: {
                'Authorization': `Bearer ${sessionToken}`
              }
            });
            
            if (verifyResponse.ok) {
              const vendorData = JSON.parse(sessionVendor);
              setVendor({
                id: vendorData._id || vendorData.id,
                name: vendorData.name,
                email: vendorData.email,
                status: vendorData.status || 'approved',
                applicationId: vendorData.applicationId || vendorData._id
              });
              
              // Fetch companies after setting vendor data
              await fetchCompanies();
              
              setIsLoading(false);
              return;
            } else {
              // Token expired, clear session and redirect
              sessionStorage.removeItem('vendorData');
              sessionStorage.removeItem('vendorToken');
              toast({
                title: 'Session Expired',
                description: 'Please log in again.',
                variant: 'destructive',
              });
              router.push('/vendor-portal');
              return;
            }
          } catch (error) {
            console.warn('Token verification failed:', error);
            sessionStorage.removeItem('vendorData');
            sessionStorage.removeItem('vendorToken');
          }
        }

        // Check if this is a PIN-based access
        const pin = searchParams.get('pin');
        if (pin) {
          const pinResponse = await fetch('/api/vendor/pin-auth', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ pin: pin.toUpperCase() })
          });

          if (pinResponse.ok) {
            const pinData = await pinResponse.json();
            const vendorData = pinData.vendor;
            
            // Store vendor data and token in session storage
            sessionStorage.setItem('vendorData', JSON.stringify(vendorData));
            sessionStorage.setItem('vendorToken', pinData.token);
            
            setVendor({
              id: vendorData._id || vendorData.id,
              name: vendorData.name,
              email: vendorData.email,
              status: vendorData.status || 'approved',
              applicationId: vendorData.applicationId || vendorData._id
            });
            
            // Fetch companies
            await fetchCompanies();
            
            setIsLoading(false);
            return;
          } else {
            toast({
              title: 'Invalid PIN',
              description: 'The PIN provided is invalid or expired.',
              variant: 'destructive',
            });
            router.push('/vendor-portal');
            return;
          }
        }

        // Fall back to token/email based authentication
        const token = searchParams.get('token');
        const email = searchParams.get('email');
        
        if (!token && !email) {
          router.push('/vendor-portal');
          return;
        }

        const response = await fetch(`/api/vendor/status?${token ? `token=${token}` : `email=${email}`}`);
        const data = await response.json();

        if (data.approved && data.vendor) {
          setVendor(data.vendor);
          // Store vendor token in localStorage for future requests
          if (token) {
            sessionStorage.setItem('vendorToken', token);
          }
        } else {
          toast({
            title: 'Access Denied',
            description: 'Your vendor account is not approved or the link is invalid.',
            variant: 'destructive',
          });
          router.push('/vendor-portal');
        }
      } catch (error) {
        console.error('Error fetching vendor data:', error);
        toast({
          title: 'Error',
          description: 'Failed to load vendor information. Please try again later.',
          variant: 'destructive',
        });
        router.push('/vendor-portal');
      } finally {
        setIsLoading(false);
      }
    };

    fetchVendorData();
  }, [router, searchParams, toast]);

  const handleLogout = useCallback(async () => {
    try {
      // Call logout API to invalidate token
      const token = sessionStorage.getItem('vendorToken');
      if (token) {
        await fetch('/api/vendor/pin-auth', {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
      }
    } catch (error) {
      console.warn('Logout API call failed:', error);
    } finally {
      // Clear local storage regardless of API call result
      sessionStorage.removeItem('vendorToken');
      sessionStorage.removeItem('vendorData');
      localStorage.removeItem('vendorToken');
      
      toast({
        title: 'Logged Out',
        description: 'You have been successfully logged out.',
      });
      
      router.push('/vendor-portal');
    }
  }, [router, toast]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!vendor) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background p-4">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-foreground mb-4">Vendor Not Found</h2>
          <p className="text-muted-foreground mb-6">We couldn't find your vendor account. Please contact support.</p>
          <Button onClick={() => router.push('/vendor-portal')}>
            Back to Portal
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-6">
              <Logo isLanding={false} />
              <div className="flex items-center gap-4">
                <div>
                  <h1 className="text-xl font-semibold text-foreground">Vendor Portal</h1>
                  <p className="text-sm text-muted-foreground">{vendor.name} • {vendor.email}</p>
                </div>
                
              
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <ThemeToggle />
              <Button variant="outline" size="sm" onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Dynamic Dashboard */}
      <DynamicVendorDashboard vendorId={vendor.id} />
    </div>
  );
}

export default function VendorDashboardPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    }>
      <VendorDashboardContent />
    </Suspense>
  );
}
