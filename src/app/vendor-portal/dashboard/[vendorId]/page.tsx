'use client';

import { Suspense, useEffect, useState, use, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { PermissionAwareDashboard } from '@/components/vendor-portal/permission-aware-dashboard';
import { Button } from '@/components/ui/button';
import { LogOut, ArrowLeft, Building } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Logo } from '@/components/layout/logo';
import { ThemeToggle } from '@/components/theme-toggle';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

interface VendorDashboardProps {
  params: Promise<{
    vendorId: string;
  }>;
}

interface VendorData {
  id: string;
  name: string;
  email: string;
  status: string;
  pin: string;
  company: {
    id: string;
    name: string;
  };
}

function VendorDashboardLoading() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center px-4">
          <Skeleton className="h-8 w-32" />
          <div className="ml-auto flex items-center space-x-4">
            <Skeleton className="h-8 w-8 rounded-full" />
            <Skeleton className="h-8 w-20" />
          </div>
        </div>
      </header>
      <div className="container mx-auto p-6">
        <div className="space-y-6">
          <Skeleton className="h-8 w-64" />
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-24" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function VendorDashboardPage({ params }: VendorDashboardProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [vendor, setVendor] = useState<VendorData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [authMode, setAuthMode] = useState<'company' | 'vendor'>('company');
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [dashboardData, setDashboardData] = useState<any>(null);
  
  // Unwrap the params Promise
  const { vendorId } = use(params);

  const fetchVendorData = useCallback(async () => {
        setIsLoading(true);
        setError(null);

        let headers: Record<string, string> = {
          'Content-Type': 'application/json'
        };

        // Add appropriate auth header based on access mode
        if (authMode === 'company') {
          headers['X-Dashboard-Auth'] = 'true';
        }

        // Fetch dashboard data with permissions
        // Fetch dashboard data with permissions
        const response = await fetch(`/api/vendor/dashboard-with-permissions/${vendorId}`, {
          headers
        });
        
        if (!response.ok) {
          if (response.status === 401) {
            if (authMode === 'vendor') {
              // Redirect to vendor login for independent access
              router.push(`/vendor-portal?redirect=/vendor-portal/dashboard/${vendorId}`);
              return;
            } else {
              // Redirect to company login for dashboard access
              router.push(`/login?redirect=/vendor-portal/dashboard/${vendorId}`);
              return;
            }
          }
          if (response.status === 403) {
            throw new Error('You don\'t have access to this vendor portal');
          }
          if (response.status === 404) {
            throw new Error('Vendor not found');
          }
          throw new Error('Failed to fetch vendor data');
        }

        const data = await response.json();
        setVendor(data.vendor);
        setDashboardData(data);
        setDashboardData(data);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'An error occurred';
        setError(errorMessage);
        toast({
          title: 'Error',
          description: errorMessage,
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
  }, [vendorId, authMode, router, toast]);

  useEffect(() => {
  useEffect(() => {
    if (vendorId) {
      fetchVendorData();
    }
  }, [fetchVendorData, vendorId]);

  const handleBackToDashboard = () => {
    router.push('/dashboard');
  };

  const handleLogout = () => {
    // Navigate back to main dashboard
    router.push('/dashboard');
    toast({
      title: 'Switched Back',
      description: 'Returned to your main company dashboard',
    });
  };

  if (isLoading) {
    return <VendorDashboardLoading />;
  }

  if (error || !vendor) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-semibold text-foreground">Access Denied</h1>
          <p className="text-muted-foreground max-w-md">
            {error || 'You don\'t have access to this vendor portal or it doesn\'t exist.'}
          </p>
          <Button onClick={handleBackToDashboard} className="mt-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container flex h-14 items-center px-4">
          <div className="flex items-center space-x-4">
            <Logo />
            <div className="hidden md:flex items-center space-x-2">
              <Building className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium text-muted-foreground">
                {vendor.company.name}
              </span>
              <Badge variant="secondary" className="text-xs">
                Vendor Portal
              </Badge>
            </div>
          </div>
          
          <div className="ml-auto flex items-center space-x-4">
            <div className="hidden sm:flex items-center space-x-2">
              <span className="text-sm text-muted-foreground">Welcome,</span>
              <span className="text-sm font-medium">{vendor.name}</span>
            </div>
            
            <ThemeToggle />
            
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              <span className="hidden sm:inline">Back to Dashboard</span>
              <span className="sm:hidden">Back</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        <Suspense fallback={<VendorDashboardLoading />}>
          <PermissionAwareDashboard 
            vendorId={vendorId} 
            companyId={vendor.company?.id || ''}
            initialData={dashboardData}
          />
            vendorId={vendorId} 
            companyId={vendor.company?.id || ''}
            initialData={dashboardData}
          />
        </Suspense>
      </main>
    </div>
  );
}
