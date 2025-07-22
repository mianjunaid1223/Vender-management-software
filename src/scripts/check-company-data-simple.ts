#!/usr/bin/env tsx

import { MongoClient } from 'mongodb';

const MONGODB_URI = process.env.MONGODB_URI || "mongodb+srv://prod_cluster:EcLpiHXCExNIN5d7@cluster0.swtwvvf.mongodb.net//?retryWrites=true&w=majority&appName=Cluster0";

async function checkCompanyData() {
  let client: MongoClient;
  
  try {
    console.log('🔍 Checking company data...\n');
    
    client = new MongoClient(MONGODB_URI);
    await client.connect();
    const db = client.db('vendorverse');
    
    // Check all companies in database
    const allCompanies = await db.collection('companies').find({}).toArray();
    console.log(`📊 Total companies in database: ${allCompanies.length}`);
    
    if (allCompanies.length > 0) {
      console.log('\n📋 All companies:');
      allCompanies.forEach((company, index) => {
        console.log(`   ${index + 1}. Company ID: ${company._id}`);
        console.log(`      Name: ${company.name || 'N/A'}`);
        console.log(`      id field: ${company.id || 'N/A'}`);
        console.log(`      companyId field: ${company.companyId || 'N/A'}`);
        console.log(`      createdBy: ${company.createdBy || 'N/A'}`);
        console.log(`      businessType: ${company.businessType || 'N/A'}`);
        console.log('');
      });
    }
    
    // Check all users to see their company associations
    const allUsers = await db.collection('users').find({}).toArray();
    console.log(`👥 Total users in database: ${allUsers.length}`);
    
    if (allUsers.length > 0) {
      console.log('\n📋 All users:');
      allUsers.forEach((user, index) => {
        console.log(`   ${index + 1}. User ID: ${user._id}`);
        console.log(`      Name: ${user.name || 'N/A'}`);
        console.log(`      Email: ${user.email || 'N/A'}`);
        console.log(`      Company ID: ${user.companyId || 'N/A'}`);
        console.log('');
      });
    }
    
    // Find which users have matching companies
    if (allUsers.length > 0 && allCompanies.length > 0) {
      console.log('\n🔗 User-Company Matches:');
      for (const user of allUsers) {
        if (!user.companyId) {
          console.log(`   User ${user.email}: No companyId assigned`);
          continue;
        }
        
        const matchById = allCompanies.find(c => c.id === user.companyId);
        const matchByCompanyId = allCompanies.find(c => c.companyId === user.companyId);
        
        if (matchById || matchByCompanyId) {
          console.log(`   User ${user.email}: ✅ Has matching company`);
        } else {
          console.log(`   User ${user.email}: ❌ No matching company found for companyId: ${user.companyId}`);
        }
      }
    }
    
  } catch (error) {
    console.error('❌ Error checking company data:', error);
  } finally {
    if (client!) {
      await client.close();
    }
    process.exit(0);
  }
}

checkCompanyData();
