import 'server-only';
import { connectDB } from '@/lib/database/mongodb';
import { getSession } from '@/lib/auth/session';
import User from '@/models/user.model';
import Invoice from '@/models/invoice.model';

/**
 * Fetches all invoices associated with the current logged-in user's tenant.
 * Populates vendor and contract names for convenience.
 */
export async function getInvoicesForCurrentUser() {
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

    const invoices = await Invoice.find({ tenantId: user.tenantId })
      .populate('vendorId', 'name')
      .populate('contractId', 'title')
      .sort({ invoiceDate: -1 })
      .lean();

    return JSON.parse(JSON.stringify(invoices));

  } catch (error) {
    console.error('Error fetching invoices for current user:', error);
    return [];
  }
}
