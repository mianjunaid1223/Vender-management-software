import 'server-only'
import { SignJWT, jwtVerify } from 'jose'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import type { User } from '@/lib/types'
import { getDb } from '@/lib/data'
import { ObjectId } from 'mongodb'

const secretKey = process.env.SESSION_SECRET
if (!secretKey) {
  throw new Error('SESSION_SECRET is not set in the environment variables')
}
const encodedKey = new TextEncoder().encode(secretKey)

export type SessionPayload = {
  userId: string
  expiresAt: Date
}

export async function encrypt(payload: SessionPayload) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(encodedKey)
}

export async function decrypt(session: string | undefined = ''): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(session, encodedKey, {
      algorithms: ['HS256'],
    })
    return payload as SessionPayload
  } catch (error) {
    console.log('Failed to verify session:', error)
    return null
  }
}

export async function createSession(userId: string) {
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
  const session = await encrypt({ userId, expiresAt })

  cookies().set('session', session, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    expires: expiresAt,
    sameSite: 'lax',
    path: '/',
  })
}

export async function verifySession(): Promise<{ isAuth: boolean; userId: string | null }> {
  const cookie = cookies().get('session')?.value
  const session = await decrypt(cookie)

  if (!session?.userId) {
    return { isAuth: false, userId: null }
  }

  return { isAuth: true, userId: session.userId }
}

export async function getSession(): Promise<User | null> {
  const session = await verifySession()
  if (!session.isAuth || !session.userId) return null

  try {
    const db = await getDb()
    const usersCollection = db.collection('users')
    
    const user = await usersCollection.findOne({ 
      _id: new ObjectId(session.userId) 
    })

    if (!user) {
      await deleteSession()
      return null
    }
    
    // Make sure to return a plain object that can be serialized
    return JSON.parse(JSON.stringify({
      ...user,
      id: user._id.toString(),
    }));

  } catch (error) {
    console.error('Error fetching session user:', error)
    await deleteSession();
    return null
  }
}

export async function deleteSession() {
  cookies().delete('session')
}

export async function updateSession() {
  const sessionCookie = cookies().get('session')?.value
  const payload = await decrypt(sessionCookie)

  if (!sessionCookie || !payload?.userId) {
    return
  }

  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
  cookies().set('session', await encrypt({ userId: payload.userId, expiresAt }), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    expires: expiresAt,
    sameSite: 'lax',
    path: '/',
  })
}

export async function requireAuth(redirectTo = '/login') {
  const session = await verifySession()
  if (!session.isAuth) {
    redirect(redirectTo)
  }
  return session.userId
}