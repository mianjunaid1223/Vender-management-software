'use server';

import { User, Company } from '@/lib/types';
import { getDb } from '@/lib/data';
import { ObjectId } from 'mongodb';
import { unstable_noStore as noStore } from 'next/cache';
import { getSession } from '@/lib/session';

/**
 * Get the current authenticated user from session
 */
export async function getCurrentUser(): Promise<User | null> {
    noStore();
    return await getSession();
}

/**
 * Get the current user's company ID
 * This is the critical function for multi-tenant data scoping
 */
export async function getCurrentUserCompanyId(): Promise<string | null> {
    const user = await getCurrentUser();
    return user?.companyId || null;
}

/**
 * Get the current user's company
 */
export async function getCurrentUserCompany(): Promise<Company | null> {
    const user = await getCurrentUser();
    if (!user?.companyId) return null;

    const db = await getDb();
    try {
        const company = await db.collection('companies').findOne({ 
            id: user.companyId 
        });
        
        if (!company) return null;
        
        const { _id, ...companyData } = company;
        return JSON.parse(JSON.stringify({ 
            ...companyData, 
            id: _id.toString() 
        }));
    } catch (error) {
        console.error('Error getting current user company:', error);
        return null;
    }
}

/**
 * Verify that a user has access to data for a specific company
 */
export async function verifyCompanyAccess(dataCompanyId: string): Promise<boolean> {
    const userCompanyId = await getCurrentUserCompanyId();
    if (!userCompanyId) return false;
    
    return userCompanyId === dataCompanyId;
}

/**
 * Ensure user can only access their own company's data
 * Throws an error if access is denied
 */
export async function enforceCompanyAccess(dataCompanyId: string): Promise<void> {
    const hasAccess = await verifyCompanyAccess(dataCompanyId);
    if (!hasAccess) {
        throw new Error('Access denied: You can only access data for your own company');
    }
}
