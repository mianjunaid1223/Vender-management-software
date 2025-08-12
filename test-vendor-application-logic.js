#!/usr/bin/env node

const fetch = require('node-fetch');

// Configuration
const BASE_URL = 'http://localhost:9002'; // Adjust as needed
const TEST_EMAIL = 'mianjunaid0001@gmail.com';
const TEST_VENDOR_NAME = 'Test Vendor Company';
const COMPANY_ID = '6882b221d45aaff377bd63e5'; // From your data
const COMPANY_NAME = 'Zstronics';

async function testVendorApplicationLogic() {
  console.log('🧪 Testing Vendor Application Logic\n');
  
  // Test 1: Submit a new application
  console.log('📝 Test 1: Submitting new application...');
  try {
    const response = await fetch(`${BASE_URL}/api/vendor/applications`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        vendorName: TEST_VENDOR_NAME,
        companyId: COMPANY_ID,
        contactPerson: 'John Doe',
        email: TEST_EMAIL,
        phone: '+1-555-0123',
        service: 'Web Development',
        taxId: 'TAX123456',
        address: {
          street: '123 Test St',
          city: 'Test City',
          state: 'TS',
          zipCode: '12345',
          country: 'United States'
        },
        paymentTerms: 'Net 30',
        notes: 'Test application'
      }),
    });

    const result = await response.json();
    
    if (response.ok) {
      console.log('✅ Application submitted successfully:', result.applicationId);
    } else {
      console.log('❌ Application failed:', result.error);
    }
  } catch (error) {
    console.log('💥 Error:', error.message);
  }

  // Test 2: Try to submit the same application again (should fail)
  console.log('\n📝 Test 2: Submitting duplicate application (should fail)...');
  try {
    const response = await fetch(`${BASE_URL}/api/vendor/applications`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        vendorName: TEST_VENDOR_NAME,
        companyId: COMPANY_ID,
        contactPerson: 'John Doe',
        email: TEST_EMAIL,
        phone: '+1-555-0123',
        service: 'Web Development',
        taxId: 'TAX123456',
        address: {
          street: '123 Test St',
          city: 'Test City',
          state: 'TS',
          zipCode: '12345',
          country: 'United States'
        },
        paymentTerms: 'Net 30',
        notes: 'Duplicate test application'
      }),
    });

    const result = await response.json();
    
    if (response.ok) {
      console.log('❌ Unexpected: Duplicate application was accepted:', result.applicationId);
    } else {
      console.log('✅ Expected: Duplicate application rejected:', result.error);
      if (result.existingApplication) {
        console.log('   Existing application details:', result.existingApplication);
      }
    }
  } catch (error) {
    console.log('💥 Error:', error.message);
  }

  // Test 3: Try with different company (should work)
  console.log('\n📝 Test 3: Submitting application for different company...');
  try {
    const response = await fetch(`${BASE_URL}/api/vendor/applications`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        vendorName: TEST_VENDOR_NAME,
        companyId: 'different-company-id', // Different company
        contactPerson: 'John Doe',
        email: TEST_EMAIL,
        phone: '+1-555-0123',
        service: 'Web Development',
        taxId: 'TAX123456',
        address: {
          street: '123 Test St',
          city: 'Test City',
          state: 'TS',
          zipCode: '12345',
          country: 'United States'
        },
        paymentTerms: 'Net 30',
        notes: 'Test application for different company'
      }),
    });

    const result = await response.json();
    
    if (response.ok) {
      console.log('✅ Application for different company accepted:', result.applicationId);
    } else {
      console.log('❌ Application for different company failed:', result.error);
    }
  } catch (error) {
    console.log('💥 Error:', error.message);
  }

  console.log('\n🎯 Test Summary:');
  console.log('1. New applications should be accepted');
  console.log('2. Duplicate applications for same company should be rejected');
  console.log('3. Applications for different companies should be accepted');
  console.log('4. Error messages should include company name and context');
}

// Run the test
if (require.main === module) {
  testVendorApplicationLogic().catch(console.error);
}

module.exports = { testVendorApplicationLogic };
