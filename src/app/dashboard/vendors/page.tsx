import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/page-header";
import { VendorsTable } from "@/components/dashboard/vendors-table";
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
        <Button>
          <PlusCircle className="mr-2 h-4 w-4" />
          Add Vendor
        </Button>
      </PageHeader>
      <VendorsTable data={vendors} />
    </div>
  );
}
