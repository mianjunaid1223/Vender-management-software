import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/data';
import { createAuditLog } from '@/lib/audit';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, type, description, value, startDate, endDate } = body;

    // Get company ID from session/auth
    const companyId = request.headers.get('x-company-id') || 'comp_001'; // Fallback for demo

    if (!title || !type || !value || !startDate || !endDate) {
      return NextResponse.json(
        { error: 'All required fields must be provided' },
        { status: 400 }
      );
    }

    const db = await getDb();
    
    // Create new contract
    const contract = {
      contractId: `contract_${Date.now()}`,
      companyId,
      title,
      type,
      description,
      value: parseFloat(value),
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      status: 'draft',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await db.collection('contracts').insertOne(contract);

    // Log the creation
    await createAuditLog({
      userId: companyId,
      userRole: 'vendor_admin',
      companyId,
      action: 'create',
      resource: 'contract',
      resourceId: contract.contractId,
      newValues: contract,
      ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown',
      sessionId: 'session_' + Date.now(),
      metadata: { contractType: type, value }
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
