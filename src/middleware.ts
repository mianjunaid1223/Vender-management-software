
import { NextRequest, NextResponse } from 'next/server'
import { decrypt } from '@/lib/auth/session'
import { cookies } from 'next/headers'

const protectedRoutes = ['/dashboard']
const authRoutes = ['/login', '/signup']

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  console.log('Middleware running for:', pathname)
  
  // Check if this is a protected route
  const isProtectedRoute = protectedRoutes.some((route) =>
    pathname.startsWith(route)
  )
  const isAuthRoute = authRoutes.some((route) =>
    pathname.startsWith(route)
  )

  console.log('Is protected route:', isProtectedRoute)
  console.log('Is auth route:', isAuthRoute)

  // Get session from cookies
  const cookieStore = await cookies()
  const sessionCookie = cookieStore.get('session')?.value
  const session = await decrypt(sessionCookie)
  
  console.log('Session cookie exists:', !!sessionCookie)
  console.log('Session decrypted:', !!session)
  
  // Check token validity
  const hasValidToken = session?.userId && session.expiresAt && new Date(session.expiresAt) > new Date()
  
  console.log('Has valid token:', hasValidToken)

  // Handle protected routes
  if (isProtectedRoute && !hasValidToken) {
    console.log('Redirecting to login from protected route')
    // Clear invalid session cookie
    const response = NextResponse.redirect(new URL('/login', request.url))
    response.cookies.delete('session')
    return response
  }

  // Handle auth routes for authenticated users with valid tokens
  if (isAuthRoute && hasValidToken) {
    console.log('Redirecting to dashboard from auth route')
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }
  
  console.log('Allowing request to continue')
  return NextResponse.next()
}

export const config = {
  matcher: [
    '/dashboard',
    '/dashboard/(.*)',
    '/login',
    '/signup',
    '/(api|trpc)(.*)',
  ],
}
