import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { 
  createVendorPermissions, 
  updateVendorPermissions, 
  getVendorPermissionsByCompany,
  validatePermissions 
} from '@/lib/database/vendor-permissions';

// POST - Create vendor permissions
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { vendorId, permissions, notes } = await request.json();

    if (!vendorId || !permissions) {
      return NextResponse.json({ 
        error: 'Missing required fields: vendorId, permissions' 
      }, { status: 400 });
    }

    // Validate permissions
    const validation = validatePermissions(permissions);
    if (!validation.isValid) {
      return NextResponse.json({ 
        error: 'Invalid permissions',
        details: validation.errors 
      }, { status: 400 });
    }

    const vendorPermissions = await createVendorPermissions(
      vendorId, 
      validation.adjustedPermissions, 
      notes
    );

    return NextResponse.json({
      success: true,
      permissions: vendorPermissions,
      message: 'Vendor permissions created successfully'
    });
  } catch (error) {
    console.error('Error creating vendor permissions:', error);
    return NextResponse.json({ 
      error: 'Failed to create vendor permissions' 
    }, { status: 500 });
  }
}

// PUT - Update vendor permissions
export async function PUT(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { vendorId, permissions, notes } = await request.json();

    if (!vendorId || !permissions) {
      return NextResponse.json({ 
        error: 'Missing required fields: vendorId, permissions' 
      }, { status: 400 });
    }

    // Validate permissions
    const validation = validatePermissions(permissions);
    if (!validation.isValid) {
      return NextResponse.json({ 
        error: 'Invalid permissions',
        details: validation.errors 
      }, { status: 400 });
    }

    const vendorPermissions = await updateVendorPermissions(
      vendorId, 
      validation.adjustedPermissions, 
      notes
    );

    return NextResponse.json({
      success: true,
      permissions: vendorPermissions,
      message: 'Vendor permissions updated successfully'
    });
  } catch (error) {
    console.error('Error updating vendor permissions:', error);
    return NextResponse.json({ 
      error: 'Failed to update vendor permissions' 
    }, { status: 500 });
  }
}

// GET - Get all vendor permissions for company
export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const permissions = await getVendorPermissionsByCompany(session.companyId);

    return NextResponse.json({
      success: true,
      permissions
    });
  } catch (error) {
    console.error('Error fetching vendor permissions:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch vendor permissions' 
    }, { status: 500 });
  }
}