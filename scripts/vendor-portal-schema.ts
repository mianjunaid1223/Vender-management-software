import { getDb } from '@/shared/lib/data';

// Database schema enhancement for vendor portal functionality
// This script creates new collections and indexes for vendor portal features

async function enhanceSchema() {
  const db = await getDb();
  
  console.log('Starting database schema enhancement for vendor portal...');

  try {
    // 1. Create vendor_portal_access collection (check if exists first)
    const collections = await db.listCollections({ name: 'vendor_portal_access' }).toArray();
    if (collections.length === 0) {
      await db.createCollection('vendor_portal_access');
    }
    await db.collection('vendor_portal_access').createIndexes([
      { key: { vendorId: 1, companyId: 1 }, unique: true },
      { key: { companyId: 1 } },
      { key: { enabled: 1 } },
      { key: { createdAt: 1 } }
    ]);
    console.log('✓ Created vendor_portal_access collection with indexes');

    // 2. Create vendor_users collection (check if exists first)
    const vendorUsersCollections = await db.listCollections({ name: 'vendor_users' }).toArray();
    if (vendorUsersCollections.length === 0) {
      await db.createCollection('vendor_users');
    }
    await db.collection('vendor_users').createIndexes([
      { key: { email: 1 }, unique: true },
      { key: { vendorId: 1, companyId: 1 } },
      { key: { companyId: 1 } },
      { key: { isActive: 1 } },
      { key: { createdAt: 1 } }
    ]);
    console.log('✓ Created vendor_users collection with indexes');

    // 3. Create vendor_sessions collection
    await db.createCollection('vendor_sessions');
    await db.collection('vendor_sessions').createIndexes([
      { key: { sessionToken: 1 }, unique: true },
      { key: { userId: 1 } },
      { key: { vendorId: 1, companyId: 1 } },
      { key: { isActive: 1 } },
      { key: { expiresAt: 1 }, expireAfterSeconds: 86400 } // TTL index (expires after 24 hours)
    ]);
    console.log('✓ Created vendor_sessions collection with indexes');

    // 4. Create audit_logs collection (immutable)
    await db.createCollection('audit_logs');
    await db.collection('audit_logs').createIndexes([
      { key: { companyId: 1 } },
      { key: { vendorId: 1 } },
      { key: { userId: 1 } },
      { key: { action: 1 } },
      { key: { resource: 1 } },
      { key: { timestamp: -1 } },
      { key: { companyId: 1, timestamp: -1 } },
      { key: { vendorId: 1, timestamp: -1 } }
    ]);
    console.log('✓ Created audit_logs collection with indexes');

    // 5. Create data_sync_queue collection
    await db.createCollection('data_sync_queue');
    await db.collection('data_sync_queue').createIndexes([
      { key: { companyId: 1 } },
      { key: { vendorId: 1 } },
      { key: { status: 1 } },
      { key: { priority: -1, scheduledAt: 1 } },
      { key: { scheduledAt: 1 } }
    ]);
    console.log('✓ Created data_sync_queue collection with indexes');

    // 6. Create compliance_documents collection
    await db.createCollection('compliance_documents');
    await db.collection('compliance_documents').createIndexes([
      { key: { vendorId: 1, companyId: 1 } },
      { key: { companyId: 1 } },
      { key: { status: 1 } },
      { key: { type: 1 } },
      { key: { expiresAt: 1 } },
      { key: { uploadedAt: -1 } }
    ]);
    console.log('✓ Created compliance_documents collection with indexes');

    // 7. Create portal_notifications collection
    await db.createCollection('portal_notifications');
    await db.collection('portal_notifications').createIndexes([
      { key: { vendorId: 1, companyId: 1 } },
      { key: { companyId: 1 } },
      { key: { isRead: 1 } },
      { key: { priority: 1 } },
      { key: { createdAt: -1 } },
      { key: { expiresAt: 1 }, expireAfterSeconds: 0 } // TTL index
    ]);
    console.log('✓ Created portal_notifications collection with indexes');

    // 8. Add vendor portal fields to existing collections
    
    // Add vendor interaction fields to invoices
    await db.collection('invoices').updateMany(
      { vendorStatus: { $exists: false } },
      {
        $set: {
          vendorStatus: null,
          vendorNotes: null,
          vendorUpdatedAt: null,
          vendorUpdatedBy: null
        }
      }
    );
    console.log('✓ Enhanced invoices collection with vendor fields');

    // Add vendor acknowledgment fields to contracts
    await db.collection('contracts').updateMany(
      { vendorAcknowledgment: { $exists: false } },
      {
        $set: {
          vendorAcknowledgment: null
        }
      }
    );
    console.log('✓ Enhanced contracts collection with vendor acknowledgment fields');

    // Add portal-related fields to vendors
    await db.collection('vendors').updateMany(
      { lastActivity: { $exists: false } },
      {
        $set: {
          lastActivity: null,
          onboardingCompleted: false,
          onboardingSteps: [],
          communicationPreferences: [],
          complianceStatus: {
            overall: 'pending',
            documents: [],
            lastReviewAt: null,
            nextReviewDue: null
          },
          riskScore: null,
          performanceMetrics: null
        }
      }
    );
    console.log('✓ Enhanced vendors collection with portal fields');

    // 9. Create additional indexes on existing collections for vendor portal queries
    await db.collection('invoices').createIndexes([
      { key: { vendorId: 1, companyId: 1, status: 1 } },
      { key: { vendorStatus: 1 } },
      { key: { vendorUpdatedAt: -1 } }
    ]);
    console.log('✓ Added vendor portal indexes to invoices collection');

    await db.collection('contracts').createIndexes([
      { key: { 'partyA.id': 1, companyId: 1 } },
      { key: { 'partyB.id': 1, companyId: 1 } }
    ]);
    console.log('✓ Added vendor portal indexes to contracts collection');

    await db.collection('vendors').createIndexes([
      { key: { companyId: 1, status: 1 } },
      { key: { lastActivity: -1 } },
      { key: { onboardingCompleted: 1 } },
      { key: { 'complianceStatus.overall': 1 } }
    ]);
    console.log('✓ Added vendor portal indexes to vendors collection');

    console.log('\n✅ Database schema enhancement completed successfully!');
    console.log('\nNew collections created:');
    console.log('  - vendor_portal_access');
    console.log('  - vendor_users');
    console.log('  - vendor_sessions');
    console.log('  - audit_logs');
    console.log('  - data_sync_queue');
    console.log('  - compliance_documents');
    console.log('  - portal_notifications');
    console.log('\nExisting collections enhanced:');
    console.log('  - invoices (added vendor interaction fields)');
    console.log('  - contracts (added vendor acknowledgment fields)');
    console.log('  - vendors (added portal-related fields)');

  } catch (error) {
    console.error('Error enhancing database schema:', error);
    throw error;
  }
}

// Run the schema enhancement
if (require.main === module) {
  enhanceSchema()
    .then(() => {
      console.log('Schema enhancement completed');
      process.exit(0);
    })
    .catch(error => {
      console.error('Schema enhancement failed:', error);
      process.exit(1);
    });
}

export { enhanceSchema };
