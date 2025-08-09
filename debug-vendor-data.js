const { MongoClient } = require('mongodb');
require('dotenv').config({ path: '.env.local' });

async function checkVendors() {
  const uri = process.env.MONGODB_URI;
  
  if (!uri) {
    console.error('MONGODB_URI not found in environment');
    return;
  }
  
  console.log('Using MongoDB URI:', uri.substring(0, 20) + '...');
  
  const client = new MongoClient(uri);
  try {
    await client.connect();
    console.log('Connected successfully');
    
    const db = client.db('vendorverse');
    console.log('\n=== Checking vendors collection ===');
    
    const count = await db.collection('vendors').countDocuments();
    console.log('Total vendors:', count);
    
    if (count > 0) {
      // Check first vendor
      const sample = await db.collection('vendors').findOne();
      console.log('\nSample vendor structure:');
      console.log('Fields available:', Object.keys(sample));
      console.log('Email:', sample.email);
      console.log('Status:', sample.status);
      console.log('Has vendorPin:', 'vendorPin' in sample);
      
      if (sample.vendorPin) {
        console.log('VendorPin format:', typeof sample.vendorPin, 'length:', sample.vendorPin?.length);
      }
      
      // Check for the specific email that was being tested
      console.log('\n=== Checking for specific vendor ===');
      const specificVendor = await db.collection('vendors').findOne({ 
        email: 'mianjunaid2312@gmail.com' 
      });
      
      if (specificVendor) {
        console.log('Found vendor with email mianjunaid2312@gmail.com:');
        console.log('Name:', specificVendor.name);
        console.log('Status:', specificVendor.status);
        console.log('Has vendorPin:', 'vendorPin' in specificVendor);
        console.log('VendorPin:', specificVendor.vendorPin);
      } else {
        console.log('No vendor found with email mianjunaid2312@gmail.com');
        
        // Show all vendor emails for debugging
        const allVendors = await db.collection('vendors').find({}, { 
          projection: { email: 1, name: 1, vendorPin: 1, status: 1 } 
        }).toArray();
        console.log('\nAll vendors in database:');
        allVendors.forEach(v => {
          console.log(`- ${v.name}: ${v.email} (PIN: ${v.vendorPin || 'NONE'}, Status: ${v.status})`);
        });
      }
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.close();
  }
}

checkVendors().catch(console.error);
