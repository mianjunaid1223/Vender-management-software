import { NextRequest, NextResponse } from 'next/server';
import { getVendorSession } from '@/lib/auth/vendor-auth';

export async function GET(request: NextRequest) {
  try {
    const vendorSession = await getVendorSession();
    
    if (!vendorSession) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    return NextResponse.json({
      success: true,
      user: {
        id: vendorSession.userId,
        name: vendorSession.name,
        email: vendorSession.email,
        vendorId: vendorSession.vendorId,
        companyId: vendorSession.companyId,
        role: vendorSession.role || 'vendor_user'
      }
    });

  } catch (error) {
    console.error('Vendor auth check error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
