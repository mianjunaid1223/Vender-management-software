import { NextRequest, NextResponse } from 'next/server';
import { getVendorSession } from '@/lib/auth/vendor-auth';
import { getMyContracts } from '@/lib/data/vendor-data';
import { getDb } from '@/lib/data';
import { ObjectId } from 'mongodb';

// Check if vendor has permission for a specific action
async function checkPermission(session: any, action: 'read' | 'edit' | 'create') {
  const db = await getDb();
  const company = await db.collection('companies').findOne({
    _id: new ObjectId(session.companyId)
  });

  if (!company) return false;

  const vendorAccess = company.vendorPortalAccess?.find(
    (access: any) => access.vendorId === session.vendorId
  );

  if (!vendorAccess || !vendorAccess.enabled) return false;

  // Check if access has expired
  if (vendorAccess.expiresAt && new Date() > new Date(vendorAccess.expiresAt)) {
    return false;
  }

  return vendorAccess.features?.contractManagement?.[action] || false;
}

// GET - View contracts (requires READ permission)
export async function GET(request: NextRequest) {
  try {
    const session = await getVendorSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const hasPermission = await checkPermission(session, 'read');
    if (!hasPermission) {
      return NextResponse.json({ 
        error: 'You do not have permission to view contracts' 
      }, { status: 403 });
    }

    const db = await getDb();
    
    // Use the new session-derived function for maximum security
    const contracts = await getMyContracts();

    return NextResponse.json({
      contracts: contracts.map(contract => ({
        id: contract.id,
        title: contract.title,
        type: contract.type || 'service',
        status: contract.status || 'draft',
        startDate: contract.startDate,
        endDate: contract.endDate,
        value: contract.value || 0,
        description: contract.description
      }))
    });

  } catch (error) {
    console.error('Error fetching contracts:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
