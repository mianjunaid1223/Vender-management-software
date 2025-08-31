import 'server-only';
import { connectDB } from '@/lib/database/mongodb';
import { getSession } from '@/lib/auth/session';
import User from '@/models/user.model';
import Tenant from '@/models/tenant.model';

/**
 * Fetches the tenant document associated with the current logged-in user.
 */
export async function getTenantForCurrentUser() {
  try {
    await connectDB();

    const session = await getSession();
    if (!session?.userId) {
      return null;
    }

    const user = await User.findById(session.userId).lean();
    if (!user) {
      return null;
    }

    const tenant = await Tenant.findById(user.tenantId).lean();

    return JSON.parse(JSON.stringify(tenant));

  } catch (error) {
    console.error('Error fetching tenant for current user:', error);
    return null;
  }
}
