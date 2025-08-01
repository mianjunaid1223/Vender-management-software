import nodemailer from 'nodemailer';

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
}

class EmailService {
  private transporter: nodemailer.Transporter | null = null;
  private fromEmail: string;
  private fromName: string;

  constructor() {
    this.fromEmail = process.env.FROM_EMAIL || 'noreply@vendormanagement.com';
    this.fromName = process.env.FROM_NAME || 'Vendor Management System';

    // Check if email is configured
    if (!this.isConfigured()) {
      console.warn('⚠️  Email service not configured. Email notifications will be logged to console.');
      return;
    }

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
  }

  private isConfigured(): boolean {
    return !!(
      process.env.SMTP_HOST &&
      process.env.SMTP_PORT &&
      process.env.SMTP_USER &&
      process.env.SMTP_PASS
    );
  }

  async sendEmail(options: EmailOptions): Promise<boolean> {
    try {
      if (!this.isConfigured() || !this.transporter) {
        // Fallback to console logging if not configured
        console.log('📧 [EMAIL SIMULATION] Would send email:');
        console.log(`   To: ${options.to}`);
        console.log(`   Subject: ${options.subject}`);
        console.log(`   From: ${this.fromName} <${this.fromEmail}>`);
        console.log(`   HTML Content: ${options.html.substring(0, 200)}...`);
        return true;
      }

      const mailOptions = {
        from: options.from || `${this.fromName} <${this.fromEmail}>`,
        to: options.to,
        subject: options.subject,
        html: options.html,
      };

      const result = await this.transporter.sendMail(mailOptions);
      console.log('✅ Email sent successfully:', result.messageId);
      return true;
    } catch (error) {
      console.error('❌ Failed to send email:', error);
      return false;
    }
  }

  async verifyConnection(): Promise<boolean> {
    if (!this.isConfigured() || !this.transporter) {
      console.log('📧 Email service in simulation mode (not configured)');
      return true;
    }

    try {
      await this.transporter.verify();
      console.log('✅ Email service connection verified');
      return true;
    } catch (error) {
      console.error('❌ Email service connection failed:', error);
      return false;
    }
  }

  async sendVendorApprovalEmail(vendorEmail: string, vendorName: string, loginLink: string): Promise<boolean> {
    const subject = 'Your Vendor Account Has Been Approved';
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #4F46E5;">Welcome to Vendor Management System!</h2>
        <p>Hello ${vendorName || 'Vendor'},</p>
        <p>We're excited to inform you that your vendor account has been approved!</p>
        <p>You can now access your vendor portal using the link below:</p>
        <p>
          <a href="${loginLink}" 
             style="display: inline-block; padding: 10px 20px; background-color: #4F46E5; color: white; text-decoration: none; border-radius: 4px; margin: 20px 0;">
            Access Vendor Portal
          </a>
        </p>
        <p>If the button above doesn't work, you can copy and paste this link into your browser:</p>
        <p>${loginLink}</p>
        <p>If you have any questions or need assistance, please don't hesitate to contact our support team.</p>
        <p>Best regards,<br>The Vendor Management Team</p>
      </div>
    `;

    return this.sendEmail({
      to: vendorEmail,
      subject,
      html
    });
  }
}

// Export singleton instance
export const emailService = new EmailService();
export default emailService;
