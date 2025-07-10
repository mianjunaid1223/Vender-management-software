import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/page-header";
import { ContractsTable } from "@/components/dashboard/contracts-table";
import { PlusCircle } from "lucide-react";
import { fetchContracts } from "@/lib/data";

export default async function ContractsPage() {
  const contracts = await fetchContracts();
  
  return (
    <div>
      <PageHeader 
        title="Contracts" 
        description="Manage vendor contracts and track renewals."
      >
        <Button>
          <PlusCircle className="mr-2 h-4 w-4" />
          Add Contract
        </Button>
      </PageHeader>
      <ContractsTable data={contracts} />
    </div>
  );
}
