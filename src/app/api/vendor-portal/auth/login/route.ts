import { NextRequest, NextResponse } from 'next/server';
import { createVendorSession, getVendorSession } from '@/lib/auth/vendor-auth';
import { getDb } from '@/lib/data';
import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';
import { ObjectId } from 'mongodb';

// Simple in-memory rate limiting for login attempts
const loginAttempts = new Map<string, { count: number; lastAttempt: number }>();
const MAX_ATTEMPTS = 5;
const LOCKOUT_DURATION = 15 * 60 * 1000; // 15 minutes

function checkRateLimit(identifier: string): { allowed: boolean; remainingTime?: number } {
  const now = Date.now();
  const attempts = loginAttempts.get(identifier);
  
  if (!attempts) {
    return { allowed: true };
  }
  
  // Clean up old attempts
  if (now - attempts.lastAttempt > LOCKOUT_DURATION) {
    loginAttempts.delete(identifier);
    return { allowed: true };
  }
  
  if (attempts.count >= MAX_ATTEMPTS) {
    const remainingTime = LOCKOUT_DURATION - (now - attempts.lastAttempt);
    return { allowed: false, remainingTime };
  }
  
  return { allowed: true };
}

function recordLoginAttempt(identifier: string, success: boolean) {
  const now = Date.now();
  
  if (success) {
    loginAttempts.delete(identifier);
    return;
  }
  
  const attempts = loginAttempts.get(identifier) || { count: 0, lastAttempt: now };
  attempts.count += 1;
  attempts.lastAttempt = now;
  loginAttempts.set(identifier, attempts);
}

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

    // Get client IP for rate limiting
    const clientIP = request.headers.get('x-forwarded-for') || 
                    request.headers.get('x-real-ip') || 
                    'unknown';
    const rateIdentifier = `${email.toLowerCase()}:${clientIP}`;
    
    // Check rate limiting
    const rateCheck = checkRateLimit(rateIdentifier);
    if (!rateCheck.allowed) {
      const minutes = Math.ceil((rateCheck.remainingTime || 0) / 60000);
      return NextResponse.json(
        { error: `Too many login attempts. Please try again in ${minutes} minutes.` },
        { status: 429 }
      );
    }

    const db = await getDb();
    
    // Find vendor user by email
    const vendorUser = await db.collection('vendor_users').findOne({
      email: email.toLowerCase(),
      isActive: true
    });

    if (!vendorUser) {
      recordLoginAttempt(rateIdentifier, false);
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Verify password - ensure we only compare against hashed passwords
    const hash: string | undefined = vendorUser.passwordHash ?? vendorUser.password_hash;
    if (!hash) {
      recordLoginAttempt(rateIdentifier, false);
      // Do not reveal which part failed
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }
    
    const isPasswordValid = await bcrypt.compare(password, hash);
    if (!isPasswordValid) {
      recordLoginAttempt(rateIdentifier, false);
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

    // Get request info for audit (clientIP already defined above)
    const userAgent = request.headers.get('user-agent') || 'unknown';

    // Create session
    const { sessionToken, refreshToken } = await createVendorSession(
      vendorUser._id.toString(),
      vendorUser.vendorId,
      vendorUser.companyId,
      clientIP,
      userAgent
    );

    // Set cookies with consistent paths
    const cookieStore = await cookies();
    cookieStore.set('vendor-session', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 8 * 60 * 60, // 8 hours
      path: '/vendor-portal' // Restrict cookie to vendor portal paths
    });

    cookieStore.set('vendor-refresh', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: '/vendor-portal' // Keep path consistent so logout can delete it reliably
    });

    // Record successful login (clears rate limiting)
    recordLoginAttempt(rateIdentifier, true);

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
