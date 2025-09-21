
import { NextRequest, NextResponse } from 'next/server'
import { jwtVerify } from 'jose'

// Environment validation - fail fast if secrets are missing
const AUTH_SECRET = process.env.AUTH_SECRET || process.env.SESSION_SECRET;
const VENDOR_AUTH_SECRET = process.env.VENDOR_AUTH_SECRET || process.env.AUTH_SECRET;

if (!AUTH_SECRET) {
  throw new Error('AUTH_SECRET or SESSION_SECRET is required in environment variables');
}

if (!VENDOR_AUTH_SECRET) {
  throw new Error('VENDOR_AUTH_SECRET or AUTH_SECRET is required in environment variables');
}

const protectedRoutes = ['/dashboard']
const authRoutes = ['/login', '/signup']
const vendorPortalProtectedRoutes = ['/vendor-portal/dashboard']
const vendorAuthRoutes = ['/vendor-portal', '/vendor-portal/login', '/vendor-portal/signup']

// Edge-compatible session verification (JWT only, no database)
async function verifySessionToken(token?: string): Promise<boolean> {
  if (!token) return false;
  
  try {
    const secret = new TextEncoder().encode(AUTH_SECRET);
    const { payload } = await jwtVerify(token, secret);
    return !!payload.userId && new Date() < new Date(payload.expiresAt as string);
  } catch {
    return false;
  }
}

// Edge-compatible vendor session verification (JWT only, no database)
async function verifyVendorSessionToken(token?: string): Promise<boolean> {
  if (!token) return false;
  
  try {
    const secret = new TextEncoder().encode(VENDOR_AUTH_SECRET);
    const { payload } = await jwtVerify(token, secret);
    return !!payload.vendorId; // Ensure it's a vendor token
  } catch {
    return false;
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // Check if this is a vendor portal route
  const isVendorPortalProtectedRoute = vendorPortalProtectedRoutes.some((route) =>
    pathname.startsWith(route)
  )
  const isVendorAuthRoute = vendorAuthRoutes.some((route) =>
    pathname.startsWith(route)
  )

  // Handle vendor portal routes
  if (isVendorPortalProtectedRoute || isVendorAuthRoute) {
    const vendorSessionToken = request.cookies.get('vendor-session')?.value
    const isVendorAuth = await verifyVendorSessionToken(vendorSessionToken)

    // Protect vendor portal routes (except auth routes)
    if (isVendorPortalProtectedRoute && !isVendorAuth) {
      return NextResponse.redirect(new URL('/vendor-portal', request.url))
    }

    // Redirect authenticated vendors away from auth routes (except the main login page)
    if (isVendorAuthRoute && isVendorAuth && pathname !== '/vendor-portal') {
      return NextResponse.redirect(new URL('/vendor-portal/dashboard', request.url))
    }

    // Add security headers for vendor portal
    const response = NextResponse.next()
    response.headers.set('X-Frame-Options', 'DENY')
    response.headers.set('X-Content-Type-Options', 'nosniff')
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
    
    return response
  }

  // Handle regular company portal routes
  const sessionToken = request.cookies.get('session')?.value
  const isAuth = await verifySessionToken(sessionToken)

  const isProtectedRoute = protectedRoutes.some((route) =>
    pathname.startsWith(route)
  )
  const isAuthRoute = authRoutes.some((route) =>
    pathname.startsWith(route)
  )

  if (isProtectedRoute && !isAuth) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  if (isAuthRoute && isAuth) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }
  
  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
}
