'use client';

import { Suspense, useEffect, useState } from 'react';
import { SimplifiedVendorForm } from '@/components/vendor-portal/simplified-vendor-form';
import { VendorApplicationStatus } from '../../components/vendor-portal/vendor-application-status';
import { VendorPinLogin } from '@/components/vendor-portal/vendor-pin-login';
import { useSearchParams, useRouter } from 'next/navigation';
import { Logo } from '@/components/layout/logo';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { UserPlus, Shield, CheckCircle, Building } from 'lucide-react';
import { ThemeToggle } from '@/components/theme-toggle';

function VendorPortalContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [applicationStatus, setApplicationStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showPinLogin, setShowPinLogin] = useState(false);
  const [vendorData, setVendorData] = useState<any>(null);

  useEffect(() => {
    const checkVendorAccess = async () => {
      // Check if user is already authenticated
      const storedToken = sessionStorage.getItem('vendorToken');
      const storedVendor = sessionStorage.getItem('vendorData');
      
      if (storedToken && storedVendor) {
        try {
          // Verify token is still valid
          const response = await fetch('/api/vendor/pin-auth', {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${storedToken}`
            }
          });
          
          if (response.ok) {
            // Already authenticated, redirect to dashboard
            router.push('/vendor-portal/dashboard');
            return;
          } else {
            // Token expired, clear stored data
            sessionStorage.removeItem('vendorToken');
            sessionStorage.removeItem('vendorData');
          }
        } catch (error) {
          console.warn('Token validation failed:', error);
          sessionStorage.removeItem('vendorToken');
          sessionStorage.removeItem('vendorData');
        }
      }

      const token = searchParams.get('token');
      const pin = searchParams.get('pin');
      
      // Check if this is a PIN-based access
      if (pin) {
        setShowPinLogin(true);
        setIsLoading(false);
        return;
      }
      
      // If there's no token, default to showing PIN login for existing vendors
      if (!token) {
        setShowPinLogin(true);
        setIsLoading(false);
        return;
      }

      try {
        const response = await fetch(`/api/vendor/status?token=${encodeURIComponent(token)}`);
        const data = await response.json();

        if (response.ok) {
          // If status is pending, show the form. Otherwise, show the status component.
          if (data.status === 'pending_registration' || data.status === 'active') {
            setApplicationStatus(null);
          } else if (data.status === 'approved') {
            // For approved vendors with token, redirect to PIN login
            setShowPinLogin(true);
          } else {
            setApplicationStatus(data.status);
          }
        } else {
          setError(data.error || 'Invalid invitation link.');
        }
      } catch (err) {
        console.error('Error checking vendor status:', err);
        setError('Failed to verify invitation. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    checkVendorAccess();
  }, [searchParams, router]);

  const handlePinLoginSuccess = (vendor: any) => {
    setVendorData(vendor);
    setShowPinLogin(false);
    // Redirect to vendor dashboard
    router.push('/vendor-portal/dashboard');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Show PIN login for approved vendors
  if (showPinLogin) {
    return <VendorPinLogin onSuccess={handlePinLoginSuccess} />;
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <Logo isLanding={true} />
            <ThemeToggle />
          </div>
          
          <Card className="max-w-md mx-auto">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl font-bold text-destructive">Error</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-muted-foreground mb-6">{error}</p>
              <Button onClick={() => window.location.reload()}>
                Try Again
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-12">
          <Logo isLanding={true} />
          <div className="flex items-center gap-4">
            <Button 
              variant="outline" 
              onClick={() => router.push('/signup')}
              className="flex items-center gap-2"
            >
              <Building className="h-4 w-4" />
              Register Your Company
            </Button>
            <ThemeToggle />
          </div>
        </div>

        {applicationStatus ? (
          <VendorApplicationStatus status={applicationStatus} />
        ) : (
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left side - Hero content */}
            <div className="space-y-8">
              <div className="space-y-4">
                <Badge variant="secondary" className="w-fit">
                  Vendor Portal
                </Badge>
                <h1 className="text-4xl font-bold tracking-tight">
                  Welcome to VendorVerse
                </h1>
                <p className="text-xl text-muted-foreground">
                  Streamline your vendor operations with our comprehensive management platform. 
                  Access your dashboard, manage contracts, and track invoices all in one place.
                </p>
              </div>

              {/* Features */}
              <div className="grid sm:grid-cols-2 gap-6">
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-6 w-6 text-primary mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold">Contract Management</h3>
                    <p className="text-sm text-muted-foreground">
                      View and manage all your contracts in one place
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-6 w-6 text-primary mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold">Invoice Tracking</h3>
                    <p className="text-sm text-muted-foreground">
                      Real-time updates on payment status and due dates
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-6 w-6 text-primary mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold">Multi-Company Access</h3>
                    <p className="text-sm text-muted-foreground">
                      Seamlessly switch between different client portals
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-6 w-6 text-primary mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold">Secure Access</h3>
                    <p className="text-sm text-muted-foreground">
                      PIN-based authentication for enhanced security
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right side - Login card */}
            <div className="lg:pl-8">
              <Card className="w-full max-w-md mx-auto">
                <CardHeader className="text-center space-y-4">
                  <div className="mx-auto bg-primary/10 p-3 rounded-full w-16 h-16 flex items-center justify-center">
                    <Shield className="h-8 w-8 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-2xl">Vendor Access</CardTitle>
                    <CardDescription>
                      Enter your vendor portal to access your dashboard
                    </CardDescription>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <Button 
                      onClick={() => setShowPinLogin(true)}
                      className="w-full h-12 text-lg"
                      size="lg"
                    >
                      <Shield className="h-5 w-5 mr-2" />
                      Access with PIN
                    </Button>
                    
                    <div className="relative">
                      <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t border-border" />
                      </div>
                      <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-card px-2 text-muted-foreground">
                          Need access?
                        </span>
                      </div>
                    </div>
                    
                    <div className="text-center space-y-3">
                      <p className="text-sm text-muted-foreground">
                        New vendors need to be invited by company administrators
                      </p>
                      <Button 
                        variant="outline" 
                        onClick={() => router.push('/signup')}
                        className="w-full"
                      >
                        <UserPlus className="h-4 w-4 mr-2" />
                        Register Your Company
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function VendorPortalPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    }>
      <VendorPortalContent />
    </Suspense>
  );
}