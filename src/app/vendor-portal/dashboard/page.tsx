import { requireVendorAuth } from '@/lib/auth/vendor-auth';
import { EnhancedVendorDashboard } from '@/components/vendor-portal/enhanced-vendor-dashboard';

export default async function VendorPortalPage() {
  const session = await requireVendorAuth();

  return (
    <div className="min-h-screen bg-background">
      <EnhancedVendorDashboard user={session} />
    </div>
  );
}
