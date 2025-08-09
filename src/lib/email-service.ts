/**
 * Real Email Service for Platform-wide Email Sending
 * Supports: Gmail, SendGrid, Mailgun, Custom SMTP, and more
 * Supports: invitations, password resets, confirmations, alerts, notifications
 */

import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';

// Email configuration types
interface EmailConfig {
  provider?: 'gmail' | 'sendgrid' | 'mailgun' | 'smtp' | 'outlook';
  smtp?: {
    host: string;
    port: number;
    secure: boolean;
    auth: {
      user: string;
      pass: string;
    };
  };
  apiKey?: string; // For SendGrid, Mailgun, etc.
  domain?: string; // For Mailgun
  from: string;
  replyTo?: string;
}

interface EmailOptions {
  to: string | string[];
  cc?: string | string[];
  bcc?: string | string[];
  subject: string;
  html?: string;
  text?: string;
}

// Simple template engine (Handlebars-like)
function compileTemplate(template: string, data: Record<string, any>): string {
  let compiled = template;
  
  // Replace simple variables {{variable}}
  compiled = compiled.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    return data[key] !== undefined ? String(data[key]) : match;
  });
  
  // Handle conditional blocks {{#if variable}} content {{/if}}
  compiled = compiled.replace(/\{\{#if (\w+)\}\}([\s\S]*?)\{\{\/if\}\}/g, (match, key, content) => {
    return data[key] ? content : '';
  });
  
  return compiled;
}

// Real email service using nodemailer
const createTransporter = (config: EmailConfig): Transporter => {
  let transportConfig: any;

  switch (config.provider) {
    case 'gmail':
      transportConfig = {
        service: 'gmail',
        auth: {
          user: config.smtp?.auth.user || process.env.GMAIL_USER,
          pass: config.smtp?.auth.pass || process.env.GMAIL_APP_PASSWORD,
        },
      };
      break;

    case 'outlook':
      transportConfig = {
        service: 'hotmail',
        auth: {
          user: config.smtp?.auth.user || process.env.OUTLOOK_USER,
          pass: config.smtp?.auth.pass || process.env.OUTLOOK_PASSWORD,
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
          pass: config.apiKey || process.env.SENDGRID_API_KEY,
        },
      };
      break;

    case 'mailgun':
      transportConfig = {
        host: 'smtp.mailgun.org',
        port: 587,
        secure: false,
        auth: {
          user: `postmaster@${config.domain || process.env.MAILGUN_DOMAIN}`,
          pass: config.apiKey || process.env.MAILGUN_API_KEY,
        },
      };
      break;

    case 'smtp':
    default:
      transportConfig = {
        host: config.smtp?.host || process.env.SMTP_HOST,
        port: config.smtp?.port || parseInt(process.env.SMTP_PORT || '587'),
        secure: config.smtp?.secure || process.env.SMTP_SECURE === 'true',
        auth: {
          user: config.smtp?.auth.user || process.env.SMTP_USER,
          pass: config.smtp?.auth.pass || process.env.SMTP_PASS,
        },
      };
      break;
  }

  return nodemailer.createTransport(transportConfig);
};

const realEmailService = {
  async send(options: EmailOptions, config: EmailConfig): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      console.log('📧 Email Service - Sending email:', {
        to: options.to,
        subject: options.subject,
        provider: config.provider || 'smtp',
        hasHtml: !!options.html,
        hasText: !!options.text
      });

      const transporter = createTransporter(config);
      
      // Verify connection configuration
      await transporter.verify();
      console.log('📧 Email Service - SMTP connection verified');

      const result = await transporter.sendMail({
        from: config.from,
        to: options.to,
        cc: options.cc,
        bcc: options.bcc,
        subject: options.subject,
        html: options.html,
        text: options.text,
        replyTo: config.replyTo,
      });

      console.log('📧 Email Service - Email sent successfully:', result.messageId);
      
      return { 
        success: true, 
        messageId: result.messageId 
      };
    } catch (error) {
      console.error('📧 Email Service - Error:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown email error' 
      };
    }
  }
};

// Main Email Service Class
export class EmailService {
  private config: EmailConfig;

  constructor(config?: Partial<EmailConfig>) {
    this.config = {
      provider: (process.env.EMAIL_PROVIDER as any) || 'smtp',
      from: process.env.EMAIL_FROM || 'noreply@vendormanagement.com',
      replyTo: process.env.EMAIL_REPLY_TO,
      ...config
    };
  }

  async sendEmail(options: EmailOptions): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      const emailOptions = {
        ...options,
        from: this.config.from
      };

      return await realEmailService.send(emailOptions, this.config);
    } catch (error) {
      console.error('EmailService error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to send email'
      };
    }
  }

  // Convenience methods for common email types
  async sendVendorInvitation(
    email: string,
    companyName: string,
    inviteLink: string,
    customMessage?: string
  ) {
    const subject = `Invitation to join ${companyName} vendor network`;
    const html = this.createVendorInvitationTemplate(companyName, inviteLink, customMessage);
    
    return this.sendEmail({
      to: email,
      subject,
      html
    });
  }

  async sendPasswordReset(
    email: string,
    resetLink: string,
    platformName: string = 'Vendor Management Platform',
    expirationTime: string = '24 hours'
  ) {
    const subject = `Reset your password - ${platformName}`;
    const html = this.createPasswordResetTemplate(resetLink, platformName, expirationTime);
    
    return this.sendEmail({
      to: email,
      subject,
      html
    });
  }

  async sendAccountConfirmation(
    email: string,
    confirmationLink: string,
    platformName: string = 'Vendor Management Platform'
  ) {
    const subject = `Confirm your account - ${platformName}`;
    const html = this.createAccountConfirmationTemplate(confirmationLink, platformName);
    
    return this.sendEmail({
      to: email,
      subject,
      html
    });
  }

  async sendVendorApproval(
    email: string,
    vendorName: string,
    loginUrl?: string
  ) {
    const subject = 'Your vendor application has been approved!';
    const html = this.createVendorApprovalTemplate(vendorName, loginUrl);
    
    return this.sendEmail({
      to: email,
      subject,
      html
    });
  }

  async sendSystemAlert(
    email: string | string[],
    alertTitle: string,
    alertMessage: string,
    alertLevel: 'info' | 'warning' | 'error' | 'success' = 'info',
    actionUrl?: string,
    actionText?: string,
    platformName: string = 'Vendor Management Platform'
  ) {
    const alertConfig = {
      info: { color: '#17a2b8', icon: 'ℹ️' },
      warning: { color: '#ffc107', icon: '⚠️' },
      error: { color: '#dc3545', icon: '❌' },
      success: { color: '#28a745', icon: '✅' }
    };

    const config = alertConfig[alertLevel];
    const subject = `${config.icon} ${alertTitle} - ${platformName}`;
    const html = this.createSystemAlertTemplate(alertTitle, alertMessage, config.color, config.icon, actionUrl, actionText, platformName);

    return this.sendEmail({
      to: email,
      subject,
      html
    });
  }

  // Template creators
  private createVendorInvitationTemplate(companyName: string, inviteLink: string, customMessage?: string): string {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 28px;">Vendor Invitation</h1>
        </div>
        <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e9ecef;">
          <h2 style="color: #333; margin-top: 0;">Hello!</h2>
          <p style="color: #666; font-size: 16px; line-height: 1.6;">
            You've been invited to join <strong>${companyName}</strong>'s vendor network.
          </p>
          ${customMessage ? `
          <div style="background: #e3f2fd; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #2196f3;">
            <p style="margin: 0; color: #1976d2; font-style: italic;">${customMessage}</p>
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
  }

  private createPasswordResetTemplate(resetLink: string, platformName: string, expirationTime: string): string {
    return `
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
            This link will expire in ${expirationTime} for security reasons.
          </p>
          <p style="color: #999; font-size: 14px;">
            If you didn't request this password reset, please ignore this email or contact support if you have concerns.
          </p>
        </div>
      </div>
    `;
  }

  private createAccountConfirmationTemplate(confirmationLink: string, platformName: string): string {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: #28a745; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 28px;">Welcome!</h1>
        </div>
        <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e9ecef;">
          <h2 style="color: #333; margin-top: 0;">Confirm Your Account</h2>
          <p style="color: #666; font-size: 16px; line-height: 1.6;">
            Welcome to ${platformName}! Please confirm your email address to activate your account.
          </p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${confirmationLink}" style="background: #28a745; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; font-size: 16px; display: inline-block;">Confirm Account</a>
          </div>
          <p style="color: #999; font-size: 14px;">
            If you didn't create this account, please ignore this email.
          </p>
        </div>
      </div>
    `;
  }

  private createVendorApprovalTemplate(vendorName: string, loginUrl?: string): string {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: #28a745; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 28px;">🎉 Congratulations!</h1>
        </div>
        <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e9ecef;">
          <h2 style="color: #333; margin-top: 0;">Welcome to the Network, ${vendorName}!</h2>
          <p style="color: #666; font-size: 16px; line-height: 1.6;">
            Your vendor application has been approved and you're now part of our vendor network.
          </p>
          ${loginUrl ? `
          <div style="text-align: center; margin: 30px 0;">
            <a href="${loginUrl}" style="background: #28a745; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; font-size: 16px; display: inline-block;">Access Vendor Portal</a>
          </div>
          ` : ''}
          <p style="color: #666; font-size: 16px; line-height: 1.6;">
            You can now access all vendor features including invoice management, contract viewing, and direct communication tools.
          </p>
        </div>
      </div>
    `;
  }

  private createSystemAlertTemplate(
    alertTitle: string, 
    alertMessage: string, 
    alertColor: string, 
    alertIcon: string, 
    actionUrl?: string, 
    actionText?: string, 
    platformName?: string
  ): string {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: ${alertColor}; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 28px;">${alertIcon} ${alertTitle}</h1>
        </div>
        <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e9ecef;">
          <p style="color: #666; font-size: 16px; line-height: 1.6;">
            ${alertMessage}
          </p>
          ${actionUrl ? `
          <div style="text-align: center; margin: 30px 0;">
            <a href="${actionUrl}" style="background: ${alertColor}; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; font-size: 16px; display: inline-block;">${actionText || 'Take Action'}</a>
          </div>
          ` : ''}
          <p style="color: #999; font-size: 14px;">
            This is an automated message from ${platformName || 'Vendor Management Platform'}.
          </p>
        </div>
      </div>
    `;
  }
}

// Create default instance
export const emailService = new EmailService();

// Export convenience functions for backward compatibility
export const sendVendorInvitationEmail = emailService.sendVendorInvitation.bind(emailService);
export const sendVendorApprovalEmail = emailService.sendVendorApproval.bind(emailService);
export const sendPasswordResetEmail = emailService.sendPasswordReset.bind(emailService);
export const sendAccountConfirmationEmail = emailService.sendAccountConfirmation.bind(emailService);
export const sendSystemAlertEmail = emailService.sendSystemAlert.bind(emailService);
