import { NextRequest, NextResponse } from 'next/server';
import { revokeVendorSession } from '@/lib/auth/vendor-auth';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const reason = searchParams.get('reason') || 'logout';
  const redirectUrl = searchParams.get('redirect') || '/vendor-portal';

  // Clear vendor session cookies
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get('vendor-session')?.value;

  if (sessionToken) {
    await revokeVendorSession(sessionToken, reason);
  }

  cookieStore.delete('vendor-session');
  cookieStore.delete('vendor-refresh');

  // Redirect based on reason
  const errorParam = reason === 'access_revoked' ? 'access_revoked' : 
                    reason === 'access_expired' ? 'access_expired' : 
                    'logged_out';

  return NextResponse.redirect(new URL(`${redirectUrl}?error=${errorParam}`, request.url));
}

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get('vendor-session')?.value;

    if (sessionToken) {
      await revokeVendorSession(sessionToken, 'logout');
    }

    // Clear cookies
    cookieStore.delete('vendor-session');
    cookieStore.delete('vendor-refresh');

    return NextResponse.json({ success: true, message: 'Logged out successfully' });

  } catch (error) {
    console.error('Vendor logout error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
