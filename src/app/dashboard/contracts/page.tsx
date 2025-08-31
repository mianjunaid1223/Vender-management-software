
import { getContractsForCurrentUser } from "@/lib/data/contracts";
import { getVendorsForCurrentUser } from "@/lib/data/vendors";
import { getTenantForCurrentUser } from "@/lib/data/tenants";
import { ContractsClient } from "@/components/dashboard/contracts-client";

export default async function ContractsPage() {
  // Fetch all data on the server in parallel
  const [contracts, vendors, company] = await Promise.all([
    getContractsForCurrentUser(),
    getVendorsForCurrentUser(),
    getTenantForCurrentUser()
  ]);

  return (
    <ContractsClient
      initialContracts={contracts}
      initialVendors={vendors}
      initialCompany={company}
    />
  );
}
