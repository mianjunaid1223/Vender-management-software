import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/page-header";
import { VendorsTable } from "@/components/dashboard/vendors-table";
import { VendorOnboardingDialog } from "@/components/dashboard/vendor-onboarding-dialog";
import { PlusCircle, Upload } from "lucide-react";
import { fetchVendors } from "@/lib/data";

export default async function VendorsPage() {
  const vendors = await fetchVendors();
  return (
    <div>
      <PageHeader 
        title="Vendors" 
        description="Manage your vendor relationships, track performance, and ensure compliance."
      >
        <div className="flex gap-2">
          <Button variant="outline">
            <Upload className="mr-2 h-4 w-4" />
            Import Vendors
          </Button>
          <VendorOnboardingDialog />
        </div>
      </PageHeader>
      <VendorsTable data={vendors} />
    </div>
  );
}
