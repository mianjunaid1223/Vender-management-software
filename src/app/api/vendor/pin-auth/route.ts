import { NextRequest, NextResponse } from 'next/server';
import { SignJWT, jwtVerify } from 'jose';
import { ObjectId } from 'mongodb';
import { getDb } from '@/lib/data';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'fallback-vendor-secret-key-change-in-production'
);

interface VendorTokenPayload {
  vendorId: string;
  email: string;
  companyId: string;
  iat: number;
  exp: number;
}

// Rate limiting storage (in production, use Redis or similar)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

function checkRateLimit(identifier: string, maxAttempts = 5, windowMs = 15 * 60 * 1000): boolean {
  const now = Date.now();
  const userLimit = rateLimitStore.get(identifier);
  
  if (!userLimit || now > userLimit.resetTime) {
    rateLimitStore.set(identifier, { count: 1, resetTime: now + windowMs });
    return true;
  }
  
  if (userLimit.count >= maxAttempts) {
    return false;
  }
  
  userLimit.count++;
  return true;
}

export async function POST(request: NextRequest) {
  console.log('🔐 PIN Authentication Request Received');
  
  try {
    const clientIp = request.headers.get('x-forwarded-for') || 
                     request.headers.get('x-real-ip') || 
                     'unknown';
    
    // Rate limiting
    if (!checkRateLimit(clientIp)) {
      return NextResponse.json({ 
        error: 'Too many login attempts. Please try again in 15 minutes.',
        code: 'RATE_LIMITED'
      }, { status: 429 });
    }

    const { pin, email } = await request.json();
    console.log('📝 Received PIN auth request:', { pin: pin ? `${pin.substring(0, 2)}****` : 'none', email: email || 'none' });

    if (!pin || typeof pin !== 'string') {
      return NextResponse.json({ 
        error: 'PIN is required and must be a valid string',
        code: 'INVALID_PIN_FORMAT'
      }, { status: 400 });
    }

    if (!email || typeof email !== 'string') {
      return NextResponse.json({ 
        error: 'Email is required and must be a valid string',
        code: 'INVALID_EMAIL_FORMAT'
      }, { status: 400 });
    }

    const normalizedPin = pin.trim().toUpperCase();
    
    if (normalizedPin.length !== 8) {
      return NextResponse.json({ 
        error: 'PIN must be exactly 8 characters',
        code: 'INVALID_PIN_LENGTH'
      }, { status: 400 });
    }

    const normalizedEmail = email.trim().toLowerCase();
    console.log('📧 Email normalization:', { original: email, normalized: normalizedEmail });

    const db = await getDb();
    console.log('Database connection successful');
    
    // Build query - PIN and email both required
    const query = { 
      vendorPin: normalizedPin, 
      status: { $regex: /^active$/i }, // Case-insensitive status check
      email: normalizedEmail
    };

    console.log('🔍 Looking for vendor with query:', { 
      vendorPin: `${normalizedPin.substring(0, 2)}****`, 
      status: 'active (case-insensitive)', 
      email: normalizedEmail 
    });

    const vendor = await db.collection('vendors').findOne(query);
    console.log('🔍 Query result:', vendor ? 'Found vendor' : 'No vendor found');
    
    // If not found, let's debug by checking what vendors exist
    if (!vendor) {
      console.log('🔍 Debugging: Checking if vendor exists with this email...');
      const vendorByEmail = await db.collection('vendors').findOne({ email: normalizedEmail });
      
      if (vendorByEmail) {
        console.log('✅ Vendor exists with email:', {
          name: vendorByEmail.name,
          status: vendorByEmail.status,
          hasPin: !!vendorByEmail.vendorPin,
          actualPin: vendorByEmail.vendorPin ? `${vendorByEmail.vendorPin.substring(0, 2)}****` : 'NONE'
        });
        
        // Check if PIN matches but status is different
        const vendorByPin = await db.collection('vendors').findOne({ vendorPin: normalizedPin });
        if (vendorByPin) {
          console.log('✅ Vendor exists with PIN but different email/status:', {
            email: vendorByPin.email,
            status: vendorByPin.status
          });
        }
      } else {
        console.log('❌ No vendor found with email:', normalizedEmail);
      }
    }

    if (!vendor) {
      // Log failed attempt for security monitoring
      console.warn('Failed vendor PIN authentication attempt:', {
        pin: pin,
        email: email || 'none',
        ip: clientIp,
        timestamp: new Date().toISOString()
      });

      return NextResponse.json({ 
        error: 'Invalid credentials. Please check your PIN and email combination.',
        code: 'AUTHENTICATION_FAILED'
      }, { status: 401 });
    }

    // Check if vendor's company still exists
    let company;
    try {
      if (typeof vendor.companyId === 'string' && ObjectId.isValid(vendor.companyId)) {
        company = await db.collection('companies').findOne({ _id: new ObjectId(vendor.companyId) });
      } else {
        company = await db.collection('companies').findOne({ _id: vendor.companyId });
      }
    } catch (error) {
      console.error('Company lookup error:', error);
      company = null;
    }
    
    console.log('🏢 Company lookup result:', company ? 'Found company' : 'No company found');
    console.log('🏢 Company query:', { vendorCompanyId: vendor.companyId, queryType: typeof vendor.companyId });

    if (!company) {
      console.error('Company not found for vendor:', vendor._id.toString());
      return NextResponse.json({ 
        error: 'Vendor company not found. Please contact support.',
        code: 'COMPANY_NOT_FOUND'
      }, { status: 404 });
    }

    // Generate JWT token
    const tokenPayload: Omit<VendorTokenPayload, 'iat' | 'exp'> = {
      vendorId: vendor._id.toString(),
      email: vendor.email,
      companyId: vendor.companyId.toString()
    };

    const token = await new SignJWT(tokenPayload)
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('8h') // 8-hour session
      .sign(JWT_SECRET);

    // Update last login timestamp
    await db.collection('vendors').updateOne(
      { _id: vendor._id },
      { 
        $set: { 
          lastLogin: new Date(),
          lastLoginIp: clientIp
        }
      }
    );

    // Log successful authentication
    console.info('Successful vendor authentication:', {
      vendorId: vendor._id.toString(),
      email: vendor.email,
      ip: clientIp,
      timestamp: new Date().toISOString()
    });

    // Prepare response
    const response = NextResponse.json({
      success: true,
      vendor: {
        id: vendor._id.toString(),
        name: vendor.name,
        email: vendor.email,
        contactPerson: vendor.contactPerson,
        phone: vendor.phone,
        service: vendor.service,
        status: vendor.status,
        companyId: vendor.companyId.toString(),
        applicationId: vendor.applicationId,
        company: {
          name: company.name,
          id: company._id.toString()
        }
      },
      token,
      expiresAt: new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString()
    });

    // Set HTTP-only cookie for enhanced security
    response.cookies.set('vendor-auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 8 * 60 * 60, // 8 hours in seconds
      path: '/vendor-portal'
    });

    return response;

  } catch (error) {
    console.error('Error in vendor PIN authentication:', error);
    return NextResponse.json({ 
      error: 'Authentication service temporarily unavailable',
      code: 'INTERNAL_ERROR'
    }, { status: 500 });
  }
}

// GET - Verify existing JWT token
export async function GET(request: NextRequest) {
  console.log('🔍 Token verification request received');
  
  try {
    const token = request.cookies.get('vendor-auth-token')?.value ||
                  request.headers.get('authorization')?.replace('Bearer ', '');

    console.log('🔍 Token found:', token ? 'YES' : 'NO');

    if (!token) {
      console.log('❌ No token provided');
      return NextResponse.json({ 
        error: 'No authentication token provided',
        code: 'NO_TOKEN'
      }, { status: 401 });
    }

    // Verify JWT
    const { payload } = await jwtVerify(token, JWT_SECRET) as { payload: VendorTokenPayload };
    console.log('✅ Token verified, vendor ID:', payload.vendorId);
    
    const db = await getDb();
    
    // Verify vendor still exists and is active
    const vendor = await db.collection('vendors').findOne({ 
      _id: new ObjectId(payload.vendorId),
      status: { $regex: /^active$/i } // Case-insensitive status check
    });

    console.log('🔍 Vendor lookup for token verification:', vendor ? 'Found' : 'Not found');

    if (!vendor) {
      console.log('❌ Vendor not found or inactive');
      return NextResponse.json({ 
        error: 'Vendor account no longer active',
        code: 'VENDOR_INACTIVE'
      }, { status: 401 });
    }

    console.log('✅ Token verification successful');
    return NextResponse.json({
      valid: true,
      vendor: {
        id: vendor._id.toString(),
        name: vendor.name,
        email: vendor.email,
        companyId: vendor.companyId.toString()
      },
      expiresAt: new Date(payload.exp * 1000).toISOString()
    });

  } catch (error) {
    console.warn('❌ Token verification failed:', error instanceof Error ? error.message : 'Unknown error');
    return NextResponse.json({ 
      error: 'Invalid or expired token',
      code: 'INVALID_TOKEN'
    }, { status: 401 });
  }
}

// DELETE - Logout (invalidate token)
export async function DELETE(request: NextRequest) {
  try {
    const response = NextResponse.json({
      success: true,
      message: 'Successfully logged out'
    });

    // Clear the HTTP-only cookie
    response.cookies.delete('vendor-auth-token');

    return response;

  } catch (error) {
    console.error('Error during vendor logout:', error);
    return NextResponse.json({ 
      error: 'Logout failed',
      code: 'LOGOUT_ERROR'
    }, { status: 500 });
  }
}
