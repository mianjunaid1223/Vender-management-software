import { NextResponse } from 'next/server';
import { getDb } from '@/lib/database/queries';
import { ObjectId } from 'mongodb';
import type { VendorApplication } from '@/lib/types';

// POST /api/vendor-applications - Submit a new vendor application
export async function POST(request: Request) {
  try {
    const db = await getDb();
    const body = await request.json();
    
    // Validate required fields
    const requiredFields = [
      'name', 'contactPerson', 'email', 'phone',
      'service', 'taxId', 'address', 'targetCompanyId'
    ];
    
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json(
          { error: `Missing required field: ${field}` },
          { status: 400 }
        );
      }
    }
    
    // Validate address structure
    const requiredAddressFields = ['street', 'city'];
    for (const field of requiredAddressFields) {
      if (!body.address[field]) {
        return NextResponse.json(
          { error: `Missing required address field: ${field}` },
          { status: 400 }
        );
      }
    }
    

    
    // Validate target company ID - it could be a string from the frontend
    let targetCompanyObjectId;
    try {
      targetCompanyObjectId = new ObjectId(body.targetCompanyId);
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid target company ID format' },
        { status: 400 }
      );
    }
    
    // Create vendor application record
    const vendorApplication = {
      ...body,
      status: 'pending',
      submittedAt: new Date(),
      targetCompanyId: targetCompanyObjectId,
      // Generate a unique application ID
      applicationId: `VA-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`
    };
    
    // Insert into database
    const result = await db.collection('vendorApplications').insertOne(vendorApplication);
    
    // Update the invite record if it exists (mark as used)
    if (body.inviteToken) {
      await db.collection('vendorInvites').updateOne(
        { 
          token: body.inviteToken,
          companyId: targetCompanyObjectId
        },
        { 
          $set: { 
            status: 'completed',
            usedAt: new Date(),
            vendorApplicationId: result.insertedId
          }
        }
      );
    }
    
    return NextResponse.json({
      success: true,
      applicationId: vendorApplication.applicationId,
      message: 'Vendor application submitted successfully'
    });
  } catch (error) {
    console.error('Error submitting vendor application:', error);
    return NextResponse.json(
      { error: 'Failed to submit vendor application' },
      { status: 500 }
    );
  }
}

// GET /api/vendor-applications?companyId=... - Get vendor applications for a company
export async function GET(request: Request) {
  try {
    const db = await getDb();
    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get('companyId');
    
    if (!companyId || !ObjectId.isValid(companyId)) {
      return NextResponse.json(
        { error: 'Valid company ID is required' },
        { status: 400 }
      );
    }
    
    const applications = await db.collection('vendorApplications')
      .find({ targetCompanyId: new ObjectId(companyId) })
      .sort({ submittedAt: -1 })
      .toArray();
    
    return NextResponse.json(applications);
  } catch (error) {
    console.error('Error fetching vendor applications:', error);
    return NextResponse.json(
      { error: 'Failed to fetch vendor applications' },
      { status: 500 }
    );
  }
}
