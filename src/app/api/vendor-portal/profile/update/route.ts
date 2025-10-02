import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/shared/lib/data';
import { createAuditLog } from '@/core/services/audit';
import { getVendorSession } from '@/core/auth/vendor-auth';
import { ObjectId } from 'mongodb';

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, phone, address } = body;

    // Require authenticated vendor session
    const session = await getVendorSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const companyId = session.companyId;

    if (!name || !email) {
      return NextResponse.json(
        { error: 'Company name and email are required' },
        { status: 400 }
      );
    }

    const db = await getDb();
    
    // Update company profile
    const updateData = {
      name,
      email,
      phone: phone || null,
      address: address || null,
      updatedAt: new Date()
    };

    // Validate companyId as ObjectId
    if (!ObjectId.isValid(companyId)) {
      return NextResponse.json(
        { error: 'Invalid Company ID format' },
        { status: 400 }
      );
    }

    const companyObjectId = new ObjectId(companyId);

    const result = await db.collection('companies').updateOne(
      { _id: companyObjectId },
      { $set: updateData }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { error: 'Company not found' },
        { status: 404 }
      );
    }

    // Get updated company info
    const updatedCompany = await db.collection('companies').findOne({ _id: companyObjectId });

    // Log the update
    await createAuditLog({
      userId: session.id,
      userRole: 'vendor_admin',
      vendorId: session.vendorId,
      companyId: session.companyId,
      action: 'update',
      resource: 'company_profile',
      resourceId: companyId,
      newValues: updateData,
      ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown',
      sessionId: session.id,
      metadata: { updatedFields: Object.keys(updateData) }
    });

    return NextResponse.json({
      success: true,
      company: updatedCompany,
      message: 'Profile updated successfully'
    });

  } catch (error) {
    console.error('Profile update error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
