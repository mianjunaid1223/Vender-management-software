import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/core/auth/auth';
import { getDb } from '@/shared/lib/data';
import { emailService } from '@/core/services/email';
import { emailTemplates } from '@/core/services/email-templates';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { createAuditLog } from '@/core/services/audit';
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

    // Check for existing email within the same vendor and company scope
    const existingUser = await db.collection('vendor_users').findOne({
      email: vendorEmail,
      vendorId,
      companyId: session.companyId
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
    let baseUrl: string;
    if (process.env.NEXTAUTH_URL) {
      baseUrl = process.env.NEXTAUTH_URL;
    } else {
      // Derive from request origin as fallback
      const url = new URL(request.url);
      baseUrl = `${url.protocol}//${url.host}`;
    }
    const portalUrl = `${process.env.NEXT_PUBLIC_BASE_URL || baseUrl}/vendor-portal/login`;
    const setupUrl = `${process.env.NEXT_PUBLIC_BASE_URL || baseUrl}/vendor-portal/setup?token=${setupToken}`;

    // Get company info for email
    const company = await db.collection('companies').findOne({
      _id: new ObjectId(session.companyId)
    });

    // Generate temporary password for display (will be set during setup)
    const tempPassword = 'Click setup link to create password';

    // Use centralized email template
    const emailContent = emailTemplates.vendorPortalAccess({
      vendorName,
      companyName: company?.name || 'Your Business Partner',
      email: vendorEmail,
      temporaryPassword: tempPassword,
      loginUrl: setupUrl, // Send setup URL instead of login URL
    });

    // Send email using centralized service
    const emailResult = await emailService.sendEmail({
      to: vendorEmail,
      subject: emailContent.subject,
      html: emailContent.html,
    });

    // Check if email failed
    if (!emailResult.success) {
      console.error('Failed to send vendor credentials email:', emailResult.error);
      // Continue anyway - credentials are saved in database
    }    // Log the action
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
