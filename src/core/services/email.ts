import nodemailer from 'nodemailer';

/**
 * Centralized Email Service
 * 
 * Supports multiple email providers with automatic fallback:
 * 1. SMTP (Gmail, Outlook, SendGrid, SES, custom)
 * 2. Console logging (development/testing)
 * 
 * Usage:
 * import { emailService } from '@/core/services/email';
 * await emailService.sendEmail({ to, subject, html });
 */

interface EmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  from?: string;
  cc?: string | string[];
  bcc?: string | string[];
  attachments?: Array<{
    filename: string;
    content: string | Buffer;
    contentType?: string;
  }>;
}

interface EmailResponse {
  success: boolean;
  messageId?: string;
  error?: string;
}

type EmailProvider = 'smtp' | 'console';

class EmailService {
  private transporter: nodemailer.Transporter | null = null;
  private provider: EmailProvider = 'console';
  private fromEmail: string;
  private fromName: string;
  private isConfigured: boolean = false;

  constructor() {
    this.fromEmail = process.env.FROM_EMAIL || 'noreply@vendormanagement.com';
    this.fromName = process.env.FROM_NAME || 'Vendor Management System';
    this.initializeEmailService();
  }

  private initializeEmailService(): void {
    // Try SMTP configuration
    if (this.hasSMTPConfig()) {
      try {
        this.transporter = nodemailer.createTransport({
          host: process.env.SMTP_HOST!,
          port: parseInt(process.env.SMTP_PORT || '587'),
          secure: process.env.SMTP_SECURE === 'true',
          auth: {
            user: process.env.SMTP_USER!,
            pass: process.env.SMTP_PASS!,
          },
          // Additional options for better reliability
          pool: true, // Use pooled connections
          maxConnections: 5,
          maxMessages: 100,
          rateDelta: 1000, // Max 1 email per second
          rateLimit: 1,
        });

        this.provider = 'smtp';
        this.isConfigured = true;
        console.log('✅ Email service configured with SMTP:', process.env.SMTP_HOST);
        
        // Verify connection
        this.verifyConnection();
      } catch (error) {
        console.warn('❌ Failed to initialize SMTP:', error);
        this.fallbackToConsole();
      }
    } else {
      this.fallbackToConsole();
    }
  }

  private hasSMTPConfig(): boolean {
    return !!(
      process.env.SMTP_HOST &&
      process.env.SMTP_PORT &&
      process.env.SMTP_USER &&
      process.env.SMTP_PASS
    );
  }

  private fallbackToConsole(): void {
    this.provider = 'console';
    this.isConfigured = false;
    console.warn('⚠️  Email service not configured. Emails will be logged to console.');
    console.log('ℹ️  To enable emails, set SMTP_* environment variables.');
  }

  /**
   * Verify email service connection
   */
  async verifyConnection(): Promise<boolean> {
    if (this.provider === 'console') {
      return false;
    }

    if (this.provider === 'smtp' && this.transporter) {
      try {
        await this.transporter.verify();
        console.log('✅ SMTP connection verified');
        return true;
      } catch (error) {
        console.error('❌ SMTP verification failed:', error);
        return false;
      }
    }

    return false;
  }

  /**
   * Send an email
   */
  async sendEmail(options: EmailOptions): Promise<EmailResponse> {
    const { to, subject, html, text, from, cc, bcc, attachments } = options;

    // Format sender
    const sender = from || `${this.fromName} <${this.fromEmail}>`;

    // Console logging (fallback or development)
    if (this.provider === 'console') {
      console.log('📧 Email (Console Mode):');
      console.log('  From:', sender);
      console.log('  To:', Array.isArray(to) ? to.join(', ') : to);
      console.log('  Subject:', subject);
      console.log('  HTML Length:', html.length, 'chars');
      if (text) console.log('  Text Length:', text.length, 'chars');
      if (cc) console.log('  CC:', Array.isArray(cc) ? cc.join(', ') : cc);
      if (bcc) console.log('  BCC:', Array.isArray(bcc) ? bcc.join(', ') : bcc);
      if (attachments) console.log('  Attachments:', attachments.length);
      
      return {
        success: true,
        messageId: `console-${Date.now()}`,
      };
    }

    // SMTP sending
    if (this.provider === 'smtp' && this.transporter) {
      try {
        const info = await this.transporter.sendMail({
          from: sender,
          to: Array.isArray(to) ? to.join(', ') : to,
          cc: cc ? (Array.isArray(cc) ? cc.join(', ') : cc) : undefined,
          bcc: bcc ? (Array.isArray(bcc) ? bcc.join(', ') : bcc) : undefined,
          subject,
          html,
          text: text || this.stripHtml(html),
          attachments,
        });

        console.log('✅ Email sent via SMTP:', info.messageId);
        
        return {
          success: true,
          messageId: info.messageId,
        };
      } catch (error) {
        console.error('❌ Failed to send email via SMTP:', error);
        
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        };
      }
    }

    return {
      success: false,
      error: 'No email provider configured',
    };
  }

  /**
   * Send multiple emails (bulk)
   */
  async sendBulkEmails(emails: EmailOptions[]): Promise<EmailResponse[]> {
    const results: EmailResponse[] = [];
    
    for (const email of emails) {
      const result = await this.sendEmail(email);
      results.push(result);
      
      // Small delay to avoid rate limiting
      if (this.provider === 'smtp') {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
    
    return results;
  }

  /**
   * Simple HTML to text conversion
   */
  private stripHtml(html: string): string {
    return html
      .replace(/<style[^>]*>.*?<\/style>/gi, '')
      .replace(/<script[^>]*>.*?<\/script>/gi, '')
      .replace(/<[^>]+>/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Get current provider
   */
  getProvider(): EmailProvider {
    return this.provider;
  }

  /**
   * Check if email service is configured
   */
  isEmailConfigured(): boolean {
    return this.isConfigured;
  }

  /**
   * Get service status
   */
  getStatus() {
    return {
      provider: this.provider,
      configured: this.isConfigured,
      fromEmail: this.fromEmail,
      fromName: this.fromName,
    };
  }
}

// Export singleton instance
export const emailService = new EmailService();

// Export types
export type { EmailOptions, EmailResponse };
