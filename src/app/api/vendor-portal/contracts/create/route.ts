import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/shared/lib/data';
import { createAuditLog } from '@/core/services/audit';
import { getVendorSession } from '@/core/auth/vendor-auth';
import { ObjectId } from 'mongodb';

export async function POST(request: NextRequest) {
  try {
    const session = await getVendorSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const body = await request.json();
    const { title, type, description, value, startDate, endDate } = body as Record<string, any>;
    const companyId = session.companyId;
    const vendorId = session.vendorId;

    if (!title || !type || !value || !startDate || !endDate) {
      return NextResponse.json(
        { error: 'All required fields must be provided' },
        { status: 400 }
      );
    }

    const valueNum = Number(value);
    if (!Number.isFinite(valueNum) || valueNum < 0) {
      return NextResponse.json({ error: 'Invalid value' }, { status: 400 });
    }
    
    if (new Date(endDate) < new Date(startDate)) {
      return NextResponse.json({ error: 'endDate must be >= startDate' }, { status: 400 });
    }

    const db = await getDb();
    
    // Check if vendor has permission to create contracts
    const company = await db.collection('companies').findOne({ _id: new ObjectId(companyId) });
    const access = company?.vendorPortalAccess?.find((a: any) => a.vendorId === vendorId && a.enabled);
    if (!access?.features?.createContracts) {
      return NextResponse.json({ error: 'Permission denied' }, { status: 403 });
    }
    
    // Create new contract
    const contract = {
      contractId: `contract_${Date.now()}`,
      companyId,
      vendorId,
      title,
      type,
      description,
      value: valueNum,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      status: 'draft',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await db.collection('contracts').insertOne(contract);

    // Log the creation
    await createAuditLog({
      userId: session.id,
      userRole: (session.role as any) || 'vendor_user',
      companyId,
      vendorId,
      action: 'create',
      resource: 'contract',
      resourceId: contract.contractId,
      newValues: contract,
      ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown',
      sessionId: 'vendor_' + session.id,
      metadata: { contractType: type, value: valueNum }
    });

    return NextResponse.json({
      success: true,
      contract: {
        ...contract,
        _id: result.insertedId
      },
      message: 'Contract created successfully'
    });

  } catch (error) {
    console.error('Contract creation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
