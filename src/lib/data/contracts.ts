import 'server-only';
import { connectDB } from '@/lib/database/mongodb';
import { getSession } from '@/lib/auth/session';
import User from '@/models/user.model';
import Contract from '@/models/contract.model';

/**
 * Fetches all contracts associated with the current logged-in user's tenant.
 * Populates vendor name for convenience.
 */
export async function getContractsForCurrentUser() {
  try {
    await connectDB();

    const session = await getSession();
    if (!session?.userId) {
      console.log("No session found, returning empty array.");
      return [];
    }

    const user = await User.findById(session.userId).lean();
    if (!user) {
      console.log(`User with id ${session.userId} not found, returning empty array.`);
      return [];
    }

    const contracts = await Contract.find({ tenantId: user.tenantId })
      .populate('vendorId', 'name')
      .sort({ createdAt: -1 })
      .lean();

    return JSON.parse(JSON.stringify(contracts));

  } catch (error) {
    console.error('Error fetching contracts for current user:', error);
    return [];
  }
}
