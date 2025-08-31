import { connectDB, stopDB } from '../src/lib/database/mongodb';
import Vendor from '../src/models/vendor.model';
import User from '../src/models/user.model';
import Tenant from '../src/models/tenant.model';
import { hashPassword } from '../src/lib/auth/password';
import fs from 'fs';

const logStream = fs.createWriteStream('migration.log', { flags: 'a' });

const log = (message: string) => {
  console.log(message);
  logStream.write(`${new Date().toISOString()}: ${message}\n`);
};

async function migrateVendorsToUsers() {
  log('Starting vendor to user migration...');
  const startTime = Date.now();

  try {
    log('Connecting to database...');
    await connectDB();
    log('Database connected.');

    log('Fetching all vendors...');
    const vendors = await Vendor.find({}).lean();
    log(`Found ${vendors.length} vendors to migrate.`);

    let successCount = 0;
    let failureCount = 0;
    let skippedCount = 0;

    for (const [index, vendor] of vendors.entries()) {
      const vendorStartTime = Date.now();
      log(`Processing vendor ${index + 1}/${vendors.length}: ${vendor.name}`);

      try {
        // Find the tenant associated with the vendor's companyId
        const tenant = await Tenant.findOne({ companyId: vendor.companyId }).lean();

        if (!tenant) {
          log(`Could not find tenant for vendor ${vendor.name} with companyId ${vendor.companyId}. Skipping.`);
          failureCount++;
          continue;
        }

        // Check if a user with this email already exists for this tenant
        const existingUser = await User.findOne({ email: vendor.email, companyId: tenant._id }).lean();
        if (existingUser) {
          log(`User with email ${vendor.email} already exists for this company. Skipping.`);
          skippedCount++;
          continue;
        }

        // Generate a random password for the new user
        const randomPassword = Math.random().toString(36).slice(-8);
        const hashedPassword = await hashPassword(randomPassword);

        // Create a new user for the vendor
        const newUser = new User({
          companyId: tenant._id,
          email: vendor.email,
          name: vendor.name,
          hashedPassword: hashedPassword,
          role: 'VENDOR',
        });

        await newUser.save();
        log(`Successfully created user for vendor ${vendor.name} (${vendor.email})`);
        successCount++;
      } catch (error) {
        log(`Failed to create user for vendor ${vendor.name}: ${error}`);
        failureCount++;
      } finally {
        const vendorEndTime = Date.now();
        log(`Finished processing vendor ${vendor.name} in ${vendorEndTime - vendorStartTime}ms`);
      }
    }

    const endTime = Date.now();
    log('--- Migration Summary ---');
    log(`Total migration time: ${endTime - startTime}ms`);
    log(`Successfully migrated ${successCount} vendors.`);
    log(`Failed to migrate ${failureCount} vendors.`);
    log(`Skipped ${skippedCount} already existing vendors.`);
    log('-------------------------');

  } catch (error) {
    log(`An error occurred during the migration: ${error}`);
  } finally {
    log('Disconnecting from database...');
    await stopDB();
    log('Database disconnected.');
    logStream.end();
  }
}

migrateVendorsToUsers();
