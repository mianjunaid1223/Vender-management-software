// Real Email Service for Platform-wide Email Sending
// Now using actual email providers instead of mock!

import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';

// Email configuration
const getEmailConfig = () => ({
  provider: (process.env.EMAIL_PROVIDER as any) || 'gmail',
  from: process.env.EMAIL_FROM || 'noreply@vendormanagement.com',
  replyTo: process.env.EMAIL_REPLY_TO,
});

// Create transporter based on provider
const createTransporter = (): Transporter => {
  const config = getEmailConfig();
  let transportConfig: any;

  switch (config.provider) {
    case 'gmail':
      transportConfig = {
        service: 'gmail',
        auth: {
          user: process.env.GMAIL_USER,
          pass: process.env.GMAIL_APP_PASSWORD,
        },
      };
      break;

    case 'sendgrid':
      transportConfig = {
        host: 'smtp.sendgrid.net',
        port: 587,
        secure: false,
        auth: {
          user: 'apikey',
          pass: process.env.SENDGRID_API_KEY,
        },
      };
      break;

    case 'mailgun':
      transportConfig = {
        host: 'smtp.mailgun.org',
        port: 587,
        secure: false,
        auth: {
          user: `postmaster@${process.env.MAILGUN_DOMAIN}`,
          pass: process.env.MAILGUN_API_KEY,
        },
      };
      break;

    case 'outlook':
      transportConfig = {
        service: 'hotmail',
        auth: {
          user: process.env.OUTLOOK_USER,
          pass: process.env.OUTLOOK_PASSWORD,
        },
      };
      break;

    case 'smtp':
    default:
      transportConfig = {
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      };
      break;
  }

  return nodemailer.createTransport(transportConfig);
};

const sendEmail = async (to: string, subject: string, html: string) => {
  try {
    const config = getEmailConfig();
    const transporter = createTransporter();
    
    console.log('📧 Email Service - Sending email:', {
      to,
      subject,
      provider: config.provider,
      from: config.from
    });

    // Verify connection
    await transporter.verify();
    console.log('📧 Email Service - SMTP connection verified');

    const result = await transporter.sendMail({
      from: config.from,
      to,
      subject,
      html,
      replyTo: config.replyTo,
    });

    console.log('✅ Email sent successfully:', result.messageId);
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error('❌ Email sending error:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
};

// Enhanced vendor invitation email with professional template
export const sendVendorInvitationEmail = async (to: string, companyName: string, inviteLink: string, message?: string) => {
  const subject = `Invitation to join ${companyName} vendor network`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 28px;">Vendor Invitation</h1>
      </div>
      <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e9ecef;">
        <h2 style="color: #333; margin-top: 0;">Hello!</h2>
        <p style="color: #666; font-size: 16px; line-height: 1.6;">
          You've been invited to join <strong>${companyName}</strong>'s vendor network.
        </p>
        ${message ? `
        <div style="background: #e3f2fd; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #2196f3;">
          <p style="margin: 0; color: #1976d2; font-style: italic;">${message}</p>
        </div>
        ` : ''}
        <p style="color: #666; font-size: 16px; line-height: 1.6;">
          This portal will allow you to:
        </p>
        <ul style="color: #666; font-size: 16px; line-height: 1.8;">
          <li>Complete your vendor profile and documentation</li>
          <li>Submit and track invoices</li>
          <li>Access contract information</li>
          <li>Communicate directly with the team</li>
        </ul>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${inviteLink}" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; font-size: 16px; display: inline-block;">Complete Registration</a>
        </div>
        <p style="color: #999; font-size: 14px; text-align: center;">
          This invitation expires in 7 days. If you have any questions, please contact us.
        </p>
      </div>
      <div style="text-align: center; padding: 20px; color: #999; font-size: 12px;">
        <p>Best regards,<br>${companyName} Team</p>
      </div>
    </div>
  `;
  return sendEmail(to, subject, html);
};

export async function sendVendorApprovalEmail(email: string, vendorName: string, loginUrl?: string, pin?: string) {
  const subject = 'Your vendor application has been approved!';
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: #28a745; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 28px;">🎉 Congratulations!</h1>
      </div>
      <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e9ecef;">
        <h2 style="color: #333; margin-top: 0;">Welcome to the Network, ${vendorName}!</h2>
        <p style="color: #666; font-size: 16px; line-height: 1.6;">
          Your vendor application has been approved and you're now part of our vendor network.
        </p>
        
        ${pin ? `
        <div style="background: #e3f2fd; padding: 20px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #2196f3;">
          <h3 style="color: #1976d2; margin-top: 0;">Your Secure Login PIN</h3>
          <p style="margin: 0; color: #1976d2; font-size: 24px; font-weight: bold; text-align: center; padding: 15px; background: white; border-radius: 5px; letter-spacing: 2px;">${pin}</p>
          <p style="margin: 10px 0 0 0; color: #1976d2; font-size: 14px; text-align: center;">Use this PIN to access your vendor dashboard</p>
        </div>
        ` : ''}
        
        ${loginUrl ? `
        <div style="text-align: center; margin: 30px 0;">
          <a href="${loginUrl}" style="background: #28a745; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; font-size: 16px; display: inline-block;">Access Vendor Portal</a>
        </div>
        ` : ''}
        
        <p style="color: #666; font-size: 16px; line-height: 1.6;">
          You can now access all vendor features including:
        </p>
        <ul style="color: #666; font-size: 16px; line-height: 1.8;">
          <li>Invoice management and submission</li>
          <li>Contract viewing and management</li>
          <li>Direct communication tools</li>
          <li>Payment tracking</li>
        </ul>
        
        ${pin ? `
        <div style="background: #fff3cd; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #ffc107;">
          <p style="margin: 0; color: #856404;"><strong>Security Note:</strong> Keep your PIN safe and don't share it with anyone. You can change it after your first login.</p>
        </div>
        ` : ''}
      </div>
    </div>
  `;
  return sendEmail(email, subject, html);
}

// Password reset email
export const sendPasswordResetEmail = async (email: string, resetLink: string, platformName: string = 'Vendor Management Platform') => {
  const subject = `Reset your password - ${platformName}`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: #dc3545; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 28px;">Password Reset</h1>
      </div>
      <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e9ecef;">
        <h2 style="color: #333; margin-top: 0;">Reset Your Password</h2>
        <p style="color: #666; font-size: 16px; line-height: 1.6;">
          We received a request to reset your password for your ${platformName} account.
        </p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetLink}" style="background: #dc3545; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; font-size: 16px; display: inline-block;">Reset Password</a>
        </div>
        <p style="color: #999; font-size: 14px;">
          This link will expire in 24 hours for security reasons.
        </p>
        <p style="color: #999; font-size: 14px;">
          If you didn't request this password reset, please ignore this email or contact support if you have concerns.
        </p>
      </div>
    </div>
  `;
  return sendEmail(email, subject, html);
};

// System alert email
export const sendSystemAlertEmail = async (
  email: string | string[], 
  alertTitle: string, 
  alertMessage: string, 
  alertLevel: 'info' | 'warning' | 'error' | 'success' = 'info',
  actionUrl?: string,
  actionText?: string
) => {
  const alertConfig = {
    info: { color: '#17a2b8', icon: 'ℹ️' },
    warning: { color: '#ffc107', icon: '⚠️' },
    error: { color: '#dc3545', icon: '❌' },
    success: { color: '#28a745', icon: '✅' }
  };

  const config = alertConfig[alertLevel];
  const subject = `${config.icon} ${alertTitle} - Vendor Management Platform`;
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: ${config.color}; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 28px;">${config.icon} ${alertTitle}</h1>
      </div>
      <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e9ecef;">
        <p style="color: #666; font-size: 16px; line-height: 1.6;">
          ${alertMessage}
        </p>
        ${actionUrl ? `
        <div style="text-align: center; margin: 30px 0;">
          <a href="${actionUrl}" style="background: ${config.color}; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; font-size: 16px; display: inline-block;">${actionText || 'Take Action'}</a>
        </div>
        ` : ''}
        <p style="color: #999; font-size: 14px;">
          This is an automated message from Vendor Management Platform.
        </p>
      </div>
    </div>
  `;

  // Handle single email or array of emails
  const emails = Array.isArray(email) ? email : [email];
  const results = await Promise.all(emails.map(e => sendEmail(e, subject, html)));
  
  return {
    success: results.every(r => r.success),
    results
  };
};

export const sendVendorRejectionEmail = async (to: string, vendorName: string, companyName?: string, reason?: string) => {
  const subject = 'Update on your vendor application';
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: #dc3545; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 28px;">Application Update</h1>
      </div>
      <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e9ecef;">
        <h2 style="color: #333; margin-top: 0;">Hello, ${vendorName}</h2>
        <p style="color: #666; font-size: 16px; line-height: 1.6;">
          Thank you for your interest in becoming a vendor${companyName ? ` for ${companyName}` : ''}.
        </p>
        <p style="color: #666; font-size: 16px; line-height: 1.6;">
          After careful consideration, we have decided not to move forward with your application at this time.
        </p>
        ${reason ? `
        <div style="background: #fff3cd; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #ffc107;">
          <p style="margin: 0; color: #856404;"><strong>Reason:</strong> ${reason}</p>
        </div>
        ` : ''}
        <p style="color: #666; font-size: 16px; line-height: 1.6;">
          We appreciate the time you took to submit your application and wish you the best in your future endeavors.
        </p>
        <p style="color: #999; font-size: 14px; margin-top: 30px;">
          If you have any questions, please feel free to contact us.
        </p>
      </div>
    </div>
  `;
  return sendEmail(to, subject, html);
};
