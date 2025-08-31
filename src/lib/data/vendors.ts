import 'server-only';
import { connectDB } from '@/lib/database/mongodb';
import { getSession } from '@/lib/auth/session';
import User from '@/models/user.model';
import Vendor from '@/models/vendor.model';

/**
 * Fetches all vendors associated with the current logged-in user's tenant.
 * This is a server-side function and should only be called from server components.
 */
export async function getVendorsForCurrentUser() {
  try {
    await connectDB();

    const session = await getSession();
    if (!session?.userId) {
      // In a real app, you might throw an error or return a specific object
      // For now, returning an empty array is safe for list views.
      console.log("No session found, returning empty array.");
      return [];
    }

    const user = await User.findById(session.userId).lean();
    if (!user) {
      console.log(`User with id ${session.userId} not found, returning empty array.`);
      return [];
    }

    const vendors = await Vendor.find({ tenantId: user.tenantId }).sort({ name: 1 }).lean();

    // Mongoose documents are complex. When passing from server to client components,
    // it's best practice to serialize them to plain JSON objects.
    // .lean() already returns plain objects, but if it wasn't used, we'd need to serialize.
    // For consistency and to be safe, we can do a final serialization.
    return JSON.parse(JSON.stringify(vendors));

  } catch (error) {
    console.error('Error fetching vendors for current user:', error);
    // Return an empty array on error to prevent the page from crashing.
    return [];
  }
}
