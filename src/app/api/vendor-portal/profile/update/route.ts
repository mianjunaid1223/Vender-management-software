import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/data';
import { createAuditLog } from '@/lib/audit';

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, phone, address } = body;

    // Get company ID from session/auth
    const companyId = request.headers.get('x-company-id') || 'comp_001'; // Fallback for demo

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

    const result = await db.collection('companies').updateOne(
      { companyId },
      { $set: updateData }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { error: 'Company not found' },
        { status: 404 }
      );
    }

    // Get updated company info
    const updatedCompany = await db.collection('companies').findOne({ companyId });

    // Log the update
    await createAuditLog({
      userId: companyId,
      userRole: 'vendor_admin',
      companyId,
      action: 'update',
      resource: 'company_profile',
      resourceId: companyId,
      newValues: updateData,
      ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown',
      sessionId: 'session_' + Date.now(),
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
