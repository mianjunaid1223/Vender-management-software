import { PageHeader } from "@/components/page-header";
import { InvoicesTable } from "@/components/dashboard/invoices-table";
import { UploadInvoiceDialog } from "@/components/dashboard/upload-invoice-dialog";
import { fetchInvoices } from "@/lib/data";

export default async function InvoicesPage() {
  const invoices = await fetchInvoices();
  return (
    <div>
      <PageHeader 
        title="Invoices"
        description="Track and manage all your vendor invoices."
      >
        <UploadInvoiceDialog />
      </PageHeader>
      <InvoicesTable data={invoices} />
    </div>
  );
}
