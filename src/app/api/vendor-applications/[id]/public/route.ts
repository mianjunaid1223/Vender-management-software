import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/database/mongodb';
import VendorApplication from '@/models/vendorApplication.model';

// GET /api/vendor-applications/[id]/public - Public view of vendor application (no auth required)
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const { id } = params;

  try {
    await connectDB();

    // Mongoose will handle the ObjectId validation
    const application = await VendorApplication.findById(id);

    if (!application) {
      return NextResponse.json(
        { error: 'Application not found' },
        { status: 404 }
      );
    }

    // Return the application status and minimal info for public viewing
    const publicData = {
      applicationId: application.applicationId,
      status: application.status,
      submittedAt: application.submittedAt,
      vendorName: application.vendorName,
      message: getStatusMessage(application.status)
    };

    return NextResponse.json(publicData);
  } catch (error: any) {
    console.error('Error fetching vendor application:', error);
    // Handle CastError which occurs for invalid ObjectId format
    if (error.name === 'CastError') {
      return NextResponse.json({ error: 'Invalid application ID format' }, { status: 400 });
    }
    return NextResponse.json(
      { error: 'Failed to fetch application' },
      { status: 500 }
    );
  }
}

function getStatusMessage(status: string): string {
  switch (status) {
    case 'APPROVED':
      return 'Congratulations! Your application has been approved. You should receive an email with next steps.';
    case 'REJECTED':
      return 'Your application has been rejected. Please contact the company administrator if you have questions.';
    case 'PENDING':
      return 'Your application is currently under review. You will be notified once a decision has been made.';
    default:
      return 'Application status unknown.';
  }
}
