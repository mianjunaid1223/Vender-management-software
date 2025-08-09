import { PageHeader } from "@/components/page-header";
import { VendorApplicationsTable } from "@/components/dashboard/vendor-applications-table";
import { getSession } from "@/lib/auth";
import { getDb } from "@/lib/data";
import { ObjectId } from "mongodb";

async function fetchVendorApplications() {
  const session = await getSession();
  console.log('Session in fetchVendorApplications:', session);
  
  if (!session?.companyId) {
    console.log('No session or companyId found');
    return [];
  }

  try {
    const db = await getDb();
    
    // Try multiple approaches to find applications
    console.log('Trying to find applications for companyId:', session.companyId);
    
    // First try with ObjectId conversion
    let applications = await db.collection('vendorApplications')
      .find({ targetCompanyId: new ObjectId(session.companyId) })
      .sort({ submittedAt: -1 })
      .toArray();
    
    console.log('Found with ObjectId:', applications.length);
    
    // If no results, try with string comparison
    if (applications.length === 0) {
      applications = await db.collection('vendorApplications')
        .find({ targetCompanyId: session.companyId })
        .sort({ submittedAt: -1 })
        .toArray();
      console.log('Found with string:', applications.length);
    }
    
    // If still no results, get all applications and log them
    if (applications.length === 0) {
      const allApps = await db.collection('vendorApplications').find({}).toArray();
      console.log('All applications in DB:', allApps.map(app => ({
        id: app._id.toString(),
        targetCompanyId: app.targetCompanyId?.toString(),
        status: app.status
      })));
      
      // Try to find applications where targetCompanyId matches as string
      applications = allApps.filter(app => 
        app.targetCompanyId?.toString() === session.companyId ||
        app.targetCompanyId === session.companyId
      );
      console.log('Found by manual filtering:', applications.length);
    }

    console.log('Final applications:', applications.length);
    console.log('Session companyId:', session.companyId);
    console.log('Applications:', applications.map(app => ({
      id: app._id.toString(),
      applicationId: app.applicationId,
      status: app.status,
      targetCompanyId: app.targetCompanyId?.toString()
    })));

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
