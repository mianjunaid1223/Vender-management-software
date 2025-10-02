/**
 * Email Templates
 * 
 * Centralized email templates for the Vendor Management Platform
 */

interface VendorPortalAccessData {
  vendorName: string;
  companyName: string;
  email: string;
  temporaryPassword: string;
  loginUrl: string;
}

interface InvoiceNotificationData {
  invoiceNumber: string;
  vendorName: string;
  amount: number;
  dueDate: string;
  invoiceUrl: string;
}

interface ContractNotificationData {
  contractTitle: string;
  vendorName: string;
  status: string;
  startDate: string;
  endDate: string;
  contractUrl: string;
}

interface PasswordResetData {
  vendorName: string;
  resetUrl: string;
  expiresIn: string;
}

export const emailTemplates = {
  /**
   * Vendor Portal Access Invitation
   */
  vendorPortalAccess: (data: VendorPortalAccessData): { subject: string; html: string } => ({
    subject: 'Your Vendor Portal Access - Welcome!',
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Vendor Portal Access</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f4f4f4; }
    .container { max-width: 600px; margin: 20px auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; }
    .content { padding: 30px; }
    .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; font-weight: 600; }
    .credentials { background: #f8f9fa; border-left: 4px solid #667eea; padding: 15px; margin: 20px 0; border-radius: 4px; }
    .footer { background: #f8f9fa; padding: 20px; text-align: center; font-size: 12px; color: #666; }
    .warning { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; border-radius: 4px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 style="margin: 0;">Welcome to the Vendor Portal!</h1>
      <p style="margin: 10px 0 0; opacity: 0.9;">You've been granted access by ${data.companyName}</p>
    </div>
    
    <div class="content">
      <p>Hello ${data.vendorName},</p>
      
      <p>Great news! <strong>${data.companyName}</strong> has granted you access to their Vendor Portal. You can now:</p>
      
      <ul>
        <li>View and download invoices</li>
        <li>Track payment status</li>
        <li>Review contracts</li>
        <li>Update your business information</li>
        <li>Communicate with the buyer</li>
      </ul>
      
      <div class="credentials">
        <h3 style="margin-top: 0;">Your Login Credentials</h3>
        <p><strong>Email:</strong> ${data.email}</p>
        <p><strong>Temporary Password:</strong> <code style="background: #e9ecef; padding: 4px 8px; border-radius: 3px; font-family: monospace;">${data.temporaryPassword}</code></p>
      </div>
      
      <div class="warning">
        <strong>⚠️ Important:</strong> Please change your password after your first login for security.
      </div>
      
      <div style="text-align: center;">
        <a href="${data.loginUrl}" class="button">Access Vendor Portal →</a>
      </div>
      
      <p>If you have any questions or need assistance, please contact ${data.companyName} directly.</p>
      
      <p>Best regards,<br>${data.companyName} Team</p>
    </div>
    
    <div class="footer">
      <p>This is an automated message from the Vendor Management Platform.</p>
      <p>If you received this email in error, please contact ${data.companyName}.</p>
    </div>
  </div>
</body>
</html>
    `.trim(),
  }),

  /**
   * Invoice Notification
   */
  invoiceNotification: (data: InvoiceNotificationData): { subject: string; html: string } => ({
    subject: `New Invoice #${data.invoiceNumber} - Action Required`,
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Invoice Notification</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f4f4f4; }
    .container { max-width: 600px; margin: 20px auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; }
    .content { padding: 30px; }
    .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; font-weight: 600; }
    .invoice-details { background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; }
    .detail-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e9ecef; }
    .detail-row:last-child { border-bottom: none; font-weight: 600; font-size: 18px; color: #667eea; }
    .footer { background: #f8f9fa; padding: 20px; text-align: center; font-size: 12px; color: #666; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 style="margin: 0;">📄 New Invoice</h1>
      <p style="margin: 10px 0 0; opacity: 0.9;">Invoice #${data.invoiceNumber}</p>
    </div>
    
    <div class="content">
      <p>Hello ${data.vendorName},</p>
      
      <p>A new invoice has been generated and is now available in your vendor portal.</p>
      
      <div class="invoice-details">
        <h3 style="margin-top: 0;">Invoice Details</h3>
        <div class="detail-row">
          <span>Invoice Number:</span>
          <span><strong>#${data.invoiceNumber}</strong></span>
        </div>
        <div class="detail-row">
          <span>Due Date:</span>
          <span>${data.dueDate}</span>
        </div>
        <div class="detail-row">
          <span>Amount Due:</span>
          <span>$${data.amount.toFixed(2)}</span>
        </div>
      </div>
      
      <div style="text-align: center;">
        <a href="${data.invoiceUrl}" class="button">View Invoice →</a>
      </div>
      
      <p>Please review the invoice and process payment by the due date to avoid any late fees.</p>
      
      <p>If you have any questions about this invoice, please contact us through the vendor portal.</p>
      
      <p>Thank you for your business!</p>
    </div>
    
    <div class="footer">
      <p>This is an automated message from the Vendor Management Platform.</p>
    </div>
  </div>
</body>
</html>
    `.trim(),
  }),

  /**
   * Contract Notification
   */
  contractNotification: (data: ContractNotificationData): { subject: string; html: string } => ({
    subject: `Contract Update: ${data.contractTitle}`,
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Contract Notification</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f4f4f4; }
    .container { max-width: 600px; margin: 20px auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
    .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px; text-align: center; }
    .content { padding: 30px; }
    .button { display: inline-block; background: #10b981; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; font-weight: 600; }
    .contract-details { background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; }
    .footer { background: #f8f9fa; padding: 20px; text-align: center; font-size: 12px; color: #666; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 style="margin: 0;">📋 Contract Update</h1>
      <p style="margin: 10px 0 0; opacity: 0.9;">Action Required</p>
    </div>
    
    <div class="content">
      <p>Hello ${data.vendorName},</p>
      
      <p>There's an update to your contract that requires your attention:</p>
      
      <div class="contract-details">
        <h3 style="margin-top: 0;">${data.contractTitle}</h3>
        <p><strong>Status:</strong> ${data.status}</p>
        <p><strong>Contract Period:</strong> ${data.startDate} to ${data.endDate}</p>
      </div>
      
      <div style="text-align: center;">
        <a href="${data.contractUrl}" class="button">Review Contract →</a>
      </div>
      
      <p>Please review the contract details and take any necessary action in the vendor portal.</p>
      
      <p>Thank you for your prompt attention to this matter.</p>
    </div>
    
    <div class="footer">
      <p>This is an automated message from the Vendor Management Platform.</p>
    </div>
  </div>
</body>
</html>
    `.trim(),
  }),

  /**
   * Password Reset
   */
  passwordReset: (data: PasswordResetData): { subject: string; html: string } => ({
    subject: 'Reset Your Password - Vendor Portal',
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Password Reset</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f4f4f4; }
    .container { max-width: 600px; margin: 20px auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
    .header { background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white; padding: 30px; text-align: center; }
    .content { padding: 30px; }
    .button { display: inline-block; background: #f59e0b; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; font-weight: 600; }
    .warning { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; border-radius: 4px; }
    .footer { background: #f8f9fa; padding: 20px; text-align: center; font-size: 12px; color: #666; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 style="margin: 0;">🔐 Password Reset Request</h1>
    </div>
    
    <div class="content">
      <p>Hello ${data.vendorName},</p>
      
      <p>We received a request to reset your password for the Vendor Portal. If you didn't make this request, you can safely ignore this email.</p>
      
      <div style="text-align: center;">
        <a href="${data.resetUrl}" class="button">Reset Password →</a>
      </div>
      
      <div class="warning">
        <strong>⚠️ Security Notice:</strong> This link will expire in ${data.expiresIn}. For your security, please do not share this link with anyone.
      </div>
      
      <p>If the button doesn't work, copy and paste this link into your browser:</p>
      <p style="word-break: break-all; color: #667eea;">${data.resetUrl}</p>
      
      <p>If you didn't request a password reset, please contact support immediately.</p>
    </div>
    
    <div class="footer">
      <p>This is an automated message from the Vendor Management Platform.</p>
      <p>Never share your password or reset links with anyone.</p>
    </div>
  </div>
</body>
</html>
    `.trim(),
  }),
};

export type {
  VendorPortalAccessData,
  InvoiceNotificationData,
  ContractNotificationData,
  PasswordResetData,
};
