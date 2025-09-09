import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { getDb } from '@/lib/data';
import { emailService } from '@/lib/email-service';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { createAuditLog } from '@/lib/audit';

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

    const db = await getDb();
    const vendorUsersCollection = db.collection('vendor_users');

    // Generate a temporary password
    const tempPassword = crypto.randomBytes(8).toString('hex');
    const hashedPassword = await bcrypt.hash(tempPassword, 12);

    // Check if vendor user already exists
    const existingVendorUser = await vendorUsersCollection.findOne({ 
      vendorId,
      companyId: session.companyId 
    });

    if (existingVendorUser) {
      // Update existing user with new password
      await vendorUsersCollection.updateOne(
        { _id: existingVendorUser._id },
        { 
          $set: { 
            password: hashedPassword,
            mustChangePassword: true,
            updatedAt: new Date().toISOString(),
            updatedBy: session.id
          } 
        }
      );
    } else {
      // Create new vendor user
      await vendorUsersCollection.insertOne({
        vendorId,
        companyId: session.companyId,
        email: vendorEmail,
        name: vendorName,
        password: hashedPassword,
        role: 'vendor_user',
        mustChangePassword: true,
        isActive: true,
        createdAt: new Date().toISOString(),
        createdBy: session.id
      });
    }

    // Send email with credentials
    const portalUrl = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/vendor-portal`;
    
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Vendor Portal Access</h2>
        
        <p>Hello ${vendorName},</p>
        
        <p>You have been granted access to our vendor portal. Use the following credentials to log in:</p>
        
        <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p><strong>Portal URL:</strong> <a href="${portalUrl}">${portalUrl}</a></p>
          <p><strong>Email:</strong> ${vendorEmail}</p>
          <p><strong>Temporary Password:</strong> <code style="background: #fff; padding: 4px 8px; border-radius: 4px;">${tempPassword}</code></p>
        </div>
        
        <p style="color: #d73027;"><strong>Important:</strong> You will be required to change this password upon your first login.</p>
        
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
      subject: 'Vendor Portal Access Credentials',
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
        action_type: 'vendor_credentials_sent',
        vendorEmail,
        vendorName,
        sentAt: new Date().toISOString()
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Login credentials sent successfully'
    });

  } catch (error) {
    console.error('Error sending vendor credentials:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
