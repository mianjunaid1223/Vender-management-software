import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { connectDB } from '@/lib/database/mongodb';
import User from '@/models/user.model';
import Vendor from '@/models/vendor.model';
import { logAudit } from '@/lib/audit/logger';

// GET all vendors for the current user's tenant
export async function GET() {
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

    const vendors = await Vendor.find({ tenantId: user.tenantId });
    return NextResponse.json(vendors);
  } catch (error) {
    console.error('Error fetching vendors:', error);
    return NextResponse.json(
      { error: 'Failed to fetch vendors' },
      { status: 500 }
    );
  }
}

// POST a new vendor for the current user's tenant
export async function POST(request: Request) {
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

    const body = await request.json();
    const newVendor = new Vendor({
      ...body,
      tenantId: user.tenantId, // Ensure vendor is tied to the correct tenant
    });

    await newVendor.save();

    await logAudit({
      tenantId: user.tenantId,
      actorId: user._id,
      actorType: 'USER',
      entityType: 'Vendor',
      entityId: newVendor._id,
      action: 'CREATE',
      afterState: newVendor.toObject(),
    });

    return NextResponse.json(newVendor, { status: 201 });
  } catch (error) {
    console.error('Error creating vendor:', error);
    return NextResponse.json(
      { error: 'Failed to create vendor' },
      { status: 500 }
    );
  }
}
