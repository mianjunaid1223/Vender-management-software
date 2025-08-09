'use client';

import { Suspense, useEffect, useState } from 'react';
import { SimplifiedVendorForm } from '@/components/vendor-portal/simplified-vendor-form';
import { VendorApplicationStatus } from '../../components/vendor-portal/vendor-application-status';
import { VendorPinLogin } from '@/components/vendor-portal/vendor-pin-login';
import { useSearchParams, useRouter } from 'next/navigation';

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
          if (data.status === 'pending_registration') {
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
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Show PIN login for approved vendors
  if (showPinLogin) {
    return <VendorPinLogin onSuccess={handlePinLoginSuccess} />;
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Error</h2>
          <p className="text-gray-700 mb-6">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {applicationStatus ? (
        <VendorApplicationStatus status={applicationStatus} />
      ) : (
        <div className="flex items-center justify-center min-h-screen p-4">
          <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full text-center">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">New Vendor Registration</h2>
            <p className="text-gray-600 mb-6">
              If you're a new vendor, please request an invitation from the company administrator.
            </p>
            <p className="text-gray-600 mb-6">
              If you're an existing vendor, please use the PIN login above.
            </p>
            <button 
              onClick={() => setShowPinLogin(true)}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Use PIN Login
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function VendorPortalPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    }>
      <VendorPortalContent />
    </Suspense>
  );
}