import { redirect } from 'next/navigation';
import { getVendorInvitation, acceptVendorInvitation, getVendorPortalData } from '@/lib/vendor-portal-data';
import { VendorPortalClient } from '@/components/vendor-portal/vendor-portal-client';

interface VendorPortalPageProps {
  params: { token: string };
  searchParams: { accept?: string };
}

export default async function VendorPortalPage({ params, searchParams }: VendorPortalPageProps) {
  const { token } = params;
  
  try {
    const invitation = await getVendorInvitation(token);
    
    if (!invitation) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-6">
            <div className="text-center">
              <h1 className="text-2xl font-bold text-gray-900 mb-4">Invalid Invitation</h1>
              <p className="text-gray-600">
                This invitation link is invalid, expired, or has already been used.
              </p>
            </div>
          </div>
        </div>
      );
    }
    
    // Auto-accept invitation if accept param is present
    if (searchParams.accept === 'true') {
      const accepted = await acceptVendorInvitation(token);
      if (!accepted) {
        return (
          <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-6">
              <div className="text-center">
                <h1 className="text-2xl font-bold text-gray-900 mb-4">Error</h1>
                <p className="text-gray-600">
                  Failed to accept invitation. Please try again or contact support.
                </p>
              </div>
            </div>
          </div>
        );
      }
    }
    
    // If not accepting, show invitation details
    if (searchParams.accept !== 'true' && invitation.status === 'pending') {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-6">
            <div className="text-center">
              <h1 className="text-2xl font-bold text-gray-900 mb-4">Vendor Portal Invitation</h1>
              <p className="text-gray-600 mb-6">
                You&apos;ve been invited to access the vendor portal for managing your business relationship.
              </p>
              
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <h3 className="font-semibold text-gray-900 mb-2">Access Permissions:</h3>
                <ul className="text-sm text-gray-600 space-y-1">
                  {invitation.permissions.map((permission, index) => (
                    <li key={index} className="flex items-center">
                      <span className="w-2 h-2 bg-green-400 rounded-full mr-2"></span>
                      {permission.resource}: {permission.actions.join(', ')}
                    </li>
                  ))}
                </ul>
              </div>
              
              <a
                href={`/vendor-portal/${token}?accept=true`}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
              >
                Accept Invitation & Continue
              </a>
            </div>
          </div>
        </div>
      );
    }
    
    // Load vendor portal data
    const portalData = await getVendorPortalData(invitation.vendorId, invitation.businessId);
    
    return (
      <VendorPortalClient
        invitation={invitation}
        portalData={portalData}
      />
    );
    
  } catch (error) {
    console.error('Error loading vendor portal:', error);
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-6">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Error</h1>
            <p className="text-gray-600">
              Something went wrong loading the vendor portal. Please try again later.
            </p>
          </div>
        </div>
      </div>
    );
  }
}
