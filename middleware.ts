import { NextRequest, NextResponse } from 'next/server'
import { verifySession, updateSession } from '@/lib/session'

// Define protected and auth routes
const protectedRoutes = ['/dashboard']
const authRoutes = ['/login', '/signup']

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const session = await verifySession()

  // Check if the current route is protected
  const isProtectedRoute = protectedRoutes.some((route) =>
    pathname.startsWith(route)
  )

  // Check if the current route is an auth route
  const isAuthRoute = authRoutes.some((route) =>
    pathname.startsWith(route)
  )

  // Redirect to login if accessing protected route without session
  if (isProtectedRoute && !session?.isAuth) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Redirect to dashboard if accessing auth routes with valid session
  if (isAuthRoute && session?.isAuth) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  // Update session if user is authenticated
  if (session?.isAuth) {
    await updateSession()
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    // Skip all internal paths (_next, api)
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
}
