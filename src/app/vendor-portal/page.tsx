'use client';

import { Suspense, useEffect, useState } from 'react';
import { SimplifiedVendorForm } from '@/components/vendor-portal/simplified-vendor-form';
import { VendorApplicationStatus } from '../../components/vendor-portal/vendor-application-status';
import { useSearchParams } from 'next/navigation';

function VendorPortalContent() {
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(true);
  const [applicationStatus, setApplicationStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkVendorStatus = async () => {
      const token = searchParams.get('token');
      // If there's no token, we default to showing the form.
      if (!token) {
        setIsLoading(false);
        setApplicationStatus(null); // Explicitly show form
        return;
      }

      try {
        const response = await fetch(`/api/vendor/status?token=${encodeURIComponent(token)}`);
        const data = await response.json();

        if (response.ok) {
          // If status is pending, we show the form. Otherwise, show the status component.
          if (data.status === 'pending_registration') {
            setApplicationStatus(null);
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

    checkVendorStatus();
  }, [searchParams]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
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
        <SimplifiedVendorForm />
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