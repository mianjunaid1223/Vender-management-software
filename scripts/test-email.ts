#!/usr/bin/env tsx

/**
 * Email Service Test Script
 * 
 * Usage: npm run test-email your-email@example.com
 * 
 * This script tests your email configuration by sending a test email.
 */

import { emailService } from '../src/lib/email/service';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

async function testEmail() {
  const testEmail = process.argv[2];
  
  if (!testEmail) {
    console.error('❌ Usage: npm run test-email your-email@example.com');
    process.exit(1);
  }

  console.log('🧪 Testing email service...');
  console.log(`📧 Sending test email to: ${testEmail}`);
  console.log(`🔧 Using provider: ${process.env.EMAIL_PROVIDER || 'smtp'}`);
  console.log('⏳ Please wait...\n');

  try {
    const result = await emailService.sendVendorInvitation(
      testEmail,
      'Test Company',
      'https://yourapp.com/invite/test-link',
      'This is a test email to verify your email service is working correctly!'
    );

    if (result.success) {
      console.log('✅ SUCCESS! Email sent successfully!');
      console.log(`📧 Message ID: ${result.messageId}`);
      console.log('\n🎉 Your email service is working perfectly!');
      console.log('💡 You can now send vendor invites with confidence.');
    } else {
      console.log('❌ FAILED! Email could not be sent.');
      console.log(`🔍 Error: ${result.error}`);
      console.log('\n🛠️  Please check your email configuration in .env.local');
    }
  } catch (error) {
    console.error('💥 FATAL ERROR:', error);
    console.log('\n🛠️  Please check your email configuration in .env.local');
  }
}

// Run the test
testEmail().catch(console.error);
