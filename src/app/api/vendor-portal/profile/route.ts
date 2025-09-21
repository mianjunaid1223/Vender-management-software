import { NextRequest, NextResponse } from 'next/server';
import { getVendorProfile, updateVendorProfile, getMyProfile, updateMyProfile } from '@/lib/data/vendor-data';
import { getVendorSession } from '@/lib/auth/vendor-auth';

export async function GET(request: NextRequest) {
  try {
    const session = await getVendorSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Use the new session-derived function for maximum security
    const profile = await getMyProfile();
    
    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    return NextResponse.json(profile);
  } catch (error) {
    console.error('Error fetching vendor profile:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getVendorSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    
    // Use the new session-derived function for maximum security
    await updateMyProfile(body);

    return NextResponse.json({ 
      success: true, 
      message: 'Profile updated successfully. Changes are pending company approval.' 
    });
  } catch (error) {
    console.error('Error updating vendor profile:', error);
    
    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}