import { NextRequest, NextResponse } from 'next/server'
import { verifySession, updateSession } from '@/lib/session'

const protectedRoutes = ['/dashboard']
const authRoutes = ['/login', '/signup']

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const { isAuth } = await verifySession()

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
  
  const response = NextResponse.next()

  if (isAuth) {
    await updateSession()
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
}