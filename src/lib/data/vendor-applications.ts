import 'server-only';
import { connectDB } from '@/lib/database/mongodb';
import { getSession } from '@/lib/auth/session';
import User from '@/models/user.model';
import VendorApplication from '@/models/vendorApplication.model';

/**
 * Fetches all vendor applications for the current logged-in user's tenant.
 */
export async function getVendorApplicationsForCurrentUser() {
  try {
    await connectDB();

    const session = await getSession();
    if (!session?.userId) {
      return [];
    }

    const user = await User.findById(session.userId).lean();
    if (!user) {
      return [];
    }

    const applications = await VendorApplication.find({ tenantId: user.tenantId })
      .sort({ createdAt: -1 })
      .lean();

    return JSON.parse(JSON.stringify(applications));

  } catch (error) {
    console.error('Error fetching vendor applications for current user:', error);
    return [];
  }
}
