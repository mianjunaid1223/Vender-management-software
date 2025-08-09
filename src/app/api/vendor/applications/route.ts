import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/data';
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

    const db = await getDb();

    // Verify the company exists
    const company = await db.collection('companies').findOne({ companyId });
    if (!company) {
      return NextResponse.json({ 
        error: 'Invalid company' 
      }, { status: 400 });
    }

    // If inviteId provided, verify the invite is valid (but don't mark as used yet)
    let validInvite = null;
    if (inviteId) {
      validInvite = await db.collection('vendorInvites').findOne({ 
        _id: new ObjectId(inviteId),
        status: 'active' 
      });
      
      if (!validInvite) {
        return NextResponse.json({ 
          error: 'Invalid or expired invitation' 
        }, { status: 400 });
      }
    }

    // Check for existing application (do this BEFORE marking invite as used)
    const existingApplication = await db.collection('vendorApplications').findOne({
      $or: [
        { email, targetCompanyId: companyId },
        { vendorName, targetCompanyId: companyId }
      ]
    });

    if (existingApplication) {
      return NextResponse.json({ 
        error: 'Application already exists for this vendor/email and company' 
      }, { status: 400 });
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
