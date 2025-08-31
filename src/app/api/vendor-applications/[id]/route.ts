import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/database/mongodb';
import { getSession } from '@/lib/auth/session';
import User from '@/models/user.model';
import Tenant from '@/models/tenant.model';
import Vendor from '@/models/vendor.model';
import VendorApplication from '@/models/vendorApplication.model';
import { sendVendorApprovalEmail, sendVendorRejectionEmail } from '@/lib/email';
import { logAudit } from '@/lib/audit/logger';

// GET a single vendor application by ID
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
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

    const application = await VendorApplication.findOne({ _id: params.id, tenantId: user.tenantId });
    if (!application) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }

    return NextResponse.json(application);
  } catch (error) {
    console.error('Error fetching vendor application:', error);
    return NextResponse.json({ error: 'Failed to fetch application' }, { status: 500 });
  }
}

// PATCH - Update vendor application status (approve/reject)
export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
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

    const { status, notes } = await request.json();
    if (!status || !['APPROVED', 'REJECTED'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status. Must be "APPROVED" or "REJECTED"' }, { status: 400 });
    }

    const originalApplication = await VendorApplication.findOne({ _id: params.id, tenantId: user.tenantId }).lean();
    if (!originalApplication) {
      return NextResponse.json({ error: 'Application not found or access denied' }, { status: 404 });
    }
    if (originalApplication.status !== 'PENDING') {
      return NextResponse.json({ error: 'Application has already been reviewed' }, { status: 400 });
    }

    // Update application status
    const updatedApplication = await VendorApplication.findByIdAndUpdate(params.id, {
      status,
      reviewedAt: new Date(),
      reviewedBy: user._id,
      notes: notes || originalApplication.notes,
    }, { new: true });

    if (!updatedApplication) {
      // This should not happen if the findOne check passed, but as a safeguard:
      return NextResponse.json({ error: 'Failed to update application' }, { status: 500 });
    }

    await logAudit({
      tenantId: user.tenantId,
      actorId: user._id,
      actorType: 'USER',
      entityType: 'VendorApplication',
      entityId: updatedApplication._id,
      action: 'UPDATE',
      details: { newStatus: status },
      beforeState: originalApplication,
      afterState: updatedApplication.toObject(),
    });

    const tenant = await Tenant.findById(user.tenantId);
    if (!tenant) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
    }

    if (status === 'APPROVED') {
      const pin = Math.random().toString(36).substring(2, 10).toUpperCase();
      const pinExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

      const newVendor = await Vendor.create({
        tenantId: user.tenantId,
        name: updatedApplication.vendorName,
        contactPerson: updatedApplication.contactPerson,
        email: updatedApplication.email,
        phone: updatedApplication.phone,
        service: updatedApplication.service,
        taxId: updatedApplication.taxId,
        address: updatedApplication.address,
        notes: updatedApplication.notes,
        status: 'ACTIVE',
        pin: pin,
        pinExpiresAt: pinExpiresAt,
      });

      await logAudit({
        tenantId: user.tenantId,
        actorId: user._id,
        actorType: 'USER',
        entityType: 'Vendor',
        entityId: newVendor._id,
        action: 'CREATE',
        details: { source: 'VendorApplication', applicationId: updatedApplication._id },
        afterState: newVendor.toObject(),
      });

      const dashboardUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:9002'}/vendor-portal/dashboard`;
      await sendVendorApprovalEmail(updatedApplication.email, updatedApplication.vendorName, `${dashboardUrl}?pin=${pin}`, pin);
    } else {
      await sendVendorRejectionEmail(updatedApplication.email, updatedApplication.vendorName, tenant.name, notes || 'Your application did not meet our current requirements.');
    }

    return NextResponse.json(updatedApplication);

  } catch (error) {
    console.error('Error updating vendor application:', error);
    return NextResponse.json({ error: 'Failed to update application' }, { status: 500 });
  }
}