import { ObjectId } from 'mongodb';
import bcrypt from 'bcryptjs';
import { getDb } from '../src/lib/data';

async function checkVendorData() {
  try {
    const db = await getDb();
    console.log('=== Checking Vendor Data ===');

    // Check companies
    const companies = await db.collection('companies').find({}).toArray();
    console.log(`Found ${companies.length} companies`);

    // Check vendors
    const vendors = await db.collection('vendors').find({}).toArray();
    console.log(`Found ${vendors.length} vendors`);

    // Check vendor users
    const vendorUsers = await db.collection('vendor_users').find({}).toArray();
    console.log(`Found ${vendorUsers.length} vendor users`);

    // Check for portal access
    for (const company of companies) {
      console.log(`Company ${company.name}: Portal access entries: ${company.vendorPortalAccess?.length || 0}`);
      if (company.vendorPortalAccess) {
        company.vendorPortalAccess.forEach((access: any, index: number) => {
          console.log(`  Access ${index}: Vendor ${access.vendorId}, Enabled: ${access.enabled}`);
        });
      }
    }

    // If no test data exists, create some
    if (companies.length === 0 || vendors.length === 0 || vendorUsers.length === 0) {
      console.log('Creating test data...');
      await createTestData(db);
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    // Connection is managed by getDb()/clientPromise
  }
}

async function createTestData(db: any) {
  // Create a test company
  const companyId = new ObjectId();
  const company = {
    _id: companyId,
    name: 'Test Company Inc.',
    industry: 'Technology',
    address: '123 Business Street, City, State 12345',
    createdAt: new Date().toISOString(),
    vendorPortalAccess: []
  };

  await db.collection('companies').insertOne(company);
  console.log('Created test company');

  // Create a test vendor
  const vendorId = 'vendor_' + Date.now();
  const vendor = {
    _id: new ObjectId(),
    vendorId,
    companyId: companyId.toString(),
    name: 'Test Vendor LLC',
    email: 'vendor@test.com',
    status: 'active',
    createdAt: new Date().toISOString()
  };

  await db.collection('vendors').insertOne(vendor);
  console.log('Created test vendor');

  // Create a test vendor user
  const userId = new ObjectId();
  const vendorUser = {
    _id: userId,
    vendorId,
    companyId: companyId.toString(),
    email: 'vendor@test.com',
    firstName: 'John',
    lastName: 'Vendor',
    passwordHash: await bcrypt.hash('password123', 10),
    isActive: true,
    role: 'primary_contact',
    permissions: ['manage_invoices', 'view_contracts'],
    loginCount: 0,
    lastLoginAt: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  await db.collection('vendor_users').insertOne(vendorUser);
  console.log('Created test vendor user');

  // Add portal access for the vendor
  await db.collection('companies').updateOne(
    { _id: companyId },
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
    }
  );

  console.log('Added portal access for vendor');
  
  // Only show test credentials in non-production environments for security
  // This prevents credentials from being exposed in production logs
  if (process.env.NODE_ENV !== 'production') {
    console.log('=== Test Credentials (DEV) ===');
    console.log('Email: vendor@test.com');
    console.log('Password: password123');
    console.log('==============================');
  } else {
    console.log('Test credentials created (not printed in production).');
  }
}

checkVendorData();
