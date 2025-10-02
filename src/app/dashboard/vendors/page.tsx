import { Button } from "@/shared/components/ui/button";
import { PageHeader } from "@/shared/components/page-header";
import { VendorsTable } from "@/features/dashboard/components/vendors-table";
import { VendorOnboardingDialog } from "@/features/dashboard/components/vendor-onboarding-dialog";
import { PlusCircle } from "lucide-react";
import { fetchVendors } from "@/shared/lib/data";


export default async function VendorsPage() {
  const vendors = await fetchVendors();
  return (
    <div>
      <PageHeader 
        title="Vendors" 
        description="Manage your company's vendors and their contact information."
      >
        <VendorOnboardingDialog />
      </PageHeader>
      <VendorsTable data={vendors} />
    </div>
  );
}
