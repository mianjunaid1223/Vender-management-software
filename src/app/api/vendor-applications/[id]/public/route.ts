import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/database/queries';
import { ObjectId } from 'mongodb';

// GET /api/vendor-applications/[id]/public - Public view of vendor application (no auth required)
export async function GET(
  request: NextRequest,
  context: any
) {
  const { params } = context;
  const id = params?.id;
  
  try {
    const db = await getDb();

    // Validate application ID
    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: 'Invalid application ID' },
        { status: 400 }
      );
    }

    // Find the application
    const application = await db.collection('vendorApplications').findOne({
      _id: new ObjectId(id)
    });

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
      vendorName: application.name,
      message: getStatusMessage(application.status)
    };

    return NextResponse.json(publicData);
  } catch (error) {
    console.error('Error fetching vendor application:', error);
    return NextResponse.json(
      { error: 'Failed to fetch application' },
      { status: 500 }
    );
  }
}

function getStatusMessage(status: string): string {
  switch (status) {
    case 'approved':
      return 'Congratulations! Your application has been approved. You should receive an email with next steps.';
    case 'rejected':
      return 'Your application has been rejected. Please contact the company administrator if you have questions.';
    case 'pending':
      return 'Your application is currently under review. You will be notified once a decision has been made.';
    default:
      return 'Application status unknown.';
  }
}
