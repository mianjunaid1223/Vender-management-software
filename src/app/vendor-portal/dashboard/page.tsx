import { requireVendorAuth } from '@/core/auth/vendor-auth';
import { EnhancedVendorDashboard } from '@/features/vendor-portal/components/vendor-dashboard';

export default async function VendorPortalPage() {
  const session = await requireVendorAuth('/vendor-portal/login');

  return (
    <div className="min-h-screen bg-background">
      <EnhancedVendorDashboard user={session} />
    </div>
  );
}
