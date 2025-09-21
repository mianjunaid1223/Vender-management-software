# Email Service Configuration Guide# Email Service Configuration Guide



This guide explains how to configure email notifications for the Vendor Management Platform.This guide explains how to configure email notifications for the Vendor Management Platform.



## Overview## Overview



The platform supports multiple email providers with automatic fallback:The platform supports multiple email providers with automatic fallback:



1. **Resend** (Recommended) - Modern, reliable email API1. **Resend** (Recommended) - Modern, reliable email API

2. **SMTP** - Traditional email server configuration  2. **SMTP** - Traditional email server configuration

3. **Console Logging** - Development/testing fallback3. **Console Logging** - Development/testing fallback



## Quick Setup## Quick Setup



### Option 1: Resend (Recommended)### Option 1: Resend (Recommended)



1. **Sign up for Resend**1. **Sign up for Resend**

   - Visit [resend.com](https://resend.com)   - Visit [resend.com](https://resend.com)

   - Create a free account (100 emails/day free tier)   - Create a free account (100 emails/day free tier)

   - Generate an API key   - Generate an API key



2. **Configure Environment Variables**2. **Configure Environment Variables**

   ```env   ```env

   RESEND_API_KEY=re_your_api_key_here   RESEND_API_KEY=re_your_api_key_here

   FROM_EMAIL=noreply@yourdomain.com   FROM_EMAIL=noreply@yourdomain.com

   FROM_NAME=Vendor Management System   FROM_NAME=Vendor Management System

   ```   ```



3. **Domain Setup (Production)**3. **Domain Setup (Production)**

   - Add your domain to Resend   - Add your domain to Resend

   - Configure DNS records (SPF, DKIM, DMARC)   - Configure DNS records (SPF, DKIM, DMARC)

   - Verify domain ownership   - Verify domain ownership



### Option 2: SMTP Configuration### Option 2: SMTP Configuration



1. **Choose SMTP Provider**1. **Choose SMTP Provider**

   - Gmail (with App Password)   - Gmail (with App Password)

   - Outlook/Office 365   - Outlook/Office 365

   - SendGrid SMTP   - SendGrid SMTP

   - Amazon SES   - Amazon SES

   - Custom SMTP server   - Custom SMTP server



2. **Configure Environment Variables**2. **Configure Environment Variables**

   ```env   ```env

   SMTP_HOST=smtp.gmail.com   SMTP_HOST=smtp.gmail.com

   SMTP_PORT=587   SMTP_PORT=587

   SMTP_SECURE=false   SMTP_SECURE=false

   SMTP_USER=your-email@gmail.com   SMTP_USER=your-email@gmail.com

   SMTP_PASS=your-app-password   SMTP_PASS=your-app-password

   FROM_EMAIL=your-email@gmail.com   FROM_EMAIL=your-email@gmail.com

   FROM_NAME=Vendor Management System   FROM_NAME=Vendor Management System

   ```   ```

- **Payment reminders** - Orange alerts for upcoming due dates  

## Provider-Specific Setup- **Payment confirmations** - Logged to console when invoices are marked as paid



### Gmail Setup### 2. In-App Only

- ✅ All notification logic works normally

1. **Enable 2-Factor Authentication**- � Notifications appear in dashboard alerts

   - Go to Google Account settings- 🔍 Perfect for internal management

   - Enable 2FA for your Gmail account- ❌ No external emails are sent



2. **Generate App Password**## Current Configuration

   - Go to Security → App passwords

   - Generate password for "Mail"### Email Service Status

   - Use this password in SMTP_PASS- 🔴 **Email sending: DISABLED**

- 📱 **Dashboard alerts: ENABLED**

3. **Configuration**- 📝 **Console logging: ENABLED**

   ```env

   SMTP_HOST=smtp.gmail.com### Environment Setup

   SMTP_PORT=587Email configuration is commented out in `.env.local`:

   SMTP_SECURE=false```bash

   SMTP_USER=your-email@gmail.com# Email Configuration - DISABLED (In-app notifications only)

   SMTP_PASS=your-16-digit-app-password# SMTP_HOST=smtp.ethereal.email

   ```# SMTP_PORT=587

# etc...

### Outlook/Office 365 Setup```



```env## How It Works

SMTP_HOST=smtp-mail.outlook.com

SMTP_PORT=587### Automatic Alert Generation

SMTP_SECURE=falseThe system still runs all notification logic:

SMTP_USER=your-email@outlook.com1. **Overdue Detection**: Checks invoice due dates daily

SMTP_PASS=your-password2. **Status Updates**: Automatically updates invoice status to "Overdue"

```3. **Alert Creation**: Generates dashboard alerts for display

4. **Console Logging**: Logs notification events for debugging

### SendGrid SMTP Setup

### Dashboard Display

```env- Alerts appear at the top of the dashboard

SMTP_HOST=smtp.sendgrid.net- Color-coded by severity (red=overdue, orange=upcoming, green=paid)

SMTP_PORT=587- Shows invoice details and action buttons

SMTP_SECURE=false- Dismissible by users

SMTP_USER=apikey

SMTP_PASS=your-sendgrid-api-key## Console Logging

```

Look for these log messages:

### Amazon SES Setup```

📱 In-app notification: Invoice #7577 is 3 days overdue

```env📱 In-app notification: Invoice #7578 due tomorrow

SMTP_HOST=email-smtp.us-east-1.amazonaws.com📱 In-app notification: Payment confirmed for Invoice #7579

SMTP_PORT=587```

SMTP_SECURE=false

SMTP_USER=your-ses-access-key## Benefits of In-App Only

SMTP_PASS=your-ses-secret-key

```### Advantages:

- ✅ No email authentication issues

## Email Templates- ✅ No spam/delivery concerns  

- ✅ Immediate visibility on dashboard

The platform sends various types of emails:- ✅ Centralized notification management

- ✅ No external dependencies

### Vendor Portal Access

- **Subject**: "Your Vendor Portal Access"### User Experience:

- **Trigger**: When vendor access is granted- Users see alerts immediately when they log in

- **Content**: Login credentials and portal URL- All notifications in one place

- Clear action buttons for each alert

### Invoice Notifications- Real-time status updates

- **Subject**: "New Invoice #[NUMBER]"

- **Trigger**: When invoice is created/updated## Alert Management

- **Content**: Invoice details and payment information

### Automatic Triggers:

### Contract Notifications- **Overdue**: When invoice due date passes

- **Subject**: "Contract Update - [CONTRACT_TITLE]"- **Upcoming**: 1-3 days before due date

- **Trigger**: When contract requires vendor attention- **Due Today**: On the due date

- **Content**: Contract details and action required

### User Actions:

### Password Reset- View invoice details

- **Subject**: "Reset Your Password"- Mark invoices as paid

- **Trigger**: When vendor requests password reset- Dismiss alerts

- **Content**: Secure reset link (expires in 1 hour)- Navigate to invoice management



## Testing Email Configuration## Re-enabling Emails (Optional)



### 1. Environment TestIf you want to re-enable email sending in the future:

```bash

# Run the application and check console output1. **Update Environment Variables**:

npm run dev   ```bash

   SMTP_HOST=your-smtp-host

# Look for email service initialization messages:   SMTP_PORT=587

# ✅ Email service configured with Resend   SMTP_USER=your-email

# OR   SMTP_PASS=your-password

# ✅ Email service configured with SMTP   ```

# OR

# ⚠️  Email service not configured (console mode)2. **Update Notification Functions**:

```   - Restore email sending code in `email-notifications.ts`

   - Re-import and use `emailService`

### 2. Send Test Email

The application includes email verification on startup. Check the console for:3. **Test Configuration**:

- Connection verification results   - Verify SMTP credentials

- Any configuration errors   - Test with development email service



### 3. Manual Test## Current Status

Use the admin panel to:

1. Create a test vendor🟢 **In-app notification system is fully functional**

2. Grant portal access- Dashboard alerts working

3. Check if invitation email is sent- Automatic status updates active

- Console logging enabled

## Production Configuration- No email dependencies



### Security Best PracticesYour notification system is now focused on providing immediate, in-app visibility of invoice status changes! 🎉


1. **Use Environment Variables**
   ```bash
   # Never commit email credentials to code
   export RESEND_API_KEY="re_your_production_key"
   export FROM_EMAIL="noreply@yourcompany.com"
   ```

2. **Domain Authentication**
   - Set up SPF records: `v=spf1 include:_spf.resend.com ~all`
   - Configure DKIM signing
   - Set up DMARC policy

3. **Rate Limiting**
   - Monitor email sending volume
   - Implement retry logic for failed sends
   - Set up alerts for delivery failures

## Troubleshooting

### Common Issues

1. **"Email service not configured" Warning**
   - Check environment variables are set
   - Verify variable names match exactly
   - Restart the application after changes

2. **SMTP Authentication Failures**
   - Verify credentials are correct
   - Check if 2FA/App passwords are required
   - Ensure SMTP settings match provider requirements

3. **Emails Not Delivered**
   - Check spam/junk folders
   - Verify sender reputation
   - Review email service logs
   - Check domain DNS configuration

### Debug Mode

Enable detailed email logging:

```env
DEBUG_EMAIL=true
NODE_ENV=development
```

## Current Status

If you see this warning during build/startup:
```
⚠️  Email service not configured. Email notifications will be logged to console.
```

This means:
- No email service is currently configured
- Email notifications will be logged to console instead
- The application will work normally with in-app notifications
- To enable email sending, configure one of the options above

## Email Service Code Structure

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