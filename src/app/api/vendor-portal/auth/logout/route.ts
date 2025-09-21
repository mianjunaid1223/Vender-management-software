import { NextRequest, NextResponse } from 'next/server';
import { revokeVendorSession } from '@/lib/auth/vendor-auth';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const rawReason = searchParams.get('reason') || 'logout';
    const reason = ['logout', 'access_revoked', 'access_expired'].includes(rawReason)
      ? rawReason
      : 'logout';

    // Only allow same-origin, relative redirects
    const redirectParam = searchParams.get('redirect');
    const redirectPath = redirectParam && redirectParam.startsWith('/')
      ? redirectParam
      : '/vendor-portal';

    const cookieStore = await cookies();
    const sessionToken = cookieStore.get('vendor-session')?.value;
    if (sessionToken) {
      await revokeVendorSession(sessionToken, reason);
    }

    const errorParam =
      reason === 'access_revoked' ? 'access_revoked' :
      reason === 'access_expired' ? 'access_expired' :
      'logged_out';

    const location = new URL(redirectPath, request.nextUrl.origin);
    location.searchParams.set('error', errorParam);

    const res = NextResponse.redirect(location);
    // Clear cookies with matching attributes
    res.cookies.set('vendor-session', '', {
      httpOnly: true,
      sameSite: 'lax',
      path: '/vendor-portal',
      maxAge: 0
    });
    res.cookies.set('vendor-refresh', '', {
      httpOnly: true,
      sameSite: 'lax',
      path: '/vendor-portal',
      maxAge: 0
    });
    return res;
  } catch {
    const res = NextResponse.redirect(
      new URL('/vendor-portal?error=logged_out', request.nextUrl.origin)
    );
    res.cookies.set('vendor-session', '', {
      httpOnly: true,
      sameSite: 'lax',
      path: '/vendor-portal',
      maxAge: 0
    });
    res.cookies.set('vendor-refresh', '', {
      httpOnly: true,
      sameSite: 'lax',
      path: '/vendor-portal',
      maxAge: 0
    });
    return res;
  }
}

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get('vendor-session')?.value;

    if (sessionToken) {
      await revokeVendorSession(sessionToken, 'logout');
    }

    const res = NextResponse.json({ success: true, message: 'Logged out successfully' });
    res.cookies.set('vendor-session', '', {
      httpOnly: true,
      sameSite: 'lax',
      path: '/vendor-portal',
      maxAge: 0
    });
    res.cookies.set('vendor-refresh', '', {
      httpOnly: true,
      sameSite: 'lax',
      path: '/vendor-portal',
      maxAge: 0
    });
    return res;

  } catch (error) {
    console.error('Vendor logout error:', error);
    const res = NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
    // Still clear cookies even on error
    res.cookies.set('vendor-session', '', {
      httpOnly: true,
      sameSite: 'lax',
      path: '/vendor-portal',
      maxAge: 0
    });
    res.cookies.set('vendor-refresh', '', {
      httpOnly: true,
      sameSite: 'lax',
      path: '/vendor-portal',
      maxAge: 0
    });
    return res;
  }
}
