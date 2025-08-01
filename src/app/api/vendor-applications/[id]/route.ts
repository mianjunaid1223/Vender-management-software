import { NextResponse } from 'next/server';
import { getDb } from '@/lib/data';
import { ObjectId } from 'mongodb';
import { getSession } from '@/lib/auth';
import crypto from 'crypto';
import { VendorApplication } from '@/types/vendor-application';
import { sendVendorApprovalEmail, sendVendorRejectionEmail } from '@/lib/email';

// Define a type for the API response that matches the database model but with string IDs
type VendorApplicationResponse = {
  id: string;  // _id as string
  name: string;
  email: string;
  phone?: string;
  service?: string;
  contactPerson?: string;
  taxId?: string;
  address?: VendorApplication['address'];
  status: string;
  notes?: string;
  companyId: string;  // Converted from ObjectId to string
  targetCompanyId?: string;  // Converted from ObjectId to string
  inviteToken?: string;
  inviteTokenExpiresAt?: Date;
  reviewedBy?: string;  // Converted from ObjectId to string
  reviewedAt?: Date;
  createdAt: string | Date;
  updatedAt: string | Date;
};

// PATCH /api/vendor-applications/[id] - Approve or reject a vendor application
export async function PATCH(
  request: Request,
  context: { params: { id: string } }
) {
  const { id } = context.params;
  try {
    const session = await getSession();
    if (!session?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const db = await getDb();
    const body = await request.json();
    const { status, notes, generateToken } = body;

    // Validate status
    if (!['approved', 'rejected'].includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status. Must be "approved" or "rejected"' },
        { status: 400 }
      );
    }

    // Validate application ID
    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: 'Invalid application ID' },
        { status: 400 }
      );
    }

    // Find the application with proper typing
    const application = await db.collection<VendorApplication>('vendorApplications').findOne({
      _id: new ObjectId(id),
      targetCompanyId: new ObjectId(session.companyId)
    });

    if (!application) {
      return NextResponse.json(
        { error: 'Application not found' },
        { status: 404 }
      );
    }
    
    // Type guard to ensure required fields exist
    if (!application.email || !application.name) {
      return NextResponse.json(
        { error: 'Invalid application data: missing required fields' },
        { status: 400 }
      );
    }

    // Generate a secure token for vendor access if approved
    let inviteToken = null;
    let inviteLink = null;
    
    if (status === 'approved' && generateToken) {
      inviteToken = crypto.randomBytes(32).toString('hex');
      inviteLink = `${process.env.NEXT_PUBLIC_APP_URL}/vendor-portal?token=${inviteToken}`;
    }

    // Update application status with proper typing
    const updateData: Partial<VendorApplication> & {
      status: string;
      updatedAt: Date;
      reviewedBy: string;
      reviewedAt: Date;
      inviteToken?: string;
      inviteTokenExpiresAt?: Date;
      notes?: string;
    } = {
      status,
      updatedAt: new Date(),
      reviewedBy: session.id,
      reviewedAt: new Date(),
    };

    if (inviteToken) {
      updateData.inviteToken = inviteToken;
      updateData.inviteTokenExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
    }

    if (notes) {
      updateData.notes = notes;
    };

    const result = await db.collection<VendorApplication>('vendorApplications').findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: updateData },
      { returnDocument: 'after' }
    ) as unknown as { value: VendorApplication | null };

    // Send notification email
    if (result?.value?.email) {
      const vendorName = result.value.name || 'Vendor';
      if (status === 'approved') {
        await sendVendorApprovalEmail(result.value.email, vendorName);
      } else if (status === 'rejected') {
        await sendVendorRejectionEmail(result.value.email, vendorName);
      }
    }

    return NextResponse.json({ 
      success: true, 
      inviteToken,
      inviteLink,
      message: `Application ${status} successfully`
    });
  } catch (error) {
    console.error('Error processing vendor application:', error);
    return NextResponse.json(
      { error: 'Failed to process application' },
      { status: 500 }
    );
  }
}

// GET /api/vendor-applications/[id] - Get a specific vendor application
export async function GET(
  request: Request,
  context: { params: { id: string } }
) {
  const { id } = context.params;
  try {
    const session = await getSession();
    if (!session?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const db = await getDb();

    // Validate application ID
    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: 'Invalid application ID' },
        { status: 400 }
      );
    }

    // Find the application with proper typing
    const application = await db.collection<VendorApplication>('vendorApplications').findOne({
      _id: new ObjectId(id),
      targetCompanyId: new ObjectId(session.companyId)
    });

    if (!application) {
      return NextResponse.json(
        { error: 'Application not found' },
        { status: 404 }
      );
    }
    
    // Type guard to ensure required fields exist
    if (!application.email || !application.name) {
      return NextResponse.json(
        { error: 'Invalid application data: missing required fields' },
        { status: 400 }
      );
    }

    // Create a properly typed response object
    const result: VendorApplicationResponse = {
      id: application._id.toString(),
      name: application.name || '',
      email: application.email || '',
      phone: application.phone,
      service: application.service,
      contactPerson: application.contactPerson,
      taxId: application.taxId,
      address: application.address,
      status: application.status || 'pending',
      notes: application.notes,
      companyId: application.companyId?.toString() || '',
      targetCompanyId: application.targetCompanyId?.toString(),
      inviteToken: application.inviteToken,
      inviteTokenExpiresAt: application.inviteTokenExpiresAt,
      reviewedBy: application.reviewedBy?.toString(),
      reviewedAt: application.reviewedAt,
      createdAt: application.createdAt || new Date().toISOString(),
      updatedAt: application.updatedAt || new Date().toISOString(),
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching vendor application:', error);
    return NextResponse.json(
      { error: 'Failed to fetch application' },
      { status: 500 }
    );
  }
}
