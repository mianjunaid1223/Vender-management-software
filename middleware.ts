import { NextRequest, NextResponse } from 'next/server';
import { updateSession } from '@/lib/auth';

export async function middleware(request: NextRequest) {
  // Update session expiry for authenticated users
  if (request.cookies.has('session')) {
    return await updateSession(request);
  }

  // Redirect unauthenticated users trying to access protected routes
  if (request.nextUrl.pathname.startsWith('/dashboard')) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
