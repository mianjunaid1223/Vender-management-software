import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/page-header";
import { VendorsTable } from "@/components/dashboard/vendors-table";
import { VendorOnboardingDialog } from "@/components/dashboard/vendor-onboarding-dialog";
import { VendorInviteModal } from "@/components/dashboard/vendor-invite-modal";
import { PlusCircle } from "lucide-react";
import { fetchVendors, fetchCompany } from "@/lib/data";
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
          <VendorInviteModal companyName={company?.name || 'Your Company'} />
          <VendorOnboardingDialog />
        </div>
      </PageHeader>
      
      <VendorsTable data={vendors} />
    </div>
  );
}
