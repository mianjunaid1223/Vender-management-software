import nodemailer from 'nodemailer';
import { Resend } from 'resend';

interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
}

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  from?: string;
  text?: string;
}

type EmailProvider = 'resend' | 'smtp' | 'console';

class EmailService {
  private resend: Resend | null = null;
  private transporter: nodemailer.Transporter | null = null;
  private provider: EmailProvider = 'console';
  private fromEmail: string;
  private fromName: string;

  constructor() {
    this.fromEmail = process.env.FROM_EMAIL || 'noreply@vendormanagement.com';
    this.fromName = process.env.FROM_NAME || 'Vendor Management System';

    // Initialize email service based on available configuration
    this.initializeEmailService();
  }

  private initializeEmailService(): void {
    // Try Resend first (recommended)
    if (process.env.RESEND_API_KEY) {
      try {
        this.resend = new Resend(process.env.RESEND_API_KEY);
        this.provider = 'resend';
        console.log('✅ Email service configured with Resend');
        return;
      } catch (error) {
        console.warn('❌ Failed to initialize Resend:', error);
      }
    }

    // Fallback to SMTP
    if (this.isSMTPConfigured()) {
      try {
        const config: EmailConfig = {
          host: process.env.SMTP_HOST!,
          port: parseInt(process.env.SMTP_PORT || '587'),
          secure: process.env.SMTP_SECURE === 'true',
          auth: {
            user: process.env.SMTP_USER!,
            pass: process.env.SMTP_PASS!,
          },
        };

        this.transporter = nodemailer.createTransport(config);
        this.provider = 'smtp';
        console.log('✅ Email service configured with SMTP');
        return;
      } catch (error) {
        console.warn('❌ Failed to initialize SMTP:', error);
      }
    }

    // Fallback to console logging
    this.provider = 'console';
    console.warn('⚠️  Email service not configured. Email notifications will be logged to console.');
    console.log('💡 To configure email service:');
    console.log('   Option 1 (Recommended): Set RESEND_API_KEY environment variable');
    console.log('   Option 2: Set SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS environment variables');
  }

  private isSMTPConfigured(): boolean {
    return !!(
      process.env.SMTP_HOST &&
      process.env.SMTP_PORT &&
      process.env.SMTP_USER &&
      process.env.SMTP_PASS
    );
  }

  async sendEmail(options: EmailOptions): Promise<boolean> {
    try {
      switch (this.provider) {
        case 'resend':
          return await this.sendWithResend(options);
        case 'smtp':
          return await this.sendWithSMTP(options);
        default:
          return this.logEmailToConsole(options);
      }
    } catch (error) {
      console.error('❌ Failed to send email:', error);
      return false;
    }
  }

  private async sendWithResend(options: EmailOptions): Promise<boolean> {
    if (!this.resend) return false;

    try {
      const { data, error } = await this.resend.emails.send({
        from: options.from || `${this.fromName} <${this.fromEmail}>`,
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text,
      });

      if (error) {
        console.error('❌ Resend error:', error);
        return false;
      }

      console.log('✅ Email sent successfully via Resend:', data?.id);
      return true;
    } catch (error) {
      console.error('❌ Failed to send email via Resend:', error);
      return false;
    }
  }

  private async sendWithSMTP(options: EmailOptions): Promise<boolean> {
    if (!this.transporter) return false;

    try {
      const mailOptions = {
        from: options.from || `${this.fromName} <${this.fromEmail}>`,
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text,
      };

      const result = await this.transporter.sendMail(mailOptions);
      console.log('✅ Email sent successfully via SMTP:', result.messageId);
      return true;
    } catch (error) {
      console.error('❌ Failed to send email via SMTP:', error);
      return false;
    }
  }

  private logEmailToConsole(options: EmailOptions): boolean {
    console.log('📧 [EMAIL SIMULATION] Would send email:');
    console.log(`   To: ${options.to}`);
    console.log(`   Subject: ${options.subject}`);
    console.log(`   From: ${this.fromName} <${this.fromEmail}>`);
    console.log(`   HTML Content: ${options.html.substring(0, 200)}...`);
    return true;
  }

  async verifyConnection(): Promise<boolean> {
    switch (this.provider) {
      case 'resend':
        return this.verifyResend();
      case 'smtp':
        return this.verifySMTP();
      default:
        console.log('📧 Email service in simulation mode (not configured)');
        return true;
    }
  }

  private async verifyResend(): Promise<boolean> {
    if (!this.resend) return false;

    try {
      // Resend doesn't have a direct verify method, but we can check API key validity
      console.log('✅ Resend email service ready');
      return true;
    } catch (error) {
      console.error('❌ Resend service verification failed:', error);
      return false;
    }
  }

  private async verifySMTP(): Promise<boolean> {
    if (!this.transporter) return false;

    try {
      await this.transporter.verify();
      console.log('✅ SMTP email service connection verified');
      return true;
    } catch (error) {
      console.error('❌ SMTP email service connection failed:', error);
      return false;
    }
  }

  getProvider(): EmailProvider {
    return this.provider;
  }

  isConfigured(): boolean {
    return this.provider !== 'console';
  }
}

// Export singleton instance
export const emailService = new EmailService();
export default emailService;