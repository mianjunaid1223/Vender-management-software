import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { getDb } from '@/lib/data';
import { emailService } from '@/lib/email-service';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { createAuditLog } from '@/lib/audit';
import { ObjectId } from 'mongodb';

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || (session.role !== 'company_admin' && session.role !== 'admin')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { vendorId, vendorEmail, vendorName } = body;

    if (!vendorId || !vendorEmail || !vendorName) {
      return NextResponse.json(
        { error: 'Vendor ID, email, and name are required' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(vendorEmail)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Validate vendorId format
    if (typeof vendorId !== 'string' || !vendorId.trim()) {
      return NextResponse.json(
        { error: 'Invalid Vendor ID format' },
        { status: 400 }
      );
    }

    // Validate vendorName format
    if (typeof vendorName !== 'string' || !vendorName.trim()) {
      return NextResponse.json(
        { error: 'Invalid Vendor name format' },
        { status: 400 }
      );
    }

    const db = await getDb();

    // Check if vendor exists and belongs to the company
    const vendor = await db.collection('vendors').findOne({
      _id: new ObjectId(vendorId),
      companyId: new ObjectId(session.companyId)
    });
    
    if (!vendor) {
      return NextResponse.json(
        { error: 'Vendor not found or does not belong to this company' },
        { status: 404 }
      );
    }

    // Check for existing email
    const existingUser = await db.collection('vendor_users').findOne({
      email: vendorEmail
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'Email already exists in the system' },
        { status: 409 }
      );
    }
    const vendorUsersCollection = db.collection('vendor_users');

    // Generate a secure password setup token instead of plaintext password
    const setupToken = crypto.randomBytes(32).toString('hex'); // 256-bit token
    const hashedToken = await bcrypt.hash(setupToken, 12);
    const tokenExpiry = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes

    // Check if vendor user already exists
    const existingVendorUser = await vendorUsersCollection.findOne({ 
      vendorId,
      companyId: session.companyId 
    });

    if (existingVendorUser) {
      // Update existing user with password setup token
      await vendorUsersCollection.updateOne(
        { _id: existingVendorUser._id },
        { 
          $set: { 
            passwordResetToken: hashedToken,
            passwordResetExpiry: tokenExpiry,
            mustChangePassword: true,
            updatedAt: new Date().toISOString(),
            updatedBy: session.id
          } 
        }
      );
    } else {
      // Create new vendor user with password setup token
      await vendorUsersCollection.insertOne({
        vendorId,
        companyId: session.companyId,
        email: vendorEmail,
        name: vendorName,
        password: null, // No password set yet
        passwordResetToken: hashedToken,
        passwordResetExpiry: tokenExpiry,
        role: 'vendor_user',
        mustChangePassword: true,
        isActive: true,
        createdAt: new Date().toISOString(),
        createdBy: session.id
      });
    }

    // Send email with secure setup link instead of plaintext password
    const portalUrl = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/vendor-portal`;
    const setupUrl = `${portalUrl}/auth/set-password?token=${setupToken}&email=${encodeURIComponent(vendorEmail)}`;
    
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Vendor Portal Access</h2>
        
        <p>Hello ${vendorName},</p>
        
        <p>You have been granted access to our vendor portal. Click the link below to set up your account:</p>
        
        <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p><strong>Portal URL:</strong> <a href="${portalUrl}">${portalUrl}</a></p>
          <p><strong>Email:</strong> ${vendorEmail}</p>
          <p><strong>Setup Link:</strong> <a href="${setupUrl}" style="background: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; display: inline-block;">Set Up Your Password</a></p>
        </div>
        
        <p style="color: #d73027;"><strong>Important:</strong> This setup link expires in 30 minutes for security reasons. If it expires, please contact your administrator for a new link.</p>
        
        <p>Through the vendor portal, you can:</p>
        <ul>
          <li>View and manage invoices</li>
          <li>Update your profile information</li>
          <li>View contracts and agreements</li>
          <li>Upload required documents</li>
        </ul>
        
        <p>If you have any questions or need assistance, please contact our support team.</p>
        
        <p>Best regards,<br>Vendor Management Team</p>
      </div>
    `;

    await emailService.sendEmail({
      to: vendorEmail,
      subject: 'Vendor Portal Account Setup',
      html: emailHtml,
    });

    // Log the action
    await createAuditLog({
      userId: session.id,
      userRole: (session.role as any) || 'admin',
      vendorId: vendorId,
      companyId: session.companyId,
      action: 'create',
      resource: 'vendor_user',
      resourceId: vendorId,
      ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown',
      sessionId: 'web-session',
      metadata: {
        action_type: 'vendor_setup_link_sent',
        vendorEmail,
        vendorName,
        tokenExpiry: tokenExpiry.toISOString(),
        sentAt: new Date().toISOString()
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Account setup link sent successfully'
    });

  } catch (error) {
    console.error('Error sending vendor credentials:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
