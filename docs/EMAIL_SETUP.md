# Email Service Configuration Guide# Email Service Configuration Guide# Email Service Configuration Guide



Complete guide to configuring email notifications for the Vendor Management Platform.



## OverviewThis guide explains how to configure email notifications for the Vendor Management Platform.This guide explains how to configure email notifications for the Vendor Management Platform.



The platform uses a centralized email service (`@/core/services/email`) that supports:



1. **SMTP** - Works with Gmail, Outlook, SendGrid, Amazon SES, and any SMTP server## Overview## Overview

2. **Console Logging** - Development/testing fallback (no email sent, just logged)



## Quick Start

The platform supports multiple email providers with automatic fallback:The platform supports multiple email providers with automatic fallback:

### Step 1: Choose Your Email Provider



**Recommended for SMB ($20-$65/month tier):**

- Gmail (Free with Google account)1. **Resend** (Recommended) - Modern, reliable email API1. **Resend** (Recommended) - Modern, reliable email API

- Outlook/Office 365 (If you have Microsoft 365)

- SendGrid (Free tier: 100 emails/day)2. **SMTP** - Traditional email server configuration  2. **SMTP** - Traditional email server configuration



### Step 2: Configure Environment Variables3. **Console Logging** - Development/testing fallback3. **Console Logging** - Development/testing fallback



Add these to your `.env.local` file:



```env## Quick Setup## Quick Setup

SMTP_HOST=smtp.gmail.com

SMTP_PORT=587

SMTP_SECURE=false

SMTP_USER=your-email@gmail.com### Option 1: Resend (Recommended)### Option 1: Resend (Recommended)

SMTP_PASS=your-app-password

FROM_EMAIL=your-email@gmail.com

FROM_NAME=Your Company Name

```1. **Sign up for Resend**1. **Sign up for Resend**



### Step 3: Restart Your Application   - Visit [resend.com](https://resend.com)   - Visit [resend.com](https://resend.com)



```bash   - Create a free account (100 emails/day free tier)   - Create a free account (100 emails/day free tier)

npm run dev

```   - Generate an API key   - Generate an API key



You should see: `✅ Email service configured with SMTP: smtp.gmail.com`



## Provider-Specific Setup2. **Configure Environment Variables**2. **Configure Environment Variables**



### Gmail Configuration   ```env   ```env



1. **Enable 2-Factor Authentication**   RESEND_API_KEY=re_your_api_key_here   RESEND_API_KEY=re_your_api_key_here

   - Go to https://myaccount.google.com/security

   - Enable 2-Step Verification   FROM_EMAIL=noreply@yourdomain.com   FROM_EMAIL=noreply@yourdomain.com



2. **Generate App Password**   FROM_NAME=Vendor Management System   FROM_NAME=Vendor Management System

   - Go to https://myaccount.google.com/apppasswords

   - Select "Mail" as the app   ```   ```

   - Copy the 16-character password



3. **Update `.env.local`**

3. **Domain Setup (Production)**3. **Domain Setup (Production)**

```env

SMTP_HOST=smtp.gmail.com   - Add your domain to Resend   - Add your domain to Resend

SMTP_PORT=587

SMTP_SECURE=false   - Configure DNS records (SPF, DKIM, DMARC)   - Configure DNS records (SPF, DKIM, DMARC)

SMTP_USER=your-email@gmail.com

SMTP_PASS=your-16-digit-app-password   - Verify domain ownership   - Verify domain ownership

FROM_EMAIL=your-email@gmail.com

FROM_NAME=Your Company Name

```

### Option 2: SMTP Configuration### Option 2: SMTP Configuration

### Outlook/Office 365 Configuration



```env

SMTP_HOST=smtp-mail.outlook.com1. **Choose SMTP Provider**1. **Choose SMTP Provider**

SMTP_PORT=587

SMTP_SECURE=false   - Gmail (with App Password)   - Gmail (with App Password)

SMTP_USER=your-email@outlook.com

SMTP_PASS=your-password   - Outlook/Office 365   - Outlook/Office 365

FROM_EMAIL=your-email@outlook.com

FROM_NAME=Your Company Name   - SendGrid SMTP   - SendGrid SMTP

```

   - Amazon SES   - Amazon SES

### SendGrid Configuration

   - Custom SMTP server   - Custom SMTP server

1. **Sign up at** https://sendgrid.com (Free tier available)

2. **Create API Key** in Settings → API Keys

3. **Update `.env.local`**

2. **Configure Environment Variables**2. **Configure Environment Variables**

```env

SMTP_HOST=smtp.sendgrid.net   ```env   ```env

SMTP_PORT=587

SMTP_SECURE=false   SMTP_HOST=smtp.gmail.com   SMTP_HOST=smtp.gmail.com

SMTP_USER=apikey

SMTP_PASS=your-sendgrid-api-key   SMTP_PORT=587   SMTP_PORT=587

FROM_EMAIL=noreply@yourdomain.com

FROM_NAME=Your Company Name   SMTP_SECURE=false   SMTP_SECURE=false

```

   SMTP_USER=your-email@gmail.com   SMTP_USER=your-email@gmail.com

### Amazon SES Configuration

   SMTP_PASS=your-app-password   SMTP_PASS=your-app-password

```env

SMTP_HOST=email-smtp.us-east-1.amazonaws.com   FROM_EMAIL=your-email@gmail.com   FROM_EMAIL=your-email@gmail.com

SMTP_PORT=587

SMTP_SECURE=false   FROM_NAME=Vendor Management System   FROM_NAME=Vendor Management System

SMTP_USER=your-ses-access-key

SMTP_PASS=your-ses-secret-key   ```   ```

FROM_EMAIL=verified@yourdomain.com

FROM_NAME=Your Company Name- **Payment reminders** - Orange alerts for upcoming due dates  

```

## Provider-Specific Setup- **Payment confirmations** - Logged to console when invoices are marked as paid

## Email Types Sent by the Platform



### 1. Vendor Portal Access

- **When:** Admin grants vendor portal access### Gmail Setup### 2. In-App Only

- **To:** New vendor user

- **Content:** Login credentials, setup link, portal access instructions- ✅ All notification logic works normally



### 2. Invoice Notifications1. **Enable 2-Factor Authentication**- � Notifications appear in dashboard alerts

- **When:** New invoice created or updated

- **To:** Vendor   - Go to Google Account settings- 🔍 Perfect for internal management

- **Content:** Invoice details, amount, due date, view link

   - Enable 2FA for your Gmail account- ❌ No external emails are sent

### 3. Contract Notifications

- **When:** Contract requires vendor attention

- **To:** Vendor

- **Content:** Contract details, status, action required2. **Generate App Password**## Current Configuration



### 4. Password Reset   - Go to Security → App passwords

- **When:** User requests password reset

- **To:** User   - Generate password for "Mail"### Email Service Status

- **Content:** Secure reset link (expires in 1 hour)

   - Use this password in SMTP_PASS- 🔴 **Email sending: DISABLED**

## Testing Email Configuration

- 📱 **Dashboard alerts: ENABLED**

### 1. Check Service Status

3. **Configuration**- 📝 **Console logging: ENABLED**

After starting your app, check the console:

   ```env

```bash

✅ Email service configured with SMTP: smtp.gmail.com   SMTP_HOST=smtp.gmail.com### Environment Setup

✅ SMTP connection verified

```   SMTP_PORT=587Email configuration is commented out in `.env.local`:



### 2. Test Email Sending   SMTP_SECURE=false```bash



1. Log in as admin   SMTP_USER=your-email@gmail.com# Email Configuration - DISABLED (In-app notifications only)

2. Go to Vendors section

3. Grant portal access to a vendor   SMTP_PASS=your-16-digit-app-password# SMTP_HOST=smtp.ethereal.email

4. Check that email was sent

   ```# SMTP_PORT=587

### 3. Console Logging Mode

# etc...

If no SMTP is configured, you'll see:

### Outlook/Office 365 Setup```

```bash

⚠️  Email service not configured. Emails will be logged to console.

ℹ️  To enable emails, set SMTP_* environment variables.

``````env## How It Works



Emails will be logged like this:SMTP_HOST=smtp-mail.outlook.com



```bashSMTP_PORT=587### Automatic Alert Generation

📧 Email (Console Mode):

  From: Your Company <noreply@yourcompany.com>SMTP_SECURE=falseThe system still runs all notification logic:

  To: vendor@company.com

  Subject: Your Vendor Portal Access - Welcome!SMTP_USER=your-email@outlook.com1. **Overdue Detection**: Checks invoice due dates daily

  HTML Length: 2847 chars

```SMTP_PASS=your-password2. **Status Updates**: Automatically updates invoice status to "Overdue"



## Troubleshooting```3. **Alert Creation**: Generates dashboard alerts for display



### "Email service not configured" Warning4. **Console Logging**: Logs notification events for debugging



**Problem:** No SMTP settings found  ### SendGrid SMTP Setup

**Solution:**

1. Check `.env.local` file exists### Dashboard Display

2. Verify all SMTP_* variables are set

3. Restart the application```env- Alerts appear at the top of the dashboard



### "SMTP Authentication Failed"SMTP_HOST=smtp.sendgrid.net- Color-coded by severity (red=overdue, orange=upcoming, green=paid)



**Problem:** Invalid credentials  SMTP_PORT=587- Shows invoice details and action buttons

**Solution:**

1. Verify SMTP_USER and SMTP_PASS are correctSMTP_SECURE=false- Dismissible by users

2. For Gmail, ensure you're using App Password (not regular password)

3. Check if 2FA is enabled (required for Gmail App Passwords)SMTP_USER=apikey



### Emails Not DeliveredSMTP_PASS=your-sendgrid-api-key## Console Logging



**Problem:** Emails sent but not received  ```

**Solution:**

1. Check recipient's spam/junk folderLook for these log messages:

2. Verify FROM_EMAIL is valid

3. For custom domains, set up SPF/DKIM records### Amazon SES Setup```

4. Check email provider logs

📱 In-app notification: Invoice #7577 is 3 days overdue

### "Connection timeout" Error

```env📱 In-app notification: Invoice #7578 due tomorrow

**Problem:** Can't connect to SMTP server  

**Solution:**SMTP_HOST=email-smtp.us-east-1.amazonaws.com📱 In-app notification: Payment confirmed for Invoice #7579

1. Verify SMTP_HOST is correct

2. Check SMTP_PORT matches your providerSMTP_PORT=587```

3. Try toggling SMTP_SECURE (true/false)

4. Check firewall/network settingsSMTP_SECURE=false



## Production Best PracticesSMTP_USER=your-ses-access-key## Benefits of In-App Only



### SecuritySMTP_PASS=your-ses-secret-key



1. **Never commit credentials to Git**```### Advantages:



```bash- ✅ No email authentication issues

# .env.local should be in .gitignore

echo ".env.local" >> .gitignore## Email Templates- ✅ No spam/delivery concerns  

```

- ✅ Immediate visibility on dashboard

2. **Use environment variables**

The platform sends various types of emails:- ✅ Centralized notification management

```bash

# On your production server- ✅ No external dependencies

export SMTP_HOST="smtp.gmail.com"

export SMTP_USER="your-email@gmail.com"### Vendor Portal Access

export SMTP_PASS="your-app-password"

```- **Subject**: "Your Vendor Portal Access"### User Experience:



3. **Rotate passwords regularly**- **Trigger**: When vendor access is granted- Users see alerts immediately when they log in

   - Change SMTP passwords every 90 days

   - Use strong, unique passwords- **Content**: Login credentials and portal URL- All notifications in one place



### Email Deliverability- Clear action buttons for each alert



1. **Domain Authentication** (for custom domains)### Invoice Notifications- Real-time status updates

   - Set up SPF record: `v=spf1 include:_spf.google.com ~all`

   - Configure DKIM signing- **Subject**: "New Invoice #[NUMBER]"

   - Set up DMARC policy

- **Trigger**: When invoice is created/updated## Alert Management

2. **Rate Limiting**

   - The service includes built-in rate limiting (1 email/second)- **Content**: Invoice details and payment information

   - Monitor sending volume

   - Respect provider limits### Automatic Triggers:



3. **Sender Reputation**### Contract Notifications- **Overdue**: When invoice due date passes

   - Use consistent FROM_EMAIL

   - Avoid spam trigger words- **Subject**: "Contract Update - [CONTRACT_TITLE]"- **Upcoming**: 1-3 days before due date

   - Include unsubscribe options for marketing emails

- **Trigger**: When contract requires vendor attention- **Due Today**: On the due date

## Development vs Production

- **Content**: Contract details and action required

### Development Mode

### User Actions:

For local development, you can use console logging:

### Password Reset- View invoice details

```env

# Comment out or remove SMTP settings- **Subject**: "Reset Your Password"- Mark invoices as paid

# SMTP_HOST=

# SMTP_PORT=- **Trigger**: When vendor requests password reset- Dismiss alerts

# SMTP_USER=

# SMTP_PASS=- **Content**: Secure reset link (expires in 1 hour)- Navigate to invoice management

```



Emails will be logged to console instead of sent.

## Testing Email Configuration## Re-enabling Emails (Optional)

### Production Mode



Always configure real SMTP in production:

### 1. Environment TestIf you want to re-enable email sending in the future:

```env

SMTP_HOST=smtp.gmail.com```bash

SMTP_PORT=587

SMTP_SECURE=false# Run the application and check console output1. **Update Environment Variables**:

SMTP_USER=production-email@yourcompany.com

SMTP_PASS=your-production-passwordnpm run dev   ```bash

FROM_EMAIL=noreply@yourcompany.com

FROM_NAME=Your Company Name   SMTP_HOST=your-smtp-host

NODE_ENV=production

```# Look for email service initialization messages:   SMTP_PORT=587



## API Reference# ✅ Email service configured with Resend   SMTP_USER=your-email



### Sending Emails Programmatically# OR   SMTP_PASS=your-password



```typescript# ✅ Email service configured with SMTP   ```

import { emailService } from '@/core/services/email';

import { emailTemplates } from '@/core/services/email-templates';# OR



// Using template# ⚠️  Email service not configured (console mode)2. **Update Notification Functions**:

const emailContent = emailTemplates.vendorPortalAccess({

  vendorName: 'ACME Corp',```   - Restore email sending code in `email-notifications.ts`

  companyName: 'Your Company',

  email: 'vendor@acme.com',   - Re-import and use `emailService`

  temporaryPassword: 'temp123',

  loginUrl: 'https://yourapp.com/vendor-portal/login',### 2. Send Test Email

});

The application includes email verification on startup. Check the console for:3. **Test Configuration**:

await emailService.sendEmail({

  to: 'vendor@acme.com',- Connection verification results   - Verify SMTP credentials

  subject: emailContent.subject,

  html: emailContent.html,- Any configuration errors   - Test with development email service

});



// Custom email

await emailService.sendEmail({### 3. Manual Test## Current Status

  to: 'recipient@example.com',

  subject: 'Your Subject',Use the admin panel to:

  html: '<h1>Hello!</h1><p>Your message here</p>',

  cc: 'manager@example.com',1. Create a test vendor🟢 **In-app notification system is fully functional**

  attachments: [{

    filename: 'invoice.pdf',2. Grant portal access- Dashboard alerts working

    content: pdfBuffer,

    contentType: 'application/pdf',3. Check if invitation email is sent- Automatic status updates active

  }],

});- Console logging enabled

```

## Production Configuration- No email dependencies

### Available Templates



```typescript

import { emailTemplates } from '@/core/services/email-templates';### Security Best PracticesYour notification system is now focused on providing immediate, in-app visibility of invoice status changes! 🎉



// 1. Vendor Portal Access

emailTemplates.vendorPortalAccess({1. **Use Environment Variables**

  vendorName: string,   ```bash

  companyName: string,   # Never commit email credentials to code

  email: string,   export RESEND_API_KEY="re_your_production_key"

  temporaryPassword: string,   export FROM_EMAIL="noreply@yourcompany.com"

  loginUrl: string,   ```

});

2. **Domain Authentication**

// 2. Invoice Notification   - Set up SPF records: `v=spf1 include:_spf.resend.com ~all`

emailTemplates.invoiceNotification({   - Configure DKIM signing

  invoiceNumber: string,   - Set up DMARC policy

  vendorName: string,

  amount: number,3. **Rate Limiting**

  dueDate: string,   - Monitor email sending volume

  invoiceUrl: string,   - Implement retry logic for failed sends

});   - Set up alerts for delivery failures



// 3. Contract Notification## Troubleshooting

emailTemplates.contractNotification({

  contractTitle: string,### Common Issues

  vendorName: string,

  status: string,1. **"Email service not configured" Warning**

  startDate: string,   - Check environment variables are set

  endDate: string,   - Verify variable names match exactly

  contractUrl: string,   - Restart the application after changes

});

2. **SMTP Authentication Failures**

// 4. Password Reset   - Verify credentials are correct

emailTemplates.passwordReset({   - Check if 2FA/App passwords are required

  vendorName: string,   - Ensure SMTP settings match provider requirements

  resetUrl: string,

  expiresIn: string,3. **Emails Not Delivered**

});   - Check spam/junk folders

```   - Verify sender reputation

   - Review email service logs

## Environment Variables Reference   - Check domain DNS configuration



| Variable | Required | Description | Example |### Debug Mode

|----------|----------|-------------|---------|

| `SMTP_HOST` | Yes* | SMTP server hostname | `smtp.gmail.com` |Enable detailed email logging:

| `SMTP_PORT` | Yes* | SMTP server port | `587` |

| `SMTP_SECURE` | No | Use TLS (true/false) | `false` |```env

| `SMTP_USER` | Yes* | SMTP username/email | `user@gmail.com` |DEBUG_EMAIL=true

| `SMTP_PASS` | Yes* | SMTP password | `app-password` |NODE_ENV=development

| `FROM_EMAIL` | No | Sender email address | `noreply@company.com` |```

| `FROM_NAME` | No | Sender name | `Your Company` |

## Current Status

*Required for email sending. If not set, console logging mode is used.

If you see this warning during build/startup:

## Support```

⚠️  Email service not configured. Email notifications will be logged to console.

If you need help with email configuration:```



1. Check this documentation firstThis means:

2. Review console logs for specific error messages- No email service is currently configured

3. Test with a known working SMTP server (like Gmail)- Email notifications will be logged to console instead

4. Verify network connectivity to SMTP server- The application will work normally with in-app notifications

- To enable email sending, configure one of the options above

---

## Email Service Code Structure

**Note:** Email delivery can be affected by many factors including sender reputation, recipient email policies, and network conditions. Always test thoroughly in your specific environment before production deployment.

### Service Interface
```typescript
interface EmailService {
  sendEmail(options: EmailOptions): Promise<boolean>;
  verifyConnection(): Promise<boolean>;
  getProvider(): EmailProvider;
  isConfigured(): boolean;
}
```

### Usage Example
```typescript
import { emailService } from '@/lib/email-service';

// Send welcome email
await emailService.sendEmail({
  to: 'vendor@company.com',
  subject: 'Welcome to Vendor Portal',
  html: '<h1>Welcome!</h1><p>Your access has been granted.</p>',
  text: 'Welcome! Your access has been granted.'
});
```

---

**Note**: Email delivery can be affected by many factors including sender reputation, recipient email policies, and network conditions. Always test thoroughly in your specific environment.