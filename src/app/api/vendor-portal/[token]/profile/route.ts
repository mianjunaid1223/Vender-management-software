import { NextRequest, NextResponse } from 'next/server';
import { getVendorInvitation, updateVendorProfile, logVendorAction } from '@/lib/vendor-portal-data';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const token = params.token;
    
    if (!token) {
      return NextResponse.json(
        { error: 'Token is required' },
        { status: 400 }
      );
    }

    // Verify token and get invitation
    const invitation = await getVendorInvitation(token);
    
    if (!invitation) {
      return NextResponse.json(
        { error: 'Invalid or expired invitation token' },
        { status: 401 }
      );
    }

    // Check if vendor has edit_profile permission
    const hasPermission = invitation.permissions.some(p => 
      p.resource === 'profile' && p.actions.includes('edit')
    );
    
    if (!hasPermission) {
      return NextResponse.json(
        { error: 'Insufficient permissions to edit profile' },
        { status: 403 }
      );
    }

    const body = await request.json();
    
    // Update vendor profile
    const result = await updateVendorProfile(
      invitation.vendorId,
      invitation.businessId,
      body
    );
    
    if (!result) {
      return NextResponse.json(
        { error: 'Failed to update profile' },
        { status: 500 }
      );
    }
    
    // Log the activity
    await logVendorAction(
      invitation.vendorId,
      invitation.businessId,
      'update_profile',
      'vendor',
      { updatedFields: Object.keys(body) }
    );
    
    return NextResponse.json({ 
      success: true,
      message: 'Profile updated successfully'
    });
    
  } catch (error) {
    console.error('Vendor profile update error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
