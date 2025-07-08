import { PageHeader } from "@/components/page-header";
import { InvoicesTable } from "@/components/dashboard/invoices-table";
import { UploadInvoiceDialog } from "@/components/dashboard/upload-invoice-dialog";
import clientPromise from "@/lib/mongodb";
import type { Invoice } from "@/lib/types";
import { MOCK_INVOICES } from "@/lib/mock-data";

async function getInvoices(): Promise<Invoice[]> {
  try {
    const client = await clientPromise;
    const db = client.db();
    const invoicesCollection = db.collection("invoices");

    const count = await invoicesCollection.countDocuments();
    if (count === 0) {
      console.log("Seeding invoices...");
      const invoicesToSeed = MOCK_INVOICES.map(({ id, ...rest }) => rest);
      await invoicesCollection.insertMany(invoicesToSeed);
    }
    
    const invoices = await invoicesCollection.find({}).sort({ invoiceDate: -1 }).toArray();

    return invoices.map((invoice) => ({
      ...invoice,
      id: invoice._id.toString(),
    })) as unknown as Invoice[];
  } catch (error) {
    console.error("Database Error:", error);
    return [];
  }
}

export default async function InvoicesPage() {
  const invoices = await getInvoices();
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
