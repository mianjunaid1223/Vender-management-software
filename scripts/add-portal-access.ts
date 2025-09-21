import { ObjectId } from 'mongodb';
import { getDb } from '../src/lib/data';

async function addPortalAccess() {
  try {
    const db = await getDb();
    const vendorId = '68bdd771268cb3a8a06cec58';
    const companyId = '68bdcf5b3659db777e755f44';

    console.log('Adding portal access for vendor:', vendorId);
    console.log('Company ID:', companyId);

    // Check if company exists
    const company = await db.collection('companies').findOne({
      _id: new ObjectId(companyId)
    });

    if (!company) {
      console.log('Company not found!');
      return;
    }

    console.log('Company found:', company.name);

    // Check if portal access already exists
    const existingAccess = company.vendorPortalAccess?.find(
      (access: any) => access.vendorId === vendorId
    );

    if (existingAccess) {
      console.log('Portal access already exists. Updating...');
      
      // Update existing access
      await db.collection('companies').updateOne(
        { 
          _id: new ObjectId(companyId),
          'vendorPortalAccess.vendorId': vendorId
        },
        {
          $set: {
            'vendorPortalAccess.$.enabled': true,
            'vendorPortalAccess.$.features': {
              viewInvoices: true,
              downloadInvoices: true,
              updatePaymentInfo: true,
              viewContracts: true,
              communicateWithBuyer: true,
              viewComplianceRequirements: true,
              uploadDocuments: true
            },
            'vendorPortalAccess.$.updatedAt': new Date().toISOString()
          }
        }
      );
    } else {
      console.log('Creating new portal access...');
      
      // Add new portal access
      await db.collection('companies').updateOne(
        { _id: new ObjectId(companyId) },
        {
          $push: {
            vendorPortalAccess: {
              vendorId,
              enabled: true,
              features: {
                viewInvoices: true,
                downloadInvoices: true,
                updatePaymentInfo: true,
                viewContracts: true,
                communicateWithBuyer: true,
                viewComplianceRequirements: true,
                uploadDocuments: true
              },
              sessionTimeout: 8,
              requireMFA: false,
              allowedIPs: [],
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            }
          }
        } as any
      );
    }

    console.log('Portal access configured successfully!');
    
    // Verify the update
    const updatedCompany = await db.collection('companies').findOne({
      _id: new ObjectId(companyId)
    });

    const portalAccess = updatedCompany?.vendorPortalAccess?.find(
      (access: any) => access.vendorId === vendorId
    );

    console.log('Verification - Portal access found:', !!portalAccess);
    console.log('Verification - Portal access enabled:', portalAccess?.enabled);

  } catch (error) {
    console.error('Error:', error);
  }
}

// Export for use in API route
export { addPortalAccess };

// Run if called directly
if (require.main === module) {
  addPortalAccess();
}
