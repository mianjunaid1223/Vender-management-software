import { MongoClient } from 'mongodb';
import { MOCK_INVOICES, MOCK_VENDORS, MOCK_CONTRACTS } from '../lib/mock-data';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error('Please define the MONGODB_URI environment variable');
}

async function seedDatabase() {
  if (!MONGODB_URI || MONGODB_URI.includes('your_username')) {
    console.log('❌ MongoDB connection string not configured properly.');
    console.log('Please update your .env.local file with a valid MongoDB URI.');
    return;
  }

  console.log('🌱 Starting database seeding...');
  
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('✅ Connected to MongoDB');
    
    const db = client.db('vendorverse');
    
    // Clear existing data
    console.log('🧹 Clearing existing data...');
    await Promise.all([
      db.collection('invoices').deleteMany({}),
      db.collection('vendors').deleteMany({}),
      db.collection('contracts').deleteMany({}),
    ]);
    
    // Seed vendors
    console.log('📝 Seeding vendors...');
    const vendorResult = await db.collection('vendors').insertMany(MOCK_VENDORS);
    console.log(`✅ Inserted ${vendorResult.insertedCount} vendors`);
    
    // Seed contracts
    console.log('📋 Seeding contracts...');
    const contractResult = await db.collection('contracts').insertMany(MOCK_CONTRACTS);
    console.log(`✅ Inserted ${contractResult.insertedCount} contracts`);
    
    // Seed invoices
    console.log('🧾 Seeding invoices...');
    const invoiceResult = await db.collection('invoices').insertMany(MOCK_INVOICES);
    console.log(`✅ Inserted ${invoiceResult.insertedCount} invoices`);
    
    // Create a default user
    console.log('👤 Creating default user...');
    const existingUser = await db.collection('users').findOne({});
    if (!existingUser) {
      await db.collection('users').insertOne({
        name: 'Admin User',
        email: 'admin@vendormanagement.com',
        image: 'https://placehold.co/100x100.png?text=A',
        createdAt: new Date().toISOString(),
      });
      console.log('✅ Created default user');
    } else {
      console.log('✅ User already exists');
    }
    
    console.log('🎉 Database seeding completed successfully!');
    console.log('📊 Summary:');
    console.log(`   - ${vendorResult.insertedCount} vendors`);
    console.log(`   - ${contractResult.insertedCount} contracts`);
    console.log(`   - ${invoiceResult.insertedCount} invoices`);
    console.log(`   - 1 user`);
    
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('ENOTFOUND')) {
        console.log('\n💡 This looks like a connection issue. Please check:');
        console.log('   1. Your MongoDB connection string is correct');
        console.log('   2. Your IP address is whitelisted in MongoDB Atlas');
        console.log('   3. Your username and password are correct');
      }
    }
  } finally {
    await client.close();
    console.log('🔌 Disconnected from MongoDB');
  }
}

// Run the seeding script
seedDatabase().catch(console.error);
