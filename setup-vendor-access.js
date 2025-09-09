const { MongoClient, ObjectId } = require('mongodb');

// Direct MongoDB URI (from the env file)
const MONGODB_URI = 'mongodb+srv://prod_cluster:EcLpiHXCExNIN5d7@cluster0.swtwvvf.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';

const client = new MongoClient(MONGODB_URI);

async function setupVendorAccess() {
  try {
    await client.connect();
    const db = client.db();
    
    console.log('=== Setting up Vendor Portal Access ===');
    
    const vendorId = '68bdd771268cb3a8a06cec58';
    const companyId = '68bdcf5b3659db777e755f44';
    
    // Create company if it doesn't exist
    const existingCompany = await db.collection('companies').findOne({
      _id: new ObjectId(companyId)
    });
    
    if (!existingCompany) {
      console.log('Creating company...');
      await db.collection('companies').insertOne({
        _id: new ObjectId(companyId),
        name: 'Test Company',
        email: 'admin@testcompany.com',
        industry: 'Technology',
        address: '123 Test St',
        createdAt: new Date(),
        vendorPortalAccess: []
      });
      console.log('Company created');
    } else {
      console.log('Company already exists');
    }
    
    // Create vendor user if it doesn't exist
    const existingVendorUser = await db.collection('vendor_users').findOne({
      vendorId: vendorId
    });
    
    if (!existingVendorUser) {
      console.log('Creating vendor user...');
      const bcrypt = require('bcryptjs');
      const hashedPassword = await bcrypt.hash('password123', 10);
      
      await db.collection('vendor_users').insertOne({
        _id: new ObjectId('68bddb00268cb3a8a06cec5f'),
        vendorId: vendorId,
        companyId: companyId,
        email: 'mianjunaid2312@gmail.com',
        name: 'Mian Junaid',
        password: hashedPassword,
        role: 'vendor_user',
        isActive: true,
        createdAt: new Date()
      });
      console.log('Vendor user created');
    } else {
      console.log('Vendor user already exists');
    }
    
    // Create portal access record
    const existingAccess = await db.collection('vendorPortalAccess').findOne({
      vendorId: vendorId,
      companyId: companyId
    });
    
    if (!existingAccess) {
      console.log('Creating portal access record...');
      await db.collection('vendorPortalAccess').insertOne({
        vendorId: vendorId,
        companyId: companyId,
        portalAccess: true,
        grantedAt: new Date(),
        grantedBy: 'system',
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
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
        createdAt: new Date(),
        updatedAt: new Date()
      });
      console.log('Portal access created');
    } else {
      console.log('Portal access already exists, updating...');
      await db.collection('vendorPortalAccess').updateOne(
        { vendorId: vendorId, companyId: companyId },
        {
          $set: {
            portalAccess: true,
            expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
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
            updatedAt: new Date()
          }
        }
      );
      console.log('Portal access updated');
    }
    
    console.log('=== Setup Complete ===');
    
    // Verify the setup
    const verifyAccess = await db.collection('vendorPortalAccess').findOne({
      vendorId: vendorId,
      companyId: companyId
    });
    console.log('Verified portal access:', {
      portalAccess: verifyAccess.portalAccess,
      expiresAt: verifyAccess.expiresAt,
      features: Object.keys(verifyAccess.features || {})
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.close();
  }
}

setupVendorAccess();
