const { MongoClient } = require('mongodb');

async function checkVendorInvites() {
  const uri = 'mongodb+srv://prod_cluster:EcLpiHXCExNIN5d7@cluster0.swtwvvf.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';
  const client = new MongoClient(uri);

  try {
    await client.connect();
    const db = client.db('vendorverse');
    const collection = db.collection('vendorInvites');

    const invites = await collection.find({}).limit(5).toArray();
    
    console.log('📋 Found', invites.length, 'vendor invites:');
    
    invites.forEach((invite, index) => {
      console.log(`\n${index + 1}. Invite ID: ${invite._id}`);
      console.log(`   Vendor: ${invite.vendorName}`);
      console.log(`   Status: ${invite.status}`);
      console.log(`   Created: ${invite.createdAt}`);
      console.log(`   Token format: ${invite.token ? invite.token.substring(0, 50) + '...' : 'No token'}`);
      console.log(`   Token parts: ${invite.token ? invite.token.split('.').length : 'N/A'}`);
      
      if (invite.inviteUrl) {
        const url = new URL(invite.inviteUrl);
        const tokenFromUrl = url.searchParams.get('token');
        console.log(`   URL token: ${tokenFromUrl ? tokenFromUrl.substring(0, 50) + '...' : 'No token in URL'}`);
      }
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.close();
  }
}

checkVendorInvites();
