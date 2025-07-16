import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/page-header";
import { VendorsTable } from "@/components/dashboard/vendors-table";
import { VendorOnboardingDialog } from "@/components/dashboard/vendor-onboarding-dialog";
import { PlusCircle } from "lucide-react";
import { fetchVendors } from "@/lib/data";


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
