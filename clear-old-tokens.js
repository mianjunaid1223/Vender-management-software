const { MongoClient } = require('mongodb');

async function clearOldTokens() {
  const uri = 'mongodb+srv://prod_cluster:EcLpiHXCExNIN5d7@cluster0.swtwvvf.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';
  const client = new MongoClient(uri);

  try {
    await client.connect();
    const db = client.db('vendorverse');
    const collection = db.collection('vendorInvites');

    console.log('🧹 Cleaning up old incompatible vendor invites...');
    
    // Update all invites to mark them as expired (preserving data)
    const result = await collection.updateMany(
      { status: { $in: ['active', 'pending'] } },
      { 
        $set: { 
          status: 'expired_old_format',
          expiredReason: 'Incompatible encryption key - regenerate invite',
          expiredAt: new Date()
        }
      }
    );

    console.log(`✅ Updated ${result.modifiedCount} old invites to expired status`);
    console.log('💡 Users will need to generate new vendor invites');
    
    // Show the updated invites
    const expiredInvites = await collection.find({ status: 'expired_old_format' }).toArray();
    console.log('\n📋 Expired invites:');
    expiredInvites.forEach(invite => {
      console.log(`  - ${invite.vendorName} (${invite.email}) - was created ${invite.createdAt}`);
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.close();
  }
}

clearOldTokens();
