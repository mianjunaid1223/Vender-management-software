'use server';

import { getDb } from '@/lib/data';
import { ObjectId } from 'mongodb';

/**
 * Migration script to add companyId to existing data
 * This should be run once to ensure data privacy compliance
 */
export async function migrateDataForMultiTenancy(): Promise<void> {
    const db = await getDb();
    console.log('🔄 Starting multi-tenant data migration...');
    
    try {
        // Step 1: Ensure all users have a companyId
        console.log('📝 Step 1: Migrating users...');
        const usersWithoutCompany = await db.collection('users').find({ companyId: { $exists: false } }).toArray();
        
        for (const user of usersWithoutCompany) {
            const companyId = `company-${user._id.toString()}`;
            await db.collection('users').updateOne(
                { _id: user._id },
                { $set: { companyId } }
            );
            console.log(`   ✅ Updated user ${user.email} with companyId: ${companyId}`);
        }
        
        // Step 2: Migrate invoices - assign to first user's company as default
        console.log('📝 Step 2: Migrating invoices...');
        const defaultUser = await db.collection('users').findOne({});
        const defaultCompanyId = defaultUser?.companyId || 'default-company';
        
        const invoicesWithoutCompany = await db.collection('invoices').find({ companyId: { $exists: false } }).toArray();
        for (const invoice of invoicesWithoutCompany) {
            await db.collection('invoices').updateOne(
                { _id: invoice._id },
                { $set: { companyId: defaultCompanyId } }
            );
        }
        console.log(`   ✅ Updated ${invoicesWithoutCompany.length} invoices with companyId: ${defaultCompanyId}`);
        
        // Step 3: Migrate vendors
        console.log('📝 Step 3: Migrating vendors...');
        const vendorsWithoutCompany = await db.collection('vendors').find({ companyId: { $exists: false } }).toArray();
        for (const vendor of vendorsWithoutCompany) {
            await db.collection('vendors').updateOne(
                { _id: vendor._id },
                { $set: { companyId: defaultCompanyId } }
            );
        }
        console.log(`   ✅ Updated ${vendorsWithoutCompany.length} vendors with companyId: ${defaultCompanyId}`);
        
        // Step 4: Migrate contracts
        console.log('📝 Step 4: Migrating contracts...');
        const contractsWithoutCompany = await db.collection('contracts').find({ companyId: { $exists: false } }).toArray();
        for (const contract of contractsWithoutCompany) {
            await db.collection('contracts').updateOne(
                { _id: contract._id },
                { $set: { companyId: defaultCompanyId } }
            );
        }
        console.log(`   ✅ Updated ${contractsWithoutCompany.length} contracts with companyId: ${defaultCompanyId}`);
        
        // Step 5: Migrate notifications
        console.log('📝 Step 5: Migrating notifications...');
        const notificationsWithoutCompany = await db.collection('notifications').find({ companyId: { $exists: false } }).toArray();
        for (const notification of notificationsWithoutCompany) {
            await db.collection('notifications').updateOne(
                { _id: notification._id },
                { $set: { companyId: defaultCompanyId } }
            );
        }
        console.log(`   ✅ Updated ${notificationsWithoutCompany.length} notifications with companyId: ${defaultCompanyId}`);
        
        // Step 6: Migrate action logs
        console.log('📝 Step 6: Migrating action logs...');
        const actionLogsWithoutCompany = await db.collection('action_logs').find({ companyId: { $exists: false } }).toArray();
        for (const log of actionLogsWithoutCompany) {
            await db.collection('action_logs').updateOne(
                { _id: log._id },
                { $set: { companyId: defaultCompanyId } }
            );
        }
        console.log(`   ✅ Updated ${actionLogsWithoutCompany.length} action logs with companyId: ${defaultCompanyId}`);
        
        // Step 7: Create database indexes for better performance on companyId queries
        console.log('📝 Step 7: Creating database indexes...');
        
        await Promise.all([
            db.collection('users').createIndex({ companyId: 1 }),
            db.collection('invoices').createIndex({ companyId: 1 }),
            db.collection('vendors').createIndex({ companyId: 1 }),
            db.collection('contracts').createIndex({ companyId: 1 }),
            db.collection('notifications').createIndex({ companyId: 1 }),
            db.collection('action_logs').createIndex({ companyId: 1 }),
        ]);
        
        console.log('   ✅ Created database indexes for companyId fields');
        
        console.log('🎉 Multi-tenant data migration completed successfully!');
        console.log(`   Default company ID used: ${defaultCompanyId}`);
        
    } catch (error) {
        console.error('❌ Migration failed:', error);
        throw error;
    }
}

/**
 * Verify the migration was successful
 */
export async function verifyMigration(): Promise<{ success: boolean; report: string[] }> {
    const db = await getDb();
    const report: string[] = [];
    let success = true;
    
    try {
        // Check users
        const usersWithoutCompanyId = await db.collection('users').countDocuments({ companyId: { $exists: false } });
        if (usersWithoutCompanyId > 0) {
            report.push(`❌ ${usersWithoutCompanyId} users missing companyId`);
            success = false;
        } else {
            report.push(`✅ All users have companyId`);
        }
        
        // Check invoices
        const invoicesWithoutCompanyId = await db.collection('invoices').countDocuments({ companyId: { $exists: false } });
        if (invoicesWithoutCompanyId > 0) {
            report.push(`❌ ${invoicesWithoutCompanyId} invoices missing companyId`);
            success = false;
        } else {
            report.push(`✅ All invoices have companyId`);
        }
        
        // Check vendors
        const vendorsWithoutCompanyId = await db.collection('vendors').countDocuments({ companyId: { $exists: false } });
        if (vendorsWithoutCompanyId > 0) {
            report.push(`❌ ${vendorsWithoutCompanyId} vendors missing companyId`);
            success = false;
        } else {
            report.push(`✅ All vendors have companyId`);
        }
        
        // Check contracts
        const contractsWithoutCompanyId = await db.collection('contracts').countDocuments({ companyId: { $exists: false } });
        if (contractsWithoutCompanyId > 0) {
            report.push(`❌ ${contractsWithoutCompanyId} contracts missing companyId`);
            success = false;
        } else {
            report.push(`✅ All contracts have companyId`);
        }
        
        return { success, report };
        
    } catch (error) {
        report.push(`❌ Verification failed: ${error}`);
        return { success: false, report };
    }
}
