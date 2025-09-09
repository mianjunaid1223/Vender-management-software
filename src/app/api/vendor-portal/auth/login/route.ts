import { NextRequest, NextResponse } from 'next/server';
import { createVendorSession, getVendorSession } from '@/lib/auth/vendor-auth';
import { getDb } from '@/lib/data';
import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';
import { ObjectId } from 'mongodb';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    const db = await getDb();
    
    // Find vendor user by email
    const vendorUser = await db.collection('vendor_users').findOne({
      email: email.toLowerCase(),
      isActive: true
    });

    if (!vendorUser) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, vendorUser.password || vendorUser.passwordHash);
    if (!isPasswordValid) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Check if vendor portal access is enabled - check the company's vendorPortalAccess array
    const company = await db.collection('companies').findOne({
      _id: new ObjectId(vendorUser.companyId)
    });

    if (!company) {
      return NextResponse.json(
        { error: 'Company not found. Please contact your administrator.' },
        { status: 403 }
      );
    }

    // Find the vendor's portal access in the array
    const portalAccess = company.vendorPortalAccess?.find(
      (access: any) => access.vendorId === vendorUser.vendorId
    );

    if (!portalAccess || !portalAccess.enabled) {
      return NextResponse.json(
        { error: 'Portal access is not enabled for your account. Please contact your administrator.' },
        { status: 403 }
      );
    }

    // Check if access has expired
    if (portalAccess.expiresAt && new Date() > new Date(portalAccess.expiresAt)) {
      return NextResponse.json(
        { error: 'Your portal access has expired. Please contact your administrator to renew access.' },
        { status: 403 }
      );
    }

    // Get request info for audit
    const clientIP = request.headers.get('x-forwarded-for') || 
                    request.headers.get('x-real-ip') || 
                    'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';

    // Create session
    const { sessionToken, refreshToken } = await createVendorSession(
      vendorUser._id.toString(),
      vendorUser.vendorId,
      vendorUser.companyId,
      clientIP,
      userAgent
    );

    // Set cookies
    const cookieStore = await cookies();
    cookieStore.set('vendor-session', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 8 * 60 * 60, // 8 hours
      path: '/' // Make cookie available to all paths
    });

    cookieStore.set('vendor-refresh', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: '/vendor-portal'
    });

    return NextResponse.json({
      success: true,
      user: {
        id: vendorUser._id.toString(),
        name: vendorUser.name,
        email: vendorUser.email,
        role: vendorUser.role,
        vendorId: vendorUser.vendorId,
        companyId: vendorUser.companyId
      }
    });

  } catch (error) {
    console.error('Vendor login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
