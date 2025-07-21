'use server';

import { getDb } from '@/lib/data';
import { requireAuth } from '@/lib/auth';
import { ObjectId } from 'mongodb';
import { VendorInvitation, VendorPermission, VendorAuditLog, generateVendorAccessToken } from '@/lib/vendor-auth';
import type { Vendor } from '@/lib/types';
import { unstable_noStore as noStore } from 'next/cache';

/**
 * Vendor Portal Data Layer
 * Handles all vendor self-service operations with proper isolation
 */

// ================================
// VENDOR INVITATION SYSTEM
// ================================

export async function createVendorInvitation(
  vendorId: string, 
  permissions: VendorPermission[]
): Promise<VendorInvitation> {
  noStore();
  const session = await requireAuth();
  const db = await getDb();
  
  try {
    // Get vendor details
    const vendor = await db.collection('vendors').findOne({
      _id: new ObjectId(vendorId),
      businessId: session.businessId || session.userId
    });
    
    if (!vendor) {
      throw new Error('Vendor not found or access denied');
    }
    
    const token = await generateVendorAccessToken();
    const invitation: VendorInvitation = {
      id: new ObjectId().toString(),
      vendorId,
      businessId: session.businessId || session.userId,
      invitedBy: session.userId,
      email: vendor.email,
      permissions,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
      status: 'pending',
      token,
      createdAt: new Date().toISOString()
    };
    
    await db.collection('vendor_invitations').insertOne(invitation);
    
    // Log the invitation
    await logVendorAction(session.userId, session.businessId || session.userId, 'invite_vendor', 'invitation', {
      vendorId,
      permissions: permissions.map(p => ({ resource: p.resource, actions: p.actions }))
    });
    
    return invitation;
  } catch (error) {
    console.error('Error creating vendor invitation:', error);
    throw new Error('Failed to create vendor invitation');
  }
}

export async function getVendorInvitation(token: string): Promise<VendorInvitation | null> {
  noStore();
  const db = await getDb();
  
  try {
    const invitation = await db.collection('vendor_invitations').findOne({ 
      token,
      status: 'pending',
      expiresAt: { $gt: new Date().toISOString() }
    });
    
    if (!invitation) return null;
    
    const { _id, ...rest } = invitation;
    return {
      ...rest,
      id: _id.toString()
    } as VendorInvitation;
  } catch (error) {
    console.error('Error fetching vendor invitation:', error);
    return null;
  }
}

export async function acceptVendorInvitation(token: string): Promise<boolean> {
  noStore();
  const db = await getDb();
  
  try {
    const result = await db.collection('vendor_invitations').updateOne(
      { 
        token,
        status: 'pending',
        expiresAt: { $gt: new Date().toISOString() }
      },
      { 
        $set: { 
          status: 'accepted',
          acceptedAt: new Date().toISOString()
        }
      }
    );
    
    return result.modifiedCount > 0;
  } catch (error) {
    console.error('Error accepting vendor invitation:', error);
    return false;
  }
}

// ================================
// VENDOR SELF-SERVICE DATA ACCESS
// ================================

export async function getVendorPortalData(vendorId: string, businessId: string) {
  noStore();
  const db = await getDb();
  
  try {
    const dataFilter = {
      businessId,
      $or: [
        { vendorId },
        { 'partyA.id': vendorId },
        { 'partyB.id': vendorId }
      ]
    };
    
    // Get vendor profile
    const vendor = await db.collection('vendors').findOne({
      _id: new ObjectId(vendorId),
      businessId
    });
    
    if (!vendor) throw new Error('Vendor not found');
    
    // Get contracts
    const contracts = await db.collection('contracts')
      .find(dataFilter)
      .sort({ createdAt: -1 })
      .toArray();
    
    // Get invoices
    const invoices = await db.collection('invoices')
      .find(dataFilter)
      .sort({ invoiceDate: -1 })
      .toArray();
    
    // Get recent activity (audit logs)
    const recentActivity = await db.collection('vendor_audit_logs')
      .find({ vendorId, businessId })
      .sort({ timestamp: -1 })
      .limit(10)
      .toArray();
    
    return {
      vendor: JSON.parse(JSON.stringify({ ...vendor, id: vendor._id.toString() })),
      contracts: JSON.parse(JSON.stringify(contracts.map(c => ({ ...c, id: c._id.toString() })))),
      invoices: JSON.parse(JSON.stringify(invoices.map(i => ({ ...i, id: i._id.toString() })))),
      recentActivity: JSON.parse(JSON.stringify(recentActivity.map(a => ({ ...a, id: a._id.toString() }))))
    };
  } catch (error) {
    console.error('Error fetching vendor portal data:', error);
    throw new Error('Failed to fetch vendor data');
  }
}

export async function updateVendorProfile(
  vendorId: string, 
  businessId: string, 
  updates: Partial<Vendor>
): Promise<Vendor> {
  noStore();
  const db = await getDb();
  
  try {
    const { _id, ...updateData } = updates as any;
    updateData.updatedAt = new Date().toISOString();
    
    const result = await db.collection('vendors').findOneAndUpdate(
      {
        _id: new ObjectId(vendorId),
        businessId
      },
      { $set: updateData },
      { returnDocument: 'after' }
    );
    
    if (!result) {
      throw new Error('Vendor not found or access denied');
    }
    
    // Log the update
    await logVendorAction(vendorId, businessId, 'update_profile', 'vendor', {
      updatedFields: Object.keys(updateData)
    });
    
    return JSON.parse(JSON.stringify({ ...result, id: result._id.toString() }));
  } catch (error) {
    console.error('Error updating vendor profile:', error);
    throw new Error('Failed to update vendor profile');
  }
}

// ================================
// VENDOR AUDIT SYSTEM
// ================================

export async function logVendorAction(
  vendorId: string,
  businessId: string,
  action: string,
  resource: string,
  details: Record<string, any>,
  ipAddress?: string,
  userAgent?: string
): Promise<void> {
  const db = await getDb();
  
  try {
    const auditLog: VendorAuditLog = {
      vendorId,
      businessId,
      action,
      resource,
      details,
      ipAddress,
      userAgent,
      timestamp: new Date().toISOString()
    };
    
    await db.collection('vendor_audit_logs').insertOne(auditLog);
  } catch (error) {
    console.error('Error logging vendor action:', error);
    // Don't throw error for audit logging to avoid disrupting main flow
  }
}

export async function getVendorAuditLogs(
  vendorId: string, 
  businessId: string, 
  limit: number = 50
): Promise<VendorAuditLog[]> {
  noStore();
  const db = await getDb();
  
  try {
    const logs = await db.collection('vendor_audit_logs')
      .find({ vendorId, businessId })
      .sort({ timestamp: -1 })
      .limit(limit)
      .toArray();
    
    return JSON.parse(JSON.stringify(logs.map(log => ({ ...log, id: log._id.toString() }))));
  } catch (error) {
    console.error('Error fetching vendor audit logs:', error);
    throw new Error('Failed to fetch vendor audit logs');
  }
}
