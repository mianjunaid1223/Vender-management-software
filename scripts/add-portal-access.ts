import { ObjectId } from 'mongodb';
import { getDb } from '../src/lib/data';

// Type definitions
interface VendorPortalAccess {
  vendorId: string;
  enabled: boolean;
  features: {
    invoiceManagement: boolean;
    contractManagement: boolean;
    profileManagement: boolean;
    communicationTools: boolean;
    complianceTracking: boolean;
    canViewInvoices: boolean;
    canUploadInvoices: boolean;
    canViewContracts: boolean;
    canSignContracts: boolean;
  };
  restrictions: {
    sessionTimeout: number;
    requireMFA: boolean;
    allowedIPs: string[];
  };
  createdAt: string;
  updatedAt: string;
}

interface Company {
  _id: ObjectId;
  name: string;
  vendorPortalAccess?: VendorPortalAccess[];
}

// Get configuration from environment variables or command line arguments
function getConfiguration() {
  const args = process.argv.slice(2);
  
  let vendorId = process.env.VENDOR_ID;
  let companyId = process.env.COMPANY_ID;
  
  // Check for command line arguments
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--vendorId' && i + 1 < args.length) {
      vendorId = args[i + 1];
    } else if (args[i] === '--companyId' && i + 1 < args.length) {
      companyId = args[i + 1];
    }
  }
  
  // Positional arguments support
  if (!vendorId && args[0]) vendorId = args[0];
  if (!companyId && args[1]) companyId = args[1];
  
  if (!vendorId || !companyId) {
    console.error('Usage: tsx add-portal-access.ts [vendorId] [companyId]');
    console.error('   Or: VENDOR_ID=xxx COMPANY_ID=yyy tsx add-portal-access.ts');
    console.error('   Or: tsx add-portal-access.ts --vendorId xxx --companyId yyy');
    console.error('\nBoth vendorId and companyId are required.');
    process.exit(1);
  }
  
  return { vendorId: vendorId.trim(), companyId: companyId.trim() };
}

async function addPortalAccess() {
  try {
    const { vendorId, companyId } = getConfiguration();
    const db = await getDb();

    console.log('Adding portal access for vendor:', vendorId);
    console.log('Company ID:', companyId);

    // Check if company exists
    const company = await db.collection('companies').findOne({
      _id: new ObjectId(companyId)
    }) as Company | null;

    if (!company) {
      console.log('Company not found!');
      return;
    }

    console.log('Company found:', company.name);

    // Check if portal access already exists
    const existingAccess = company.vendorPortalAccess?.find(
      (access: VendorPortalAccess) => access.vendorId === vendorId
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
      
      const newPortalAccess: VendorPortalAccess = {
        vendorId,
        enabled: true,
        features: {
          invoiceManagement: true,
          contractManagement: true,
          profileManagement: true,
          communicationTools: true,
          complianceTracking: true,
          canViewInvoices: true,
          canUploadInvoices: true,
          canViewContracts: true,
          canSignContracts: true
        },
        restrictions: {
          sessionTimeout: 8,
          requireMFA: false,
          allowedIPs: []
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      // Add new portal access
      await db.collection('companies').updateOne(
        { _id: new ObjectId(companyId) },
        {
          $push: {
            vendorPortalAccess: newPortalAccess as any
          }
        }
      );
    }

    console.log('Portal access configured successfully!');
    
    // Verify the update
    const updatedCompany = await db.collection('companies').findOne({
      _id: new ObjectId(companyId)
    }) as Company | null;

    const portalAccess = updatedCompany?.vendorPortalAccess?.find(
      (access: VendorPortalAccess) => access.vendorId === vendorId
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
