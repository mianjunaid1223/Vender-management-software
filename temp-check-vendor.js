const { MongoClient } = require('mongodb');

// Direct MongoDB URI (from the env file)
const MONGODB_URI = 'mongodb+srv://prod_cluster:EcLpiHXCExNIN5d7@cluster0.swtwvvf.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';

const client = new MongoClient(MONGODB_URI);

async function checkVendorData() {
  try {
    await client.connect();
    const db = client.db();
    
    console.log('=== Checking Vendor Portal Access ===');
    
    const vendorId = '68bdd771268cb3a8a06cec58';
    console.log('Looking for vendorId:', vendorId);
    
    // Check in vendorPortalAccess collection
    const portalAccess = await db.collection('vendorPortalAccess').findOne({
      vendorId: vendorId
    });
    console.log('Portal access in collection:', portalAccess);
    
    // Check in companies collection
    const companies = await db.collection('companies').find({}).toArray();
    console.log(`Found ${companies.length} companies`);
    
    for (const company of companies) {
      console.log(`Company: ${company.name} (${company._id})`);
      if (company.vendorPortalAccess) {
        console.log('Company vendor portal access array:');
        company.vendorPortalAccess.forEach((access, index) => {
          console.log(`  Access ${index}: VendorId=${access.vendorId}, Enabled=${access.enabled}`);
        });
      } else {
        console.log('  No vendorPortalAccess array found');
      }
    }
    
    // Check vendor users
    const vendorUser = await db.collection('vendor_users').findOne({
      vendorId: vendorId
    });
    console.log('Vendor user:', vendorUser ? {
      id: vendorUser._id,
      email: vendorUser.email,
      vendorId: vendorUser.vendorId,
      companyId: vendorUser.companyId,
      isActive: vendorUser.isActive
    } : 'Not found');
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.close();
  }
}

checkVendorData();
