const { MongoClient, ObjectId } = require('mongodb');

// Direct MongoDB URI (from the env file)
const MONGODB_URI = 'mongodb+srv://prod_cluster:EcLpiHXCExNIN5d7@cluster0.swtwvvf.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';

const client = new MongoClient(MONGODB_URI);

async function updateVendorFeatures() {
  try {
    await client.connect();
    const db = client.db();
    
    console.log('=== Updating Vendor Portal Features ===');
    
    const vendorId = '68bdd771268cb3a8a06cec58';
    const companyId = '68bdcf5b3659db777e755f44';
    
    // Update portal access features to only include the 8 supported features
    const result = await db.collection('vendorPortalAccess').updateOne(
      { vendorId: vendorId, companyId: companyId },
      {
        $set: {
          features: {
            viewInvoices: true,
            downloadInvoices: true,
            uploadInvoices: true,
            editProfile: true,
            viewContracts: true,
            createContracts: true,
            manageVendors: true,
            uploadDocuments: true
          },
          // Add access level information for each feature
          featureAccessLevels: {
            viewInvoices: 'read',
            downloadInvoices: 'read', 
            uploadInvoices: 'create',
            editProfile: 'edit',
            viewContracts: 'read',
            createContracts: 'create',
            manageVendors: 'edit,create',
            uploadDocuments: 'create'
          },
          updatedAt: new Date()
        }
      }
    );
    
    console.log('Updated portal access features:', result.modifiedCount > 0 ? 'Success' : 'No changes needed');
    
    // Also update the company's vendorPortalAccess array if it exists
    await db.collection('companies').updateOne(
      { 
        _id: new ObjectId(companyId),
        'vendorPortalAccess.vendorId': vendorId 
      },
      {
        $set: {
          'vendorPortalAccess.$.features': [
            'view_invoices',
            'download_invoices', 
            'upload_invoices',
            'edit_profile',
            'view_contracts',
            'create_contracts',
            'manage_vendors',
            'upload_documents'
          ],
          'vendorPortalAccess.$.updatedAt': new Date()
        }
      }
    );
    
    console.log('Updated company vendor portal access array');
    
    // Verify the update
    const verifyAccess = await db.collection('vendorPortalAccess').findOne({
      vendorId: vendorId,
      companyId: companyId
    });
    
    console.log('Verified updated features:', Object.keys(verifyAccess.features || {}));
    console.log('Access levels:', verifyAccess.featureAccessLevels);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.close();
  }
}

updateVendorFeatures();
