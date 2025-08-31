import 'dotenv/config';
import { connectDB, stopDB } from '@/lib/database/mongodb';
import Tenant from '@/models/tenant.model';
import User from '@/models/user.model';
import Vendor from '@/models/vendor.model';
import Contract from '@/models/contract.model';
import Invoice from '@/models/invoice.model';
import VendorApplication from '@/models/vendorApplication.model';
import { hashPassword } from '@/lib/auth/password';
import mongoose from 'mongoose';

async function seedDatabase() {
  try {
    console.log('Connecting to database...');
    await connectDB();
    console.log('✅ Database connected.');

    console.log('Clearing existing data...');
    await Promise.all([
      Tenant.deleteMany({}),
      User.deleteMany({}),
      Vendor.deleteMany({}),
      Contract.deleteMany({}),
      Invoice.deleteMany({}),
      VendorApplication.deleteMany({}),
    ]);
    console.log('✅ Existing data cleared.');

    console.log('🌱 Starting database seeding...');

    // 1. Create Tenant
    const tenant = await Tenant.create({
      name: 'Innovate Inc.',
      businessType: 'Technology',
      preferences: {
        baseCurrency: 'USD',
      }
    });
    console.log(`✅ Created Tenant: ${tenant.name}`);

    // 2. Create User
    const hashedPassword = await hashPassword('password123');
    const user = await User.create({
      tenantId: tenant._id,
      email: 'admin@innovate.com',
      name: 'Admin User',
      hashedPassword: hashedPassword,
      role: 'ADMIN',
    });
    console.log(`✅ Created User: ${user.email} (password: password123)`);

    // 3. Create Vendors
    const vendors = await Vendor.create([
      { tenantId: tenant._id, name: 'Tech Solutions LLC', email: 'contact@techllc.com', service: 'IT Support', status: 'ACTIVE' },
      { tenantId: tenant._id, name: 'Creative Designs', email: 'hello@creativedesigns.com', service: 'Graphic Design', status: 'ACTIVE' },
      { tenantId: tenant._id, name: 'Legal Eagles', email: 'support@legaleagles.com', service: 'Legal Services', status: 'PENDING' },
    ]);
    console.log(`✅ Created ${vendors.length} Vendors.`);

    // 4. Create Contracts
    const contracts = await Contract.create([
      {
        tenantId: tenant._id,
        vendorId: vendors[0]._id,
        title: 'Annual IT Support Agreement',
        value: 25000,
        currency: 'USD',
        status: 'ACTIVE',
        startDate: new Date('2023-01-01'),
        endDate: new Date('2023-12-31'),
      },
      {
        tenantId: tenant._id,
        vendorId: vendors[1]._id,
        title: 'Marketing Website Redesign',
        value: 15000,
        currency: 'USD',
        status: 'DRAFT',
        startDate: new Date('2023-06-01'),
        endDate: new Date('2023-09-30'),
      },
    ]);
    console.log(`✅ Created ${contracts.length} Contracts.`);

    // 5. Create Invoices
    await Invoice.create([
        {
            tenantId: tenant._id,
            vendorId: vendors[0]._id,
            contractId: contracts[0]._id,
            invoiceNumber: 'INV-2023-001',
            totalAmount: 5000,
            currency: 'USD',
            status: 'PAID',
            invoiceDate: new Date('2023-03-15'),
            invoiceDueDate: new Date('2023-04-14'),
        }
    ]);
    console.log('✅ Created sample Invoice.');

    // 6. Create Vendor Applications
    await VendorApplication.create([
      {
        tenantId: tenant._id,
        applicationId: `VA-${Date.now()}`,
        vendorName: 'Data Analytics Co',
        contactPerson: 'Jane Doe',
        email: 'jane.doe@dataanalytics.com',
        service: 'Data Science',
        status: 'PENDING',
        submittedAt: new Date(),
      }
    ]);
    console.log('✅ Created sample Vendor Application.');

    console.log('🎉 Database seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  } finally {
    // Gracefully stop the in-memory server if it was used
    await stopDB();
  }
}

seedDatabase();
