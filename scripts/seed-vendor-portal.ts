import { config } from 'dotenv';
import { connectDB } from '@/lib/database/mongodb';
import mongoose from 'mongoose';

// Load environment variables
config({ path: '.env.local' });

// Define schemas
const vendorSchema = new mongoose.Schema({
  name: String,
  email: String,
  pin: String,
  status: String,
  companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company' },
  // Profile fields
  phone: String,
  address: String,
  city: String,
  state: String,
  zipCode: String,
  country: String,
  website: String,
  description: String,
  taxId: String,
  businessType: String,
  contactPerson: String,
  // Timestamps
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const companySchema = new mongoose.Schema({
  name: String,
  email: String,
  phone: String,
  address: String,
  city: String,
  state: String,
  zipCode: String,
  country: String,
  website: String,
  description: String,
  taxId: String,
  businessType: String,
  contactPerson: String,
  industry: String,
  // Timestamps
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const invoiceSchema = new mongoose.Schema({
  invoiceNumber: String,
  vendorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Vendor' },
  companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company' },
  amount: Number,
  currency: { type: String, default: 'USD' },
  status: String,
  issueDate: Date,
  dueDate: Date,
  description: String,
  items: Array,
  createdAt: { type: Date, default: Date.now }
});

const contractSchema = new mongoose.Schema({
  title: String,
  description: String,
  vendorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Vendor' },
  companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company' },
  value: Number,
  currency: { type: String, default: 'USD' },
  status: String,
  startDate: Date,
  endDate: Date,
  createdAt: { type: Date, default: Date.now }
});

const notificationSchema = new mongoose.Schema({
  vendorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Vendor' },
  companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company' },
  type: String,
  title: String,
  message: String,
  priority: { type: String, default: 'medium' },
  read: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

const Vendor = mongoose.models.Vendor || mongoose.model('Vendor', vendorSchema);
const Company = mongoose.models.Company || mongoose.model('Company', companySchema);
const Invoice = mongoose.models.Invoice || mongoose.model('Invoice', invoiceSchema);
const Contract = mongoose.models.Contract || mongoose.model('Contract', contractSchema);
const Notification = mongoose.models.Notification || mongoose.model('Notification', notificationSchema);

export async function seedVendorPortalData() {
  try {
    await connectDB();
    console.log('🌱 Starting vendor portal data seeding...');

    // Find or create a test company with full profile
    let company = await Company.findOne({ email: 'mianjunaid0001@gmail.com' });
    if (!company) {
      company = new Company({
        name: 'Corporation',
        email: 'mianjunaid0001@gmail.com',
        phone: '+923294031451',
        website: 'https://your-website.com',
        taxId: '12-34567890',
        contactPerson: 'Mian Junaid',
        businessType: 'Technology',
        industry: 'Software Development',
        description: 'Brief description of your business',
        address: '123 Business Street',
        city: 'Business City',
        state: 'Business State',
        zipCode: '12345',
        country: 'Pakistan'
      });
      await company.save();
      console.log('✅ Created test company with full profile');
    }

    // Find existing vendors or create test vendor with full profile
    let vendor = await Vendor.findOne({ email: 'mianjunaid0001@gmail.com' });
    if (!vendor) {
      vendor = new Vendor({
        name: 'Corporation',
        email: 'mianjunaid0001@gmail.com',
        pin: 'D5RMUNSV',
        status: 'active',
        companyId: company._id,
        phone: '+923294031451',
        website: 'https://your-website.com',
        taxId: '12-34567890',
        contactPerson: 'Mian Junaid',
        businessType: 'Technology',
        description: 'Brief description of your business',
        address: '123 Business Street',
        city: 'Business City',
        state: 'Business State',
        zipCode: '12345',
        country: 'Pakistan'
      });
      await vendor.save();
      console.log('✅ Created test vendor');
    }

    // Create sample invoices
    const existingInvoices = await Invoice.countDocuments({ vendorId: vendor._id });
    if (existingInvoices === 0) {
      const sampleInvoices = [
        {
          invoiceNumber: 'INV-000001',
          vendorId: vendor._id,
          companyId: company._id,
          amount: 5000,
          status: 'paid',
          issueDate: new Date('2024-01-15'),
          dueDate: new Date('2024-02-15'),
          description: 'Web Development Services - January 2024',
          items: [
            { description: 'Frontend Development', quantity: 40, unitPrice: 75, total: 3000 },
            { description: 'Backend Development', quantity: 30, unitPrice: 85, total: 2550 },
            { description: 'Testing & QA', quantity: 10, unitPrice: 60, total: 600 }
          ]
        },
        {
          invoiceNumber: 'INV-000002',
          vendorId: vendor._id,
          companyId: company._id,
          amount: 3500,
          status: 'pending',
          issueDate: new Date('2024-02-15'),
          dueDate: new Date('2024-03-15'),
          description: 'Mobile App Development - February 2024',
          items: [
            { description: 'UI/UX Design', quantity: 20, unitPrice: 70, total: 1400 },
            { description: 'Mobile Development', quantity: 35, unitPrice: 80, total: 2800 }
          ]
        },
        {
          invoiceNumber: 'INV-000003',
          vendorId: vendor._id,
          companyId: company._id,
          amount: 2800,
          status: 'overdue',
          issueDate: new Date('2024-01-01'),
          dueDate: new Date('2024-01-31'),
          description: 'Consulting Services - December 2023',
          items: [
            { description: 'Technical Consultation', quantity: 28, unitPrice: 100, total: 2800 }
          ]
        },
        {
          invoiceNumber: 'INV-000004',
          vendorId: vendor._id,
          companyId: company._id,
          amount: 4200,
          status: 'paid',
          issueDate: new Date('2024-03-01'),
          dueDate: new Date('2024-03-31'),
          description: 'System Integration Services',
          items: [
            { description: 'API Development', quantity: 30, unitPrice: 90, total: 2700 },
            { description: 'Database Design', quantity: 15, unitPrice: 100, total: 1500 }
          ]
        },
        {
          invoiceNumber: 'INV-000005',
          vendorId: vendor._id,
          companyId: company._id,
          amount: 1800,
          status: 'pending',
          issueDate: new Date('2024-03-15'),
          dueDate: new Date('2024-04-15'),
          description: 'Maintenance & Support - March 2024',
          items: [
            { description: 'Monthly Maintenance', quantity: 1, unitPrice: 1800, total: 1800 }
          ]
        }
      ];

      await Invoice.insertMany(sampleInvoices);
      console.log('✅ Created sample invoices');
    }

    // Create sample contracts
    const existingContracts = await Contract.countDocuments({ vendorId: vendor._id });
    if (existingContracts === 0) {
      const sampleContracts = [
        {
          title: 'Web Development Project',
          description: 'Complete website redesign and development for company portal',
          vendorId: vendor._id,
          companyId: company._id,
          value: 25000,
          status: 'active',
          startDate: new Date('2024-01-01'),
          endDate: new Date('2024-06-30')
        },
        {
          title: 'Mobile Application Development',
          description: 'iOS and Android mobile application for customer management',
          vendorId: vendor._id,
          companyId: company._id,
          value: 35000,
          status: 'active',
          startDate: new Date('2024-02-01'),
          endDate: new Date('2024-08-31')
        },
        {
          title: 'System Maintenance Contract',
          description: 'Ongoing maintenance and support for existing systems',
          vendorId: vendor._id,
          companyId: company._id,
          value: 12000,
          status: 'active',
          startDate: new Date('2024-01-01'),
          endDate: new Date('2024-12-31')
        },
        {
          title: 'Data Migration Project',
          description: 'Migration of legacy data to new cloud infrastructure',
          vendorId: vendor._id,
          companyId: company._id,
          value: 18000,
          status: 'completed',
          startDate: new Date('2023-10-01'),
          endDate: new Date('2023-12-31')
        }
      ];

      await Contract.insertMany(sampleContracts);
      console.log('✅ Created sample contracts');
    }

    // Create sample notifications
    const existingNotifications = await Notification.countDocuments({ vendorId: vendor._id });
    if (existingNotifications === 0) {
      const sampleNotifications = [
        {
          vendorId: vendor._id,
          companyId: company._id,
          type: 'payment',
          title: 'Payment Received',
          message: 'Payment of $5,000 has been received for invoice INV-000001.',
          priority: 'medium',
          read: false,
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2) // 2 hours ago
        },
        {
          vendorId: vendor._id,
          companyId: company._id,
          type: 'invoice',
          title: 'Invoice Overdue',
          message: 'Invoice INV-000003 is now overdue. Please follow up with the client.',
          priority: 'high',
          read: false,
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24) // 1 day ago
        },
        {
          vendorId: vendor._id,
          companyId: company._id,
          type: 'contract',
          title: 'New Contract Assigned',
          message: 'You have been assigned a new contract: Web Development Project.',
          priority: 'medium',
          read: true,
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3) // 3 days ago
        },
        {
          vendorId: vendor._id,
          companyId: company._id,
          type: 'reminder',
          title: 'Monthly Report Due',
          message: 'Your monthly progress report is due in 3 days.',
          priority: 'low',
          read: false,
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 12) // 12 hours ago
        }
      ];

      await Notification.insertMany(sampleNotifications);
      console.log('✅ Created sample notifications');
    }

    console.log('🎉 Vendor portal data seeding completed successfully!');
    console.log(`📊 Test vendor PIN: ${vendor.pin}`);
    console.log(`📧 Test vendor email: ${vendor.email}`);
    
    return {
      success: true,
      data: {
        vendorId: vendor._id,
        vendorPin: vendor.pin,
        vendorEmail: vendor.email,
        companyId: company._id
      }
    };

  } catch (error) {
    console.error('❌ Error seeding vendor portal data:', error);
    return { success: false, error: (error as Error).message };
  }
}

// Run the seeding if this file is executed directly
if (require.main === module) {
  seedVendorPortalData()
    .then((result) => {
      console.log('Seeding result:', result);
      process.exit(0);
    })
    .catch((error) => {
      console.error('Seeding failed:', error);
      process.exit(1);
    });
}
