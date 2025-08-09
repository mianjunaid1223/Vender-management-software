import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/data';
import { getSession } from '@/lib/auth';
import { ObjectId } from 'mongodb';
import { sendVendorApprovalEmail, sendVendorRejectionEmail } from '@/lib/email';

// PATCH - Update vendor application status (approve/reject)
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession();
    if (!session?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { status, notes } = await request.json();
    const resolvedParams = await params;
    const applicationId = resolvedParams.id;

    if (!status || !['approved', 'rejected'].includes(status)) {
      return NextResponse.json({ 
        error: 'Invalid status. Must be "approved" or "rejected"' 
      }, { status: 400 });
    }

    const db = await getDb();

    // Find the application
    const application = await db.collection('vendorApplications').findOne({
      _id: new ObjectId(applicationId),
      targetCompanyId: session.companyId // companyId is a string
    });

    if (!application) {
      return NextResponse.json({ 
        error: 'Application not found' 
      }, { status: 404 });
    }

    if (application.status !== 'pending') {
      return NextResponse.json({ 
        error: 'Application has already been reviewed' 
      }, { status: 400 });
    }

    // Update application status
    const updateResult = await db.collection('vendorApplications').updateOne(
      { _id: new ObjectId(applicationId) },
      {
        $set: {
          status,
          reviewedAt: new Date(),
          reviewedBy: session.email || 'admin',
          reviewNotes: notes || ''
        }
      }
    );

    if (updateResult.matchedCount === 0) {
      return NextResponse.json({ 
        error: 'Failed to update application' 
      }, { status: 500 });
    }

    // Get company info for email
    const company = await db.collection('companies').findOne({ 
      companyId: session.companyId 
    });

    if (!company) {
      return NextResponse.json({ 
        error: 'Company not found' 
      }, { status: 404 });
    }

    // Send email notification
    try {
      if (status === 'approved') {
        // For approved applications, generate a secure login PIN and create vendor account
        const vendorPin = Math.random().toString(36).substr(2, 8).toUpperCase();
        const dashboardUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:9002'}/vendor-portal/dashboard`;

        // Create vendor record in the system
        await db.collection('vendors').insertOne({
          _id: new ObjectId(),
          companyId: session.companyId,
          name: application.vendorName,
          contactPerson: application.contactPerson,
          email: application.email,
          phone: application.phone,
          service: application.service,
          taxId: application.taxId,
          address: application.address,
          paymentTerms: application.paymentTerms,
          notes: application.notes,
          status: 'active',
          createdAt: new Date(),
          updatedAt: new Date(),
          applicationId: application.applicationId,
          vendorPin: vendorPin // Store the PIN for login
        });

        console.log('📧 Sending approval email to:', application.email);
        await sendVendorApprovalEmail(
          application.email,
          application.vendorName,
          `${dashboardUrl}?pin=${vendorPin}`,
          vendorPin
        );
      } else {
        console.log('📧 Sending rejection email to:', application.email);
        await sendVendorRejectionEmail(
          application.email,
          application.vendorName,
          company.name,
          notes || 'Your application did not meet our current requirements.'
        );
      }
    } catch (emailError) {
      console.error('Email sending failed:', emailError);
      // Don't fail the whole operation if email fails
    }

    return NextResponse.json({
      success: true,
      message: `Application ${status} successfully`,
      application: {
        id: application._id.toString(),
        status,
        reviewedAt: new Date(),
        vendorName: application.vendorName
      }
    });

  } catch (error) {
    console.error('Error updating vendor application:', error);
    return NextResponse.json({ 
      error: 'Failed to update application' 
    }, { status: 500 });
  }
}

// GET - Get specific vendor application
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession();
    if (!session?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const resolvedParams = await params;
    const applicationId = resolvedParams.id;
    const db = await getDb();

    const application = await db.collection('vendorApplications').findOne({
      _id: new ObjectId(applicationId),
      targetCompanyId: session.companyId
    });

    if (!application) {
      return NextResponse.json({ 
        error: 'Application not found' 
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      application: {
        id: application._id.toString(),
        applicationId: application.applicationId,
        vendorName: application.vendorName,
        contactPerson: application.contactPerson,
        email: application.email,
        phone: application.phone,
        service: application.service,
        taxId: application.taxId,
        address: application.address,
        paymentTerms: application.paymentTerms,
        notes: application.notes,
        status: application.status,
        submittedAt: application.submittedAt,
        reviewedAt: application.reviewedAt,
        reviewedBy: application.reviewedBy,
        reviewNotes: application.reviewNotes
      }
    });

  } catch (error) {
    console.error('Error fetching vendor application:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch application' 
    }, { status: 500 });
  }
}