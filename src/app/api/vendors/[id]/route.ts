import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { connectDB } from '@/lib/database/mongodb';
import User from '@/models/user.model';
import Vendor from '@/models/vendor.model';
import { logAudit } from '@/lib/audit/logger';

// GET a single vendor by ID
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await connectDB();
    const session = await getSession();
    if (!session?.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await User.findById(session.userId).lean();
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const vendor = await Vendor.findOne({ _id: params.id, tenantId: user.tenantId });
    if (!vendor) {
      return NextResponse.json({ error: 'Vendor not found' }, { status: 404 });
    }

    return NextResponse.json(vendor);
  } catch (error) {
    console.error('Error fetching vendor:', error);
    return NextResponse.json({ error: 'Failed to fetch vendor' }, { status: 500 });
  }
}

// UPDATE a vendor by ID
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await connectDB();
    const session = await getSession();
    if (!session?.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await User.findById(session.userId).lean();
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const body = await request.json();

    const originalVendor = await Vendor.findOne({ _id: params.id, tenantId: user.tenantId }).lean();
    if (!originalVendor) {
      return NextResponse.json({ error: 'Vendor not found or access denied' }, { status: 404 });
    }

    const updatedVendor = await Vendor.findByIdAndUpdate(params.id, body, { new: true });

    await logAudit({
      tenantId: user.tenantId,
      actorId: user._id,
      actorType: 'USER',
      entityType: 'Vendor',
      entityId: updatedVendor!._id,
      action: 'UPDATE',
      beforeState: originalVendor,
      afterState: updatedVendor!.toObject(),
    });

    return NextResponse.json(updatedVendor);
  } catch (error) {
    console.error('Error updating vendor:', error);
    return NextResponse.json({ error: 'Failed to update vendor' }, { status: 500 });
  }
}

// DELETE a vendor by ID
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await connectDB();
    const session = await getSession();
    if (!session?.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await User.findById(session.userId).lean();
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const deletedVendor = await Vendor.findOneAndDelete({ _id: params.id, tenantId: user.tenantId });

    if (!deletedVendor) {
      return NextResponse.json({ error: 'Vendor not found or access denied' }, { status: 404 });
    }

    await logAudit({
      tenantId: user.tenantId,
      actorId: user._id,
      actorType: 'USER',
      entityType: 'Vendor',
      entityId: deletedVendor._id,
      action: 'DELETE',
      beforeState: deletedVendor.toObject(),
    });

    return NextResponse.json({ message: 'Vendor deleted successfully' });
  } catch (error) {
    console.error('Error deleting vendor:', error);
    return NextResponse.json({ error: 'Failed to delete vendor' }, { status: 500 });
  }
}
