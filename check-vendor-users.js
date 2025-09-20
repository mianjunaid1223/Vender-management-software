const { MongoClient } = require('mongodb');

async function checkVendorUsers() {
  const client = new MongoClient(process.env.MONGODB_URI || 'mongodb://localhost:27017/vendordb');
  
  try {
    await client.connect();
    const db = client.db();
    
    console.log('Checking vendor users...');
    const users = await db.collection('vendor_users').find({}).toArray();
    console.log('Found', users.length, 'vendor users:');
    
    users.forEach(user => {
      console.log(`- ID: ${user._id}`);
      console.log(`  Email: ${user.email}`);
      console.log(`  Vendor ID: ${user.vendorId}`);
      console.log(`  Company ID: ${user.companyId}`);
      console.log(`  Active: ${user.isActive}`);
      console.log(`  Has Password: ${!!user.password || !!user.passwordHash}`);
      console.log('---');
    });

    console.log('\nChecking companies with vendor portal access...');
    const companies = await db.collection('companies').find({
      vendorPortalAccess: { $exists: true, $ne: [] }
    }).toArray();
    
    console.log('Found', companies.length, 'companies with vendor portal access:');
    companies.forEach(company => {
      console.log(`- Company ID: ${company._id}`);
      console.log(`  Vendor Portal Access:`, company.vendorPortalAccess?.map(access => ({
        vendorId: access.vendorId,
        enabled: access.enabled,
        expired: access.expiresAt && new Date() > new Date(access.expiresAt)
      })));
      console.log('---');
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.close();
  }
}

checkVendorUsers();
