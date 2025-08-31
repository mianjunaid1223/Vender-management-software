import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { connectDB } from '@/lib/database/mongodb';
import User from '@/models/user.model';
import Contract from '@/models/contract.model';
import { logAudit } from '@/lib/audit/logger';

// GET all contracts for the current user's tenant
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

    const contracts = await Contract.find({ tenantId: user.tenantId }).populate('vendorId', 'name').lean();
    return NextResponse.json(contracts);
  } catch (error) {
    console.error('Error fetching contracts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch contracts' },
      { status: 500 }
    );
  }
}

// POST a new contract for the current user's tenant
export async function POST(request: NextRequest) {
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
    const newContract = new Contract({
      ...body,
      tenantId: user.tenantId,
      createdBy: user._id,
    });

    await newContract.save();

    await logAudit({
      tenantId: user.tenantId,
      actorId: user._id,
      actorType: 'USER',
      entityType: 'Contract',
      entityId: newContract._id,
      action: 'CREATE',
      afterState: newContract.toObject(),
    });

    return NextResponse.json(newContract, { status: 201 });
  } catch (error) {
    console.error('Error creating contract:', error);
    return NextResponse.json(
      { error: 'Failed to create contract' },
      { status: 500 }
    );
  }
}
