#!/usr/bin/env tsx

import { MongoClient, ObjectId } from 'mongodb';

const MONGODB_URI = process.env.MONGODB_URI || "mongodb+srv://prod_cluster:EcLpiHXCExNIN5d7@cluster0.swtwvvf.mongodb.net//?retryWrites=true&w=majority&appName=Cluster0";

async function fixCompanyData() {
  let client: MongoClient;
  
  try {
    console.log('🔧 Fixing company data...\n');
    
    client = new MongoClient(MONGODB_URI);
    await client.connect();
    const db = client.db('vendorverse');
    
    // Get all users and companies
    const allUsers = await db.collection('users').find({}).toArray();
    const allCompanies = await db.collection('companies').find({}).toArray();
    
    console.log(`Found ${allUsers.length} users and ${allCompanies.length} companies\n`);
    
    // Fix the existing company to have proper fields
    if (allCompanies.length > 0) {
      const existingCompany = allCompanies[0];
      console.log(`Updating company "${existingCompany.name}" with proper ID fields...`);
      
      // Use the first user's companyId if available, or create a new one
      const companyId = allUsers[0]?.companyId || `company-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      await db.collection('companies').updateOne(
        { _id: existingCompany._id },
        { 
          $set: { 
            id: companyId,
            companyId: companyId,
            updatedAt: new Date().toISOString()
          }
        }
      );
      
      console.log(`✅ Updated company with id: ${companyId}`);
      
      // Update the first user to match this company
      if (allUsers.length > 0) {
        await db.collection('users').updateOne(
          { _id: allUsers[0]._id },
          { $set: { companyId: companyId } }
        );
        console.log(`✅ Updated user ${allUsers[0].email} to use companyId: ${companyId}`);
      }
    }
    
    // For any remaining users without a matching company, create new companies
    for (let i = 1; i < allUsers.length; i++) {
      const user = allUsers[i];
      const userCompanyId = user.companyId;
      
      // Check if this user already has a matching company
      const matchingCompany = allCompanies.find(c => 
        c.id === userCompanyId || c.companyId === userCompanyId
      );
      
      if (!matchingCompany) {
        console.log(`Creating new company for user ${user.email}...`);
        
        // Create a new company for this user
        const newCompany = {
          id: userCompanyId,
          companyId: userCompanyId,
          name: `${user.name}'s Company`,
          businessType: 'Business',
          addresses: [],
          contacts: [{
            id: new ObjectId().toString(),
            name: user.name,
            email: user.email,
            phone: '',
            isPrimary: true
          }],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          createdBy: user._id.toString()
        };
        
        await db.collection('companies').insertOne(newCompany);
        console.log(`✅ Created company for user ${user.email} with id: ${userCompanyId}`);
      }
    }
    
    // Verify the fix
    console.log('\n🔍 Verifying fixes...\n');
    const updatedUsers = await db.collection('users').find({}).toArray();
    const updatedCompanies = await db.collection('companies').find({}).toArray();
    
    console.log('Updated companies:');
    updatedCompanies.forEach((company, index) => {
      console.log(`   ${index + 1}. ${company.name}`);
      console.log(`      id: ${company.id || 'N/A'}`);
      console.log(`      companyId: ${company.companyId || 'N/A'}`);
      console.log('');
    });
    
    console.log('User-Company matches:');
    for (const user of updatedUsers) {
      const matchingCompany = updatedCompanies.find(c => 
        c.id === user.companyId || c.companyId === user.companyId
      );
      
      console.log(`   User ${user.email}: ${matchingCompany ? '✅ Has matching company' : '❌ No match'}`);
    }
    
  } catch (error) {
    console.error('❌ Error fixing company data:', error);
  } finally {
    if (client!) {
      await client.close();
    }
    process.exit(0);
  }
}

fixCompanyData();
