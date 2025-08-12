const crypto = require('crypto');
const { MongoClient, ObjectId } = require('mongodb');
require('dotenv').config({ path: '.env.local' });

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;

function getSecretKey() {
  let encryptionKey = process.env.ENCRYPTION_KEY;
  
  if (!encryptionKey) {
    console.warn('⚠️  ENCRYPTION_KEY not found in environment variables. Using development fallback...');
    const fallbackSeed = process.env.NODE_ENV === 'production' 
      ? 'CHANGE_THIS_IN_PRODUCTION_' + Date.now() 
      : 'development_fallback_key_vendor_management_system_2024';
    encryptionKey = crypto.createHash('sha256').update(fallbackSeed).digest('hex');
    console.warn(`ENCRYPTION_KEY=${encryptionKey}`);
  }
  
  if (encryptionKey.length !== 64) {
    throw new Error('ENCRYPTION_KEY must be a 64-character hex string. Please check your .env.local file.');
  }
  
  return Buffer.from(encryptionKey, 'hex');
}

function encrypt(text) {
  const secretKey = getSecretKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, secretKey, iv);
  const encrypted = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return `${iv.toString('hex')}.${authTag.toString('hex')}.${encrypted.toString('hex')}`;
}

// Create a test vendor invite token
const testInviteData = {
  vendorName: "Test Vendor Co",
  companyId: "test-company-123",
  companyName: "Test Company Inc",
  email: "vendor@testcompany.com",
  expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
  timestamp: Date.now()
};

console.log('🎯 Creating complete vendor invite (token + database record)...');
console.log('Invite data:', testInviteData);

const token = encrypt(JSON.stringify(testInviteData));
console.log('\n✅ Token created successfully!');
console.log('Token length:', token.length);
console.log('Token preview:', token.substring(0, 50) + '...');

// Now create the complete vendor invite record in the database
async function createCompleteInvite() {
  try {
    const client = new MongoClient(process.env.MONGODB_URI);
    await client.connect();
    const db = client.db();

    // First, ensure we have a company record
    const companyId = testInviteData.companyId;
    const existingCompany = await db.collection('companies').findOne({ companyId });
    
    if (!existingCompany) {
      console.log('📝 Creating company record...');
      await db.collection('companies').insertOne({
        companyId: companyId,
        name: testInviteData.companyName,
        createdAt: new Date()
      });
      console.log('✅ Company created');
    } else {
      console.log('✅ Company already exists');
    }

    // Create the vendor invite record
    const baseUrl = 'http://localhost:9002';
    const inviteUrl = `${baseUrl}/vendor-register?token=${encodeURIComponent(token)}`;
    
    const inviteRecord = {
      _id: new ObjectId(),
      vendorName: testInviteData.vendorName,
      companyId: testInviteData.companyId,
      companyName: testInviteData.companyName,
      email: testInviteData.email,
      message: 'Test vendor invitation for debugging',
      token: token,
      inviteUrl: inviteUrl,
      status: 'active',
      used: false,
      createdAt: new Date(),
      expiresAt: new Date(testInviteData.expiresAt),
      emailSent: false
    };

    console.log('📝 Creating vendor invite record...');
    await db.collection('vendorInvites').insertOne(inviteRecord);
    console.log('✅ Vendor invite record created!');

    console.log('\n🔗 Complete vendor registration URL:');
    console.log(inviteUrl);

    console.log('\n📋 Test the status API:');
    console.log(`${baseUrl}/api/vendor/status?token=${encodeURIComponent(token)}`);

    await client.close();
    console.log('\n🎉 Setup complete! The vendor registration should now work properly.');
    
  } catch (error) {
    console.error('❌ Error creating invite:', error);
  }
}

createCompleteInvite();
