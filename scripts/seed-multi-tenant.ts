import { config } from 'dotenv';
import { connectDB } from '@/lib/database/mongodb';
import mongoose from 'mongoose';

// Load environment variables
config({ path: '.env.local' });

// Define schemas
const userSchema = new mongoose.Schema({
  email: String,
  name: String,
  companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company' },
  role: { type: String, default: 'user' },
  createdAt: { type: Date, default: Date.now }
});

const vendorSchema = new mongoose.Schema({
  name: String,
  email: String,
  pin: String,
  status: String,
  companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company' }
});

const companySchema = new mongoose.Schema({
  name: String,
  email: String
});

const User = mongoose.models.User || mongoose.model('User', userSchema);
const Vendor = mongoose.models.Vendor || mongoose.model('Vendor', vendorSchema);
const Company = mongoose.models.Company || mongoose.model('Company', companySchema);

export async function seedMultiTenantData() {
  try {
    await connectDB();
    console.log('🌱 Starting multi-tenant data seeding...');

    // Create test companies
    const companies = [
      { name: 'Wash on Wheels', email: 'whashonwheels.wow@gmail.com' },
      { name: 'Tech Solutions Inc', email: 'admin@techsolutions.com' },
      { name: 'Green Energy Corp', email: 'contact@greenenergy.com' }
    ];

    const createdCompanies = [];
    for (const companyData of companies) {
      let company = await Company.findOne({ email: companyData.email });
      if (!company) {
        company = new Company(companyData);
        await company.save();
        console.log(`✅ Created company: ${company.name}`);
      }
      createdCompanies.push(company);
    }

    // Create a test user that will also be a vendor
    const testUserEmail = 'john.vendor@example.com';
    
    // Create user accounts in multiple companies
    for (let i = 0; i < createdCompanies.length; i++) {
      const company = createdCompanies[i];
      
      let user = await User.findOne({ email: testUserEmail, companyId: company._id });
      if (!user) {
        user = new User({
          email: testUserEmail,
          name: 'John Vendor Smith',
          companyId: company._id,
          role: 'user'
        });
        await user.save();
        console.log(`✅ Created user account for ${testUserEmail} in ${company.name}`);
      }
      
      // Also create vendor account
      let vendor = await Vendor.findOne({ email: testUserEmail, companyId: company._id });
      if (!vendor) {
        vendor = new Vendor({
          name: 'John Vendor Smith',
          email: testUserEmail,
          pin: `VENDOR${i + 1}${Math.random().toString(36).substr(2, 4).toUpperCase()}`,
          status: 'approved',
          companyId: company._id
        });
        await vendor.save();
        console.log(`✅ Created vendor account for ${testUserEmail} in ${company.name} with PIN: ${vendor.pin}`);
      }
    }

    // Create additional vendor-only accounts
    const vendorOnlyAccounts = [
      { name: 'Pure Vendor Co', email: 'vendor@purevendor.com' },
      { name: 'Supply Solutions', email: 'contact@supplysolutions.com' }
    ];

    for (const vendorData of vendorOnlyAccounts) {
      // Assign to random companies
      const randomCompany = createdCompanies[Math.floor(Math.random() * createdCompanies.length)];
      
      let vendor = await Vendor.findOne({ email: vendorData.email, companyId: randomCompany._id });
      if (!vendor) {
        vendor = new Vendor({
          name: vendorData.name,
          email: vendorData.email,
          pin: `V${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
          status: 'approved',
          companyId: randomCompany._id
        });
        await vendor.save();
        console.log(`✅ Created vendor-only account: ${vendor.name} with PIN: ${vendor.pin}`);
      }
    }

    console.log('🎉 Multi-tenant data seeding completed!');
    console.log('📧 Test user email:', testUserEmail);
    console.log('🏢 This user has accounts in all companies and can navigate between them');
    
    return true;
  } catch (error) {
    console.error('❌ Error seeding multi-tenant data:', error);
    throw error;
  }
}

// Run if this file is executed directly
if (require.main === module) {
  seedMultiTenantData()
    .then(() => {
      console.log('✅ Seeding completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Seeding failed:', error);
      process.exit(1);
    });
}
