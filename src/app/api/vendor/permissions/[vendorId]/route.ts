import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { getVendorPermissions, revokeVendorPermissions } from '@/lib/database/vendor-permissions';

// GET - Get specific vendor permissions
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ vendorId: string }> }
) {
  try {
    const { vendorId } = await params;
    const session = await getSession();
    
    if (!session?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const permissions = await getVendorPermissions(vendorId);

    if (!permissions) {
      return NextResponse.json({ 
        error: 'No permissions found for this vendor' 
      }, { status: 404 });
    }

    // Verify the permissions belong to the current company
    if (permissions.companyId !== session.companyId) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

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

// DELETE - Revoke vendor permissions
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ vendorId: string }> }
) {
  try {
    const { vendorId } = await params;
    const session = await getSession();
    
    if (!session?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await revokeVendorPermissions(vendorId);

    return NextResponse.json({
      success: true,
      message: 'Vendor permissions revoked successfully'
    });
  } catch (error) {
    console.error('Error revoking vendor permissions:', error);
    return NextResponse.json({ 
      error: 'Failed to revoke vendor permissions' 
    }, { status: 500 });
  }
}