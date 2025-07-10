import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/page-header";
import { ComplianceTable } from "@/components/dashboard/compliance-table";
import { Shield, Upload } from "lucide-react";
import { fetchComplianceDocuments } from "@/lib/data";

export default async function CompliancePage() {
  const complianceDocuments = await fetchComplianceDocuments();
  
  return (
    <div>
      <PageHeader 
        title="Compliance" 
        description="Monitor vendor compliance documents and certifications."
      >
        <Button>
          <Upload className="mr-2 h-4 w-4" />
          Upload Document
        </Button>
      </PageHeader>
      <ComplianceTable data={complianceDocuments} />
    </div>
  );
}
