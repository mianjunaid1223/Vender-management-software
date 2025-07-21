import { NextRequest, NextResponse } from 'next/server';
import { getVendorPortalData, getVendorInvitation } from '@/lib/vendor-portal-data';

export async function GET(
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

    // First, get the invitation to verify token and extract vendor/business info
    const invitation = await getVendorInvitation(token);
    
    if (!invitation) {
      return NextResponse.json(
        { error: 'Invalid or expired invitation token' },
        { status: 401 }
      );
    }
    
    const data = await getVendorPortalData(invitation.vendorId, invitation.businessId);
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('Vendor portal data fetch error:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('Invalid') || error.message.includes('expired')) {
        return NextResponse.json(
          { error: 'Invalid or expired invitation token' },
          { status: 401 }
        );
      }
      
      if (error.message.includes('not found')) {
        return NextResponse.json(
          { error: 'Vendor not found' },
          { status: 404 }
        );
      }
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
