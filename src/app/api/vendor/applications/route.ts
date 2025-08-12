import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/database/queries';
import { getSession } from '@/lib/auth';
import { ObjectId } from 'mongodb';

// POST - Submit vendor application
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      vendorName,
      companyId,
      inviteId,
      contactPerson,
      email,
      phone,
      service,
      taxId,
      address,
      paymentTerms,
      notes
    } = body;

    // Validate required fields
    if (!vendorName || !companyId || !contactPerson || !email || !phone || !service) {
      return NextResponse.json({ 
        error: 'Missing required fields' 
      }, { status: 400 });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ 
        error: 'Invalid email format' 
      }, { status: 400 });
    }

    const db = await getDb();

    // Verify the company exists
    const company = await db.collection('companies').findOne({ companyId });
    if (!company) {
      return NextResponse.json({ 
        error: 'Invalid company' 
      }, { status: 400 });
    }

    // If inviteId provided, verify the invite exists (allow expired invites if no active applications)
    let validInvite = null;
    if (inviteId) {
      validInvite = await db.collection('vendorInvites').findOne({ 
        _id: new ObjectId(inviteId)
      });
      
      if (!validInvite) {
        return NextResponse.json({ 
          error: 'Invalid invitation ID' 
        }, { status: 400 });
      }
      
      // Check if invite is active
      if (validInvite.status !== 'active') {
        // Allow expired invites only if they haven't been used and there are no active applications
        if (validInvite.used) {
          return NextResponse.json({ 
            error: 'Invitation has already been used' 
          }, { status: 400 });
        }
        
        console.log(`Using ${validInvite.status} invite ${inviteId} - will validate application eligibility`);
      }
    }

    // Check for existing active application for the same company
    const existingApplication = await db.collection('vendorApplications').findOne({
      $or: [
        { email, targetCompanyId: companyId },
        { vendorName, targetCompanyId: companyId }
      ],
      status: { $in: ['pending', 'approved'] } // Only block if there's an active application
    });

    if (existingApplication) {
      const statusMessage = existingApplication.status === 'pending' 
        ? `A pending application already exists for this vendor/email and company (${company.name})`
        : `An approved vendor already exists for this email and company (${company.name})`;
      
      return NextResponse.json({ 
        error: statusMessage,
        existingApplication: {
          applicationId: existingApplication.applicationId,
          status: existingApplication.status,
          submittedAt: existingApplication.submittedAt,
          companyName: company.name
        }
      }, { status: 400 });
    }

    // Check if there are any previous applications (for logging and context)
    const previousApplications = await db.collection('vendorApplications').find({
      $or: [
        { email, targetCompanyId: companyId },
        { vendorName, targetCompanyId: companyId }
      ]
    }).toArray();

    if (previousApplications.length > 0) {
      console.log(`Found ${previousApplications.length} previous application(s) for this vendor/email and company (${company.name}):`, 
        previousApplications.map(app => ({ 
          status: app.status, 
          submittedAt: app.submittedAt,
          applicationId: app.applicationId 
        }))
      );
    }

    // Generate application ID
    const applicationId = `VA-${Date.now().toString(36).toUpperCase()}`;

    // Create application
    const application = {
      _id: new ObjectId(),
      applicationId,
      vendorName,
      name: vendorName, // For compatibility
      contactPerson,
      email,
      phone,
      service,
      taxId: taxId || null,
      address: address || {},
      paymentTerms: paymentTerms || 'Net 30',
      notes: notes || '',
      targetCompanyId: companyId,
      status: 'pending',
      submittedAt: new Date(),
      reviewedAt: null,
      reviewedBy: null,
      inviteId: inviteId || null
    };

    const result = await db.collection('vendorApplications').insertOne(application);

    // Only NOW mark the invite as used (after successful application creation)
    if (inviteId && validInvite) {
      await db.collection('vendorInvites').updateOne(
        { _id: new ObjectId(inviteId) },
        { 
          $set: { 
            used: true, 
            usedAt: new Date(),
            status: 'completed'
          } 
        }
      );
    }

    return NextResponse.json({
      success: true,
      applicationId,
      id: result.insertedId.toString(),
      message: 'Application submitted successfully'
    });

  } catch (error) {
    console.error('Error submitting vendor application:', error);
    return NextResponse.json({ 
      error: 'Failed to submit application' 
    }, { status: 500 });
  }
}

// GET - Fetch vendor applications (admin only)
export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const db = await getDb();
    const applications = await db.collection('vendorApplications')
      .find({ targetCompanyId: session.companyId })
      .sort({ submittedAt: -1 })
      .toArray();

    const processedApplications = applications.map(app => ({
      id: app._id.toString(),
      applicationId: app.applicationId,
      vendorName: app.vendorName,
      name: app.name || app.vendorName,
      contactPerson: app.contactPerson,
      email: app.email,
      phone: app.phone,
      service: app.service,
      taxId: app.taxId,
      address: app.address,
      paymentTerms: app.paymentTerms,
      notes: app.notes,
      status: app.status,
      submittedAt: app.submittedAt,
      reviewedAt: app.reviewedAt,
      reviewedBy: app.reviewedBy
    }));

    return NextResponse.json({
      success: true,
      applications: processedApplications
    });

  } catch (error) {
    console.error('Error fetching vendor applications:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch applications' 
    }, { status: 500 });
  }
}
