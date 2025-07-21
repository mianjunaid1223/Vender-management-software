import { NextRequest, NextResponse } from 'next/server';
import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';

const secretKey = process.env.JWT_SECRET || 'your-secret-key-should-be-in-env';
const key = new TextEncoder().encode(secretKey);

export interface SessionPayload {
  userId: string;
  email: string;
  name: string;
  businessId?: string;
  expiresAt: Date;
}

export async function encrypt(payload: SessionPayload) {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('24h')
    .sign(key);
}

export async function decrypt(input: string): Promise<SessionPayload> {
  const { payload } = await jwtVerify(input, key, {
    algorithms: ['HS256'],
  });
  return payload as SessionPayload;
}

export async function createSession(userId: string, email: string, name: string, businessId?: string) {
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
  const session = await encrypt({ userId, email, name, businessId, expiresAt });

  const cookieStore = await cookies();
  cookieStore.set('session', session, {
    expires: expiresAt,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
  });
}

export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const session = cookieStore.get('session')?.value;
  
  if (!session) return null;
  
  try {
    const payload = await decrypt(session);
    return payload;
  } catch (error) {
    console.log('Invalid session');
    return null;
  }
}

export async function deleteSession() {
  const cookieStore = await cookies();
  cookieStore.set('session', '', { expires: new Date(0) });
}

export async function updateSession(request: NextRequest) {
  const session = request.cookies.get('session')?.value;
  if (!session) return;

  try {
    const parsed = await decrypt(session);
    parsed.expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    const res = NextResponse.next();
    res.cookies.set({
      name: 'session',
      value: await encrypt(parsed),
      httpOnly: true,
      expires: parsed.expiresAt,
    });
    return res;
  } catch (error) {
    return NextResponse.next();
  }
}

/**
 * Get the current user's session or throw error if not authenticated
 */
export async function requireAuth(): Promise<SessionPayload> {
  const session = await getSession();
  if (!session) {
    throw new Error('Authentication required');
  }
  return session;
}
