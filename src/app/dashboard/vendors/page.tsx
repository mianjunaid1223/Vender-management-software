import { PageHeader } from "@/components/layout/page-header";
import { VendorsTable } from "@/components/dashboard/vendors-table";
import { VendorInviteManagerNew } from "@/components/vendor/vendor-invite-manager-new";
import { getVendorsForCurrentUser } from "@/lib/data/vendors";
import { getSession } from "@/lib/auth/session";


export default async function VendorsPage() {
  // Fetch data directly on the server
  const vendors = await getVendorsForCurrentUser();
  const session = await getSession();
  
  return (
    <div className="space-y-6">
      <PageHeader 
        title="Vendors" 
        description="Manage your company's vendors and their contact information."
      >
        {/* The Add Vendor button is now part of the VendorsTable component */}
        {/* The invite manager may need to be updated separately */}
        <VendorInviteManagerNew
          companyId={session?.userId || ''} // This is likely incorrect, needs user's tenantId
          companyName={'Your Company'}
        />
      </PageHeader>
      
      <VendorsTable data={vendors} />
    </div>
  );
}
