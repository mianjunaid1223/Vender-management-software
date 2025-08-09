const { MongoClient, ObjectId } = require('mongodb');

async function debugVendorApps() {
  const client = new MongoClient(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/vendor-management');
  
  try {
    await client.connect();
    const db = client.db();
    
    console.log('=== Debugging Vendor Applications ===');
    
    // Check all vendor applications
    const allApps = await db.collection('vendorApplications').find({}).toArray();
    console.log('\nAll vendor applications in database:');
    allApps.forEach(app => {
      console.log(`- ID: ${app._id}`);
      console.log(`  Application ID: ${app.applicationId}`);
      console.log(`  Vendor Name: ${app.vendorName || app.name}`);
      console.log(`  Status: ${app.status}`);
      console.log(`  Target Company ID: ${app.targetCompanyId}`);
      console.log(`  Email: ${app.email}`);
      console.log('---');
    });
    
    // Check companies
    const companies = await db.collection('companies').find({}).toArray();
    console.log('\nAll companies in database:');
    companies.forEach(company => {
      console.log(`- ID: ${company._id}`);
      console.log(`  Name: ${company.name}`);
      console.log(`  Email: ${company.email}`);
      console.log('---');
    });
    
    // Check if any company matches the target company ID
    const targetCompanyId = '6882b221d45aaff377bd63e5';
    const targetCompany = await db.collection('companies').findOne({ _id: new ObjectId(targetCompanyId) });
    console.log(`\nTarget Company (${targetCompanyId}):`, targetCompany);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.close();
  }
}

debugVendorApps();
