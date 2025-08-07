// Mock email service (replace Resend)
// In production, you would implement your actual email service here

const mockEmailService = {
  emails: {
    async send(params: any) {
      console.log('Mock email sent:', params);
      return { success: true, id: 'mock-email-id' };
    }
  }
};

const sendEmail = async (to: string, subject: string, html: string) => {
  try {
    await mockEmailService.emails.send({
      from: 'noreply@vendorverse.com',
      to,
      subject,
      html,
    });
    return { success: true };
  } catch (error) {
    console.error('Email sending error:', error);
    return { success: false, error };
  }
};

export const sendVendorInvitationEmail = async (to: string, companyName: string, inviteLink: string, message?: string) => {
  const subject = `Invitation to become a vendor for ${companyName}`;
  const html = `
    <h1>You have been invited to become a vendor for ${companyName}</h1>
    ${message ? `<p><strong>Message from the team:</strong> ${message}</p>` : ''}
    <p>Click the link below to complete your registration:</p>
    <a href="${inviteLink}">Complete Registration</a>
    <p>This link will expire in 7 days.</p>
  `;
  return sendEmail(to, subject, html);
};

export async function sendVendorApprovalEmail(email: string, vendorName: string, loginUrl?: string) {
  const subject = 'Your vendor application has been approved!';
  const html = `
    <h1>Congratulations, ${vendorName}!</h1>
    <p>Your vendor application has been approved.</p>
    ${loginUrl ? `<p>You can access your vendor portal here: <a href="${loginUrl}">Login to Vendor Portal</a></p>` : ''}
    <p>Welcome to our vendor network!</p>
  `;
  return sendEmail(email, subject, html);
}

export const sendVendorRejectionEmail = async (to: string, vendorName: string) => {
  const subject = 'Update on your vendor application';
  const html = `
    <h1>Hello, ${vendorName}</h1>
    <p>Thank you for your interest. After careful consideration, we have decided not to move forward with your application at this time.</p>
    <p>We wish you the best in your future endeavors.</p>
  `;
  return sendEmail(to, subject, html);
};
