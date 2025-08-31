import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/database/mongodb';
import { getSession } from '@/lib/auth/session';
import VendorApplication from '@/models/vendorApplication.model';
import Invite from '@/models/invite.model';
import User from '@/models/user.model';
import { logAudit } from '@/lib/audit/logger';

// POST /api/vendor-applications - Public endpoint to submit a new vendor application
export async function POST(request: Request) {
  try {
    await connectDB();
    const body = await request.json();

    // Mongoose will handle most validation based on the schema
    const newApplication = new VendorApplication({
      ...body,
      tenantId: body.targetCompanyId, // map frontend field to schema field
      status: 'PENDING',
      submittedAt: new Date(),
      // Generate a unique application ID
      applicationId: `VA-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`
    });

    const savedApplication = await newApplication.save();

    // If an invite token was used, update the invite status
    if (body.inviteToken) {
      await Invite.updateOne(
        { token: body.inviteToken, tenantId: body.targetCompanyId },
        {
          $set: {
            status: 'COMPLETED',
            usedAt: new Date(),
            vendorApplicationId: savedApplication._id
          }
        }
      );
    }

    await logAudit({
      tenantId: savedApplication.tenantId,
      actorType: 'SYSTEM', // Public submission is a system action
      entityType: 'VendorApplication',
      entityId: savedApplication._id,
      action: 'CREATE',
      afterState: savedApplication.toObject(),
    });

    return NextResponse.json({
      success: true,
      applicationId: savedApplication.applicationId,
      message: 'Vendor application submitted successfully'
    }, { status: 201 });

  } catch (error: any) {
    console.error('Error submitting vendor application:', error);
    // Provide more specific error if it's a validation error from Mongoose
    if (error.name === 'ValidationError') {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json(
      { error: 'Failed to submit vendor application' },
      { status: 500 }
    );
  }
}

// GET /api/vendor-applications - Secure endpoint to get applications for the user's tenant
export async function GET(request: Request) {
  try {
    await connectDB();
    const session = await getSession();
    if (!session?.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await User.findById(session.userId);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const applications = await VendorApplication.find({ tenantId: user.tenantId })
      .sort({ submittedAt: -1 });

    return NextResponse.json(applications);
  } catch (error) {
    console.error('Error fetching vendor applications:', error);
    return NextResponse.json(
      { error: 'Failed to fetch vendor applications' },
      { status: 500 }
    );
  }
}
