import { PageHeader } from "@/components/page-header";
import { InvoiceManagementClient } from "@/components/dashboard/invoice-management-client";
import { fetchInvoices, fetchVendors, fetchContracts } from "@/lib/data";

export default async function InvoicesPage() {
  const [invoices, vendors, contracts] = await Promise.all([
    fetchInvoices(),
    fetchVendors(),
    fetchContracts()
  ]);

  // Serialize data to remove MongoDB ObjectId issues
  const serializedInvoices = JSON.parse(JSON.stringify(invoices));
  const serializedVendors = JSON.parse(JSON.stringify(vendors));
  const serializedContracts = JSON.parse(JSON.stringify(contracts));

  return (
    <InvoiceManagementClient
      initialInvoices={serializedInvoices}
      vendors={serializedVendors}
      contracts={serializedContracts}
    />
  );
}
