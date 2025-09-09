'use server';

import { getDb } from './queries';
import { ObjectId } from 'mongodb';
import { VendorPermissions, Permission, PERMISSION_TEMPLATES } from '@/lib/types/permissions';
import { getSession } from '@/lib/auth';

export async function createVendorPermissions(
  vendorId: string,
  permissions: Omit<Permission, 'id'>[],
  notes?: string
): Promise<VendorPermissions> {
  const db = await getDb();
  const session = await getSession();
  
  if (!session?.companyId) {
    throw new Error('Unauthorized: No company context');
  }

  try {
    // Generate permission IDs
    const permissionsWithIds: Permission[] = permissions.map(p => ({
      ...p,
      id: new ObjectId().toString()
    }));

    const vendorPermissions: VendorPermissions = {
      id: new ObjectId().toString(),
      vendorId,
      companyId: session.companyId,
      permissions: permissionsWithIds,
      isActive: true,
      grantedBy: session.email || session.id,
      grantedAt: new Date().toISOString(),
      lastUpdated: new Date().toISOString(),
      notes
    };

    await db.collection('vendorPermissions').insertOne(vendorPermissions);
    return vendorPermissions;
  } catch (error) {
    console.error('Error creating vendor permissions:', error);
    throw new Error('Failed to create vendor permissions');
  }
}

export async function updateVendorPermissions(
  vendorId: string,
  permissions: Omit<Permission, 'id'>[],
  notes?: string
): Promise<VendorPermissions> {
  const db = await getDb();
  const session = await getSession();
  
  if (!session?.companyId) {
    throw new Error('Unauthorized: No company context');
  }

  try {
    // Generate permission IDs
    const permissionsWithIds: Permission[] = permissions.map(p => ({
      ...p,
      id: new ObjectId().toString()
    }));

    const updateData = {
      permissions: permissionsWithIds,
      lastUpdated: new Date().toISOString(),
      notes
    };

    const result = await db.collection('vendorPermissions').findOneAndUpdate(
      { 
        vendorId, 
        companyId: session.companyId,
        isActive: true 
      },
      { $set: updateData },
      { returnDocument: 'after' }
    );

    if (!result) {
      throw new Error('Vendor permissions not found');
    }

    return result as VendorPermissions;
  } catch (error) {
    console.error('Error updating vendor permissions:', error);
    throw new Error('Failed to update vendor permissions');
  }
}

export async function getVendorPermissions(vendorId: string): Promise<VendorPermissions | null> {
  const db = await getDb();
  
  try {
    const permissions = await db.collection('vendorPermissions').findOne({
      vendorId,
      isActive: true
    });

    return permissions as VendorPermissions | null;
  } catch (error) {
    console.error('Error fetching vendor permissions:', error);
    throw new Error('Failed to fetch vendor permissions');
  }
}

export async function getVendorPermissionsByCompany(companyId: string): Promise<VendorPermissions[]> {
  const db = await getDb();
  
  try {
    const permissions = await db.collection('vendorPermissions')
      .find({ 
        companyId,
        isActive: true 
      })
      .sort({ lastUpdated: -1 })
      .toArray();

    return permissions as VendorPermissions[];
  } catch (error) {
    console.error('Error fetching company vendor permissions:', error);
    throw new Error('Failed to fetch vendor permissions');
  }
}

export async function revokeVendorPermissions(vendorId: string): Promise<void> {
  const db = await getDb();
  const session = await getSession();
  
  if (!session?.companyId) {
    throw new Error('Unauthorized: No company context');
  }

  try {
    await db.collection('vendorPermissions').updateOne(
      { 
        vendorId, 
        companyId: session.companyId,
        isActive: true 
      },
      { 
        $set: { 
          isActive: false,
          revokedAt: new Date().toISOString(),
          revokedBy: session.email || session.id
        }
      }
    );
  } catch (error) {
    console.error('Error revoking vendor permissions:', error);
    throw new Error('Failed to revoke vendor permissions');
  }
}

export async function applyPermissionTemplate(
  vendorId: string,
  templateId: string,
  notes?: string
): Promise<VendorPermissions> {
  const template = PERMISSION_TEMPLATES.find(t => t.id === templateId);
  
  if (!template) {
    throw new Error('Permission template not found');
  }

  // Check if permissions already exist
  const existingPermissions = await getVendorPermissions(vendorId);
  
  if (existingPermissions) {
    return updateVendorPermissions(vendorId, template.permissions, notes);
  } else {
    return createVendorPermissions(vendorId, template.permissions, notes);
  }
}

// Ensure minimum read permission when granting access
export function validatePermissions(permissions: Omit<Permission, 'id'>[]): {
  isValid: boolean;
  errors: string[];
  adjustedPermissions: Omit<Permission, 'id'>[];
} {
  const errors: string[] = [];
  let adjustedPermissions = [...permissions];

  // Check if at least one read permission exists
  const hasReadPermission = permissions.some(p => p.actions.includes('read'));
  
  if (!hasReadPermission) {
    errors.push('At least one read permission is required');
    // Auto-add basic read permission for profile
    adjustedPermissions.push({
      resource: 'profile',
      actions: ['read'],
      description: 'Minimum required access - view own profile'
    });
  }

  // Validate dependent permissions
  adjustedPermissions.forEach(permission => {
    const hasRead = permission.actions.includes('read');
    const hasWrite = permission.actions.some(action => ['create', 'edit', 'delete'].includes(action));

    if (hasWrite && !hasRead) {
      // Auto-add read permission if write permissions are granted
      permission.actions.unshift('read');
    }
  });

  return {
    isValid: errors.length === 0,
    errors,
    adjustedPermissions
  };
}