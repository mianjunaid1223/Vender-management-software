import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { connectDB } from '@/lib/database/mongodb';
import User from '@/models/user.model';
import Contract from '@/models/contract.model';
import { logAudit } from '@/lib/audit/logger';

// GET a single contract by ID
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

    const contract = await Contract.findOne({ _id: params.id, tenantId: user.tenantId }).populate('vendorId', 'name').lean();
    if (!contract) {
      return NextResponse.json({ error: 'Contract not found' }, { status: 404 });
    }

    return NextResponse.json(contract);
  } catch (error) {
    console.error('Error fetching contract:', error);
    return NextResponse.json({ error: 'Failed to fetch contract' }, { status: 500 });
  }
}

// UPDATE a contract by ID
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

    const originalContract = await Contract.findOne({ _id: params.id, tenantId: user.tenantId }).lean();
    if (!originalContract) {
      return NextResponse.json({ error: 'Contract not found or access denied' }, { status: 404 });
    }

    const updatedContract = await Contract.findByIdAndUpdate(params.id, body, { new: true });

    await logAudit({
      tenantId: user.tenantId,
      actorId: user._id,
      actorType: 'USER',
      entityType: 'Contract',
      entityId: updatedContract!._id,
      action: 'UPDATE',
      beforeState: originalContract,
      afterState: updatedContract!.toObject(),
    });

    return NextResponse.json(updatedContract);
  } catch (error) {
    console.error('Error updating contract:', error);
    return NextResponse.json({ error: 'Failed to update contract' }, { status: 500 });
  }
}

// DELETE a contract by ID
export async function DELETE(request: NextRequest, { params }: { params: { id:string } }) {
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

    const deletedContract = await Contract.findOneAndDelete({ _id: params.id, tenantId: user.tenantId });

    if (!deletedContract) {
      return NextResponse.json({ error: 'Contract not found or access denied' }, { status: 404 });
    }

    await logAudit({
      tenantId: user.tenantId,
      actorId: user._id,
      actorType: 'USER',
      entityType: 'Contract',
      entityId: deletedContract._id,
      action: 'DELETE',
      beforeState: deletedContract.toObject(),
    });

    return NextResponse.json({ message: 'Contract deleted successfully' });
  } catch (error) {
    console.error('Error deleting contract:', error);
    return NextResponse.json({ error: 'Failed to delete contract' }, { status: 500 });
  }
}
