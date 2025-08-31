import { PageHeader } from "@/components/layout/page-header";
import { VendorApplicationsTable } from "@/components/dashboard/vendor-applications-table";
import { getVendorApplicationsForCurrentUser } from "@/lib/data/vendor-applications";

export default async function VendorApplicationsPage() {
  const applications = await getVendorApplicationsForCurrentUser();
  
  return (
    <div className="space-y-6">
      <PageHeader 
        title="Vendor Applications" 
        description="Review and manage vendor applications submitted to your company."
      />
      
      <VendorApplicationsTable data={applications} />
    </div>
  );
}
