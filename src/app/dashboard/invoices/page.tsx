
import { InvoiceManagementClient } from "@/components/dashboard/invoice-management-client";
import { getInvoicesForCurrentUser } from "@/lib/data/invoices";
import { getVendorsForCurrentUser } from "@/lib/data/vendors";
import { getContractsForCurrentUser } from "@/lib/data/contracts";

export default async function InvoicesPage() {
  const [invoices, vendors, contracts] = await Promise.all([
    getInvoicesForCurrentUser(),
    getVendorsForCurrentUser(),
    getContractsForCurrentUser()
  ]);

  return (
    <InvoiceManagementClient
      initialInvoices={invoices}
      vendors={vendors}
      contracts={contracts}
    />
  );
}
