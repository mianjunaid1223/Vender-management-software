import { jwtVerify, SignJWT } from 'jose';

// Edge-compatible JWT verification for vendor sessions
export async function verifyVendorSessionJWT(token: string): Promise<{ isValid: boolean; payload?: any }> {
  try {
    const secret = new TextEncoder().encode(process.env.VENDOR_AUTH_SECRET || process.env.AUTH_SECRET);
    const { payload } = await jwtVerify(token, secret);
    return { isValid: true, payload };
  } catch {
    return { isValid: false };
  }
}

// Edge-compatible JWT creation for vendor sessions
export async function createVendorSessionJWT(payload: Record<string, any>): Promise<string> {
  const secret = new TextEncoder().encode(process.env.VENDOR_AUTH_SECRET || process.env.AUTH_SECRET);
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('8h')
    .setIssuedAt()
    .sign(secret);
}
