#!/usr/bin/env tsx

/**
 * Debug Vendor Applications Script
 * 
 * This script checks what vendor applications exist in the database
 * and helps debug why they might not be showing on the dashboard.
 */

import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

async function debugVendorApplications() {
  let client: MongoClient | null = null;
  
  try {
    console.log('🔍 Debugging Vendor Applications...\n');
    
    const uri = process.env.MONGODB_URI;
    if (!uri) {
      console.error('❌ MONGODB_URI not found in environment variables');
      return;
    }
    
    client = new MongoClient(uri);
    await client.connect();
    const db = client.db();
    
    // Get all vendor applications
    const allApplications = await db.collection('vendorApplications').find({}).toArray();
    console.log(`📊 Total vendor applications in database: ${allApplications.length}`);
    
    if (allApplications.length > 0) {
      console.log('\n📋 All Applications:');
      allApplications.forEach((app, index) => {
        console.log(`${index + 1}. ${app.vendorName || app.name} - Status: ${app.status} - Company: ${app.targetCompanyId}`);
      });
    }
    
    // Check for pending applications
    const pendingApplications = await db.collection('vendorApplications').find({
      status: 'pending'
    }).toArray();
    
    console.log(`\n⏳ Pending applications: ${pendingApplications.length}`);
    
    if (pendingApplications.length > 0) {
      console.log('\n📋 Pending Applications Details:');
      pendingApplications.forEach((app, index) => {
        console.log(`${index + 1}. Vendor: ${app.vendorName || app.name}`);
        console.log(`   Email: ${app.email}`);
        console.log(`   Company ID: ${app.targetCompanyId}`);
        console.log(`   Submitted: ${app.submittedAt}`);
        console.log(`   Status: ${app.status}\n`);
      });
    }
    
    // Get all companies to see what company IDs exist
    const companies = await db.collection('companies').find({}).toArray();
    console.log(`🏢 Companies in database: ${companies.length}`);
    
    if (companies.length > 0) {
      console.log('\n🏢 Company IDs:');
      companies.forEach((company, index) => {
        console.log(`${index + 1}. ${company.name} - Company ID: ${company.companyId}`);
      });
    }
    
    console.log('\n✅ Debug completed!');
    
  } catch (error) {
    console.error('❌ Error debugging vendor applications:', error);
  } finally {
    if (client) {
      await client.close();
    }
  }
}

// Run the debug
debugVendorApplications().catch(console.error);
