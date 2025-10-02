'use server'
 
import 'server-only'
import { redirect } from 'next/navigation'
import type { User } from '@/shared/types/types'
import { getDb } from '@/shared/lib/data'
import { ObjectId } from 'mongodb'
import { verifySession } from '@/core/database/session'
 
// Full session verification with database lookup
export async function getSession(): Promise<User | null> {
  const { isAuth, userId } = await verifySession()
  if (!isAuth || !userId) return null

  try {
    const db = await getDb()
    const usersCollection = db.collection('users')
    
    const user = await usersCollection.findOne({ 
      _id: new ObjectId(userId) 
    })

    if (!user) {
      // User no longer exists, but we can't clear cookies from server components
      // This will be handled by requireAuth redirect
      return null
    }
    
    const { _id, password, ...userWithoutSensitiveData } = user;
    return JSON.parse(JSON.stringify({
      ...userWithoutSensitiveData,
      id: _id.toString(),
    }));

  } catch (error) {
    console.error('Error fetching session user:', error);
    return null
  }
}

export async function requireAuth(redirectTo = '/login'): Promise<User> {
  const session = await getSession()
  if (!session) {
    redirect(redirectTo)
  }
  return session;
}
