import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';

/**
 * Vendor Portal Authentication & Access Control
 * Manages vendor-specific authentication and permissions
 */

export interface VendorSession {
  vendorId: string;
  businessId: string; // The business they work with
  email: string;
  name: string;
  accessLevel: 'read' | 'write' | 'admin';
  permissions: VendorPermission[];
  expiresAt: Date;
}

export interface VendorPermission {
  resource: 'contracts' | 'invoices' | 'profile' | 'communications';
  actions: ('view' | 'edit' | 'create' | 'delete')[];
  restrictions?: {
    ownDataOnly?: boolean;
    approvalRequired?: boolean;
    timeWindow?: { start: Date; end: Date };
  };
}

export interface VendorInvitation {
  id: string;
  vendorId: string;
  businessId: string;
  invitedBy: string;
  email: string;
  permissions: VendorPermission[];
  expiresAt: string;
  status: 'pending' | 'accepted' | 'expired' | 'revoked';
  token: string;
  createdAt: string;
}

/**
 * Check if vendor has permission for specific action
 */
export function hasVendorPermission(
  session: VendorSession, 
  resource: VendorPermission['resource'], 
  action: VendorPermission['actions'][0]
): boolean {
  const permission = session.permissions.find(p => p.resource === resource);
  if (!permission) return false;
  
  return permission.actions.includes(action);
}

/**
 * Get vendor-specific data with proper filtering
 */
export function getVendorDataFilter(session: VendorSession) {
  return {
    businessId: session.businessId,
    $or: [
      { vendorId: session.vendorId },
      { 'partyA.id': session.vendorId },
      { 'partyB.id': session.vendorId }
    ]
  };
}

/**
 * Generate secure vendor access token
 */
export async function generateVendorAccessToken(): Promise<string> {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Audit vendor actions for compliance
 */
export interface VendorAuditLog {
  vendorId: string;
  businessId: string;
  action: string;
  resource: string;
  details: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  timestamp: string;
}
