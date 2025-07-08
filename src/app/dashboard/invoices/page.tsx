import { PageHeader } from "@/components/page-header";
import { InvoicesTable } from "@/components/dashboard/invoices-table";
import { UploadInvoiceDialog } from "@/components/dashboard/upload-invoice-dialog";
import { MOCK_INVOICES } from "@/lib/mock-data";

export default function InvoicesPage() {
  return (
    <div>
      <PageHeader 
        title="Invoices"
        description="Track and manage all your vendor invoices."
      >
        <UploadInvoiceDialog />
      </PageHeader>
      <InvoicesTable data={MOCK_INVOICES} />
    </div>
  );
}
