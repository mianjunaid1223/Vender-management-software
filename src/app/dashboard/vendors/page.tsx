import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/layout/page-header";
import { VendorsTable } from "@/components/dashboard/vendors-table";
import { VendorOnboardingDialog } from "@/components/dashboard/vendor-onboarding-dialog";
import { VendorInviteManagerNew } from "@/components/vendor/vendor-invite-manager-new";
import { PlusCircle } from "lucide-react";
import { fetchVendors, fetchCompany } from "@/lib/database/queries";
import { getSession } from "@/lib/auth";


export default async function VendorsPage() {
  const vendors = await fetchVendors();
  const session = await getSession();
  const company = session?.companyId ? await fetchCompany() : null;
  
  return (
    <div className="space-y-6">
      <PageHeader 
        title="Vendors" 
        description="Manage your company's vendors and their contact information."
      >
        <div className="flex gap-2">
          <VendorInviteManagerNew 
            companyId={session?.companyId || ''} 
            companyName={company?.name || 'Your Company'} 
          />
          <VendorOnboardingDialog />
        </div>
      </PageHeader>
      
      <VendorsTable data={vendors} />
    </div>
  );
}
