import { emailService } from './email-service';

export async function testEmailService(): Promise<void> {
  console.log('🧪 Testing Email Service...');
  
  // Verify connection
  const isConnected = await emailService.verifyConnection();
  console.log(`Connection status: ${isConnected ? '✅ Connected' : '❌ Failed'}`);
  
  // Test sending an email
  const testResult = await emailService.sendEmail({
    to: 'test@example.com',
    subject: 'Test Email from Vendor Management System',
    html: `
      <div style="font-family: Arial, sans-serif; padding: 20px;">
        <h2>🎉 Email Service Test</h2>
        <p>This is a test email to verify that the email service is working correctly.</p>
        <p>If you can see this, the email service is properly configured!</p>
        <p>Timestamp: ${new Date().toISOString()}</p>
      </div>
    `
  });
  
  console.log(`Test email result: ${testResult ? '✅ Sent' : '❌ Failed'}`);
}

// Export for testing purposes
export { emailService };
