import { PageHeader } from "@/components/layout/page-header";
import { VendorPermissionsTable } from "@/components/dashboard/vendor-permissions-table";
import { fetchVendors } from "@/lib/database/queries";
import { getVendorPermissionsByCompany } from "@/lib/database/vendor-permissions";
import { getSession } from "@/lib/auth";

async function fetchVendorsWithPermissions() {
  const session = await getSession();
  if (!session?.companyId) {
    return [];
  }

  try {
    const [vendors, allPermissions] = await Promise.all([
      fetchVendors(),
      getVendorPermissionsByCompany(session.companyId)
    ]);

    // Map vendors with their permissions
    const vendorsWithPermissions = vendors.map(vendor => {
      const permissions = allPermissions.find(p => p.vendorId === vendor.id);
      return {
        id: vendor.id,
        name: vendor.name,
        email: vendor.email,
        status: vendor.status || 'Active',
        permissions,
        hasAccess: !!permissions?.isActive,
        lastActivity: permissions?.lastUpdated
      };
    });

    return vendorsWithPermissions;
  } catch (error) {
    console.error('Error fetching vendors with permissions:', error);
    return [];
  }
}

export default async function VendorPermissionsPage() {
  const vendors = await fetchVendorsWithPermissions();
  
  return (
    <div className="space-y-6">
      <PageHeader 
        title="Vendor Permissions" 
        description="Manage access levels and permissions for your vendor portal users."
      />
      
      <VendorPermissionsTable 
        vendors={vendors}
        onPermissionsUpdated={() => {
          // Refresh the page to get updated data
          window.location.reload();
        }}
      />
    </div>
  );
}