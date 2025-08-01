import { PageHeader } from "@/components/page-header";
import { VendorApplicationsTable } from "@/components/dashboard/vendor-applications-table";
import { getSession } from "@/lib/auth";
import { getDb } from "@/lib/data";
import { ObjectId } from "mongodb";

async function fetchVendorApplications() {
  const session = await getSession();
  if (!session?.companyId) {
    return [];
  }

  try {
    const db = await getDb();
    const applications = await db.collection('vendorApplications')
      .find({ targetCompanyId: new ObjectId(session.companyId) })
      .sort({ submittedAt: -1 })
      .toArray();

    return JSON.parse(JSON.stringify(applications.map(app => ({
      ...app,
      id: app._id.toString(),
    }))));
  } catch (error) {
    console.error('Error fetching vendor applications:', error);
    return [];
  }
}

export default async function VendorApplicationsPage() {
  const applications = await fetchVendorApplications();
  
  return (
    <div className="space-y-6">
      <PageHeader 
        title="Vendor Applications" 
        description="Review and manage vendor applications submitted to your company."
      />
      
      <VendorApplicationsTable data={applications} />
    </div>
  );
}
