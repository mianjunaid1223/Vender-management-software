import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

const sendEmail = async (to: string, subject: string, html: string) => {
  try {
    await resend.emails.send({
      from: 'onboarding@resend.dev',
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

export const sendVendorApprovalEmail = async (to: string, vendorName: string) => {
  const subject = 'Your vendor application has been approved';
  const html = `
    <h1>Congratulations, ${vendorName}!</h1>
    <p>Your vendor application has been approved. You will receive further instructions in a separate email.</p>
  `;
  return sendEmail(to, subject, html);
};

export const sendVendorRejectionEmail = async (to: string, vendorName: string) => {
  const subject = 'Update on your vendor application';
  const html = `
    <h1>Hello, ${vendorName}</h1>
    <p>Thank you for your interest. After careful consideration, we have decided not to move forward with your application at this time.</p>
    <p>We wish you the best in your future endeavors.</p>
  `;
  return sendEmail(to, subject, html);
};
