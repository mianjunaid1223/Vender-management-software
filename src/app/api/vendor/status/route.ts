import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/data';
import { decrypt } from '@/lib/encryption';

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

    // Check if there's already an application for this vendor and company
    const existingApplication = await db.collection('vendorApplications').findOne({ 
      vendorName: inviteRecord.vendorName,
      targetCompanyId: inviteRecord.companyId 
    });

    if (existingApplication) {
      // Return application status
      if (existingApplication.status === 'approved') {
        return NextResponse.json({
          valid: false,
          error: 'Vendor already approved',
          redirect: '/vendor-portal/dashboard',
          applicationStatus: existingApplication.status,
          applicationId: existingApplication.applicationId
        });
      } else if (existingApplication.status === 'rejected') {
        return NextResponse.json({
          valid: false,
          error: 'Vendor application was rejected',
          applicationStatus: existingApplication.status,
          applicationId: existingApplication.applicationId
        });
      } else {
        return NextResponse.json({
          valid: false,
          error: 'Application already submitted and pending review',
          applicationStatus: existingApplication.status,
          applicationId: existingApplication.applicationId
        });
      }
    }

    // Return valid token with company information
    return NextResponse.json({
      valid: true,
      vendorName: inviteRecord.vendorName,
      companyId: inviteRecord.companyId,
      companyName: company.name,
      email: inviteRecord.email,
      inviteId: inviteRecord._id.toString()
    });

  } catch (error) {
    console.error('Error validating vendor token:', error);
    return NextResponse.json({ 
      valid: false, 
      error: 'Failed to validate invitation - please contact support' 
    }, { status: 500 });
  }
}
