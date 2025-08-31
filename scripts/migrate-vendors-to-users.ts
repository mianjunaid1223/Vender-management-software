import { connectDB, stopDB } from '../src/lib/database/mongodb';
import Vendor from '../src/models/vendor.model';
import User from '../src/models/user.model';
import Tenant from '../src/models/tenant.model';
import { hashPassword } from '../src/lib/auth/password';

async function migrateVendorsToUsers() {
  console.log('Starting vendor to user migration...');
  const startTime = Date.now();

  try {
    console.log('Connecting to database...');
    await connectDB();
    console.log('Database connected.');

    console.log('Fetching all vendors...');
    const vendors = await Vendor.find({}).lean();
    console.log(`Found ${vendors.length} vendors to migrate.`);

    let successCount = 0;
    let failureCount = 0;
    let skippedCount = 0;

    for (const [index, vendor] of vendors.entries()) {
      const vendorStartTime = Date.now();
      console.log(`Processing vendor ${index + 1}/${vendors.length}: ${vendor.name}`);

      try {
        // Find the tenant associated with the vendor's companyId
        const tenant = await Tenant.findOne({ companyId: vendor.companyId }).lean();

        if (!tenant) {
          console.warn(`Could not find tenant for vendor ${vendor.name} with companyId ${vendor.companyId}. Skipping.`);
          failureCount++;
          continue;
        }

        // Check if a user with this email already exists for this tenant
        const existingUser = await User.findOne({ email: vendor.email, companyId: tenant._id }).lean();
        if (existingUser) {
          console.log(`User with email ${vendor.email} already exists for this company. Skipping.`);
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
        console.log(`Successfully created user for vendor ${vendor.name} (${vendor.email})`);
        successCount++;
      } catch (error) {
        console.error(`Failed to create user for vendor ${vendor.name}:`, error);
        failureCount++;
      } finally {
        const vendorEndTime = Date.now();
        console.log(`Finished processing vendor ${vendor.name} in ${vendorEndTime - vendorStartTime}ms`);
      }
    }

    const endTime = Date.now();
    console.log('--- Migration Summary ---');
    console.log(`Total migration time: ${endTime - startTime}ms`);
    console.log(`Successfully migrated ${successCount} vendors.`);
    console.log(`Failed to migrate ${failureCount} vendors.`);
    console.log(`Skipped ${skippedCount} already existing vendors.`);
    console.log('-------------------------');

  } catch (error) {
    console.error('An error occurred during the migration:', error);
  } finally {
    console.log('Disconnecting from database...');
    await stopDB();
    console.log('Database disconnected.');
  }
}

migrateVendorsToUsers();
