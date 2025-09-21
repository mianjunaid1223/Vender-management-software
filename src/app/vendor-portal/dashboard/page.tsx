import { requireVendorAuth } from '@/lib/auth/vendor-auth';
import { EnhancedVendorDashboard } from '@/components/vendor-portal/vendor-dashboard';

export default async function VendorPortalPage() {
  const session = await requireVendorAuth('/vendor-portal/login');

  return (
    <div className="min-h-screen bg-background">
      <EnhancedVendorDashboard user={session} />
    </div>
  );
}
