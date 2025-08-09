import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

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

export async function vendorAuthMiddleware(request: NextRequest): Promise<{
  isAuthenticated: boolean;
  vendor?: { id: string; email: string; companyId: string };
  error?: string;
}> {
  try {
    // Get token from cookie or Authorization header
    const token = request.cookies.get('vendor-auth-token')?.value ||
                  request.headers.get('authorization')?.replace('Bearer ', '');

    if (!token) {
      return {
        isAuthenticated: false,
        error: 'No authentication token provided'
      };
    }

    // Verify JWT
    const { payload } = await jwtVerify(token, JWT_SECRET) as { payload: VendorTokenPayload };
    
    return {
      isAuthenticated: true,
      vendor: {
        id: payload.vendorId,
        email: payload.email,
        companyId: payload.companyId
      }
    };

  } catch (error) {
    return {
      isAuthenticated: false,
      error: 'Invalid or expired token'
    };
  }
}

// Helper function to create unauthorized response
export function createUnauthorizedResponse(message = 'Unauthorized access'): NextResponse {
  return NextResponse.json({
    error: message,
    code: 'UNAUTHORIZED'
  }, { status: 401 });
}
