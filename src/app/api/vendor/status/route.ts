import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/database/queries';
import { decrypt } from '@/lib/auth/encryption';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get('token');

  if (!token) {
    return NextResponse.json({ 
      valid: false, 
      error: 'No invitation token provided' 
    }, { status: 400 });
  }

  try {
    const db = await getDb();
    
    // First, check if this token exists in our database
    const inviteRecord = await db.collection('vendorInvites').findOne({
      token: token,
      status: 'active'
    });

    if (!inviteRecord) {
      return NextResponse.json({ 
        valid: false, 
        error: 'Invalid invitation link - not found in our records' 
      }, { status: 400 });
    }

    // Check if invite has expired
    if (new Date() > new Date(inviteRecord.expiresAt)) {
      // Mark as expired
      await db.collection('vendorInvites').updateOne(
        { _id: inviteRecord._id },
        { $set: { status: 'expired' } }
      );
      
      return NextResponse.json({ 
        valid: false, 
        error: 'Invitation link has expired' 
      }, { status: 400 });
    }

    // Check if invite has already been used
    if (inviteRecord.used) {
      return NextResponse.json({ 
        valid: false, 
        error: 'Invitation link has already been used' 
      }, { status: 400 });
    }

    // Decrypt token to validate structure
    try {
      const decryptedPayload = decrypt(token);
      const tokenData = JSON.parse(decryptedPayload);
      
      // Validate token data matches database record
      if (tokenData.vendorName !== inviteRecord.vendorName || 
          tokenData.companyId !== inviteRecord.companyId) {
        return NextResponse.json({ 
          valid: false, 
          error: 'Token validation failed - data mismatch' 
        }, { status: 400 });
      }
    } catch (decryptError) {
      return NextResponse.json({ 
        valid: false, 
        error: 'Invalid token format' 
      }, { status: 400 });
    }

    // Get company information
    const company = await db.collection('companies').findOne({ 
      companyId: inviteRecord.companyId 
    });
    
    if (!company) {
      return NextResponse.json({ 
        valid: false, 
        error: 'Company not found' 
      }, { status: 400 });
    }

    // Check if there's already an active application for this vendor and company
    const existingApplication = await db.collection('vendorApplications').findOne({ 
      $or: [
        { vendorName: inviteRecord.vendorName, targetCompanyId: inviteRecord.companyId },
        { email: inviteRecord.email, targetCompanyId: inviteRecord.companyId }
      ],
      status: { $in: ['pending', 'approved'] }
    });

    if (existingApplication) {
      // Return application status
      if (existingApplication.status === 'approved') {
        return NextResponse.json({
          valid: false,
          error: 'Vendor already approved for this company',
          redirect: '/vendor-portal/dashboard',
          applicationStatus: existingApplication.status,
          applicationId: existingApplication.applicationId
        });
      } else if (existingApplication.status === 'pending') {
        return NextResponse.json({
          valid: false,
          error: 'Application already submitted and pending review for this company',
          applicationStatus: existingApplication.status,
          applicationId: existingApplication.applicationId
        });
      }
    }

    // Check for any previous applications for context
    const previousApplications = await db.collection('vendorApplications').find({
      $or: [
        { vendorName: inviteRecord.vendorName, targetCompanyId: inviteRecord.companyId },
        { email: inviteRecord.email, targetCompanyId: inviteRecord.companyId }
      ]
    }).toArray();

    let previousApplicationInfo = null;
    if (previousApplications.length > 0) {
      const latestApp = previousApplications.sort((a, b) => 
        new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()
      )[0];
      
      if (latestApp.status === 'rejected') {
        previousApplicationInfo = {
          status: 'rejected',
          message: 'Previous application was rejected. You can submit a new application.',
          rejectedAt: latestApp.reviewedAt
        };
      }
    }

    // Return valid token with company information
    return NextResponse.json({
      valid: true,
      vendorName: inviteRecord.vendorName,
      companyId: inviteRecord.companyId,
      companyName: company.name,
      email: inviteRecord.email,
      inviteId: inviteRecord._id.toString(),
      previousApplication: previousApplicationInfo
    });

  } catch (error) {
    console.error('Error validating vendor token:', error);
    return NextResponse.json({ 
      valid: false, 
      error: 'Failed to validate invitation - please contact support' 
    }, { status: 500 });
  }
}
