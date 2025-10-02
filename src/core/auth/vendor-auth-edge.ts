import { jwtVerify, SignJWT } from 'jose';

// Edge-compatible JWT verification for vendor sessions
export async function verifyVendorSessionJWT(token: string): Promise<{ isValid: boolean; payload?: any }> {
  try {
    const raw = process.env.VENDOR_AUTH_SECRET ?? process.env.AUTH_SECRET;
    if (!raw) return { isValid: false };
    const secret = new TextEncoder().encode(raw);
    const { payload } = await jwtVerify(token, secret, { algorithms: ['HS256'] });
    return { isValid: true, payload };
  } catch {
    return { isValid: false };
  }
}

// Edge-compatible JWT creation for vendor sessions
export async function createVendorSessionJWT(payload: Record<string, any>): Promise<string> {
  const raw = process.env.VENDOR_AUTH_SECRET ?? process.env.AUTH_SECRET;
  if (!raw) {
    throw new Error('JWT secret not configured');
  }
  const secret = new TextEncoder().encode(raw);
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('8h')
    .setIssuedAt()
    .sign(secret);
}
