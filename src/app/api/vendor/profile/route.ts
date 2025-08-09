import { NextRequest, NextResponse } from 'next/server';
import { vendorAuthMiddleware, createUnauthorizedResponse } from '@/lib/vendor-auth-middleware';
import { getDb } from '@/lib/data';
import { ObjectId } from 'mongodb';

// GET /api/vendor/profile - Get current authenticated vendor's profile
export async function GET(request: NextRequest) {
  try {
    // Authenticate vendor
    const authResult = await vendorAuthMiddleware(request);
    if (!authResult.isAuthenticated || !authResult.vendor) {
      return createUnauthorizedResponse(authResult.error);
    }

    const db = await getDb();
    
    // Get full vendor profile
    const vendor = await db.collection('vendors').findOne({ 
      _id: new ObjectId(authResult.vendor.id),
      status: 'active'
    });

    if (!vendor) {
      return NextResponse.json({ 
        error: 'Vendor profile not found',
        code: 'VENDOR_NOT_FOUND'
      }, { status: 404 });
    }

    // Get company information
    const company = await db.collection('companies').findOne({ 
      _id: new ObjectId(vendor.companyId) 
    });

    // Return vendor profile data
    return NextResponse.json({
      success: true,
      vendor: {
        id: vendor._id.toString(),
        name: vendor.name,
        email: vendor.email,
        contactPerson: vendor.contactPerson,
        phone: vendor.phone,
        service: vendor.service,
        address: vendor.address,
        taxId: vendor.taxId,
        paymentTerms: vendor.paymentTerms,
        status: vendor.status,
        companyId: vendor.companyId.toString(),
        applicationId: vendor.applicationId,
        vendorPin: vendor.vendorPin,
        lastLogin: vendor.lastLogin,
        company: company ? {
          id: company._id.toString(),
          name: company.name
        } : null
      }
    });

  } catch (error) {
    console.error('Error fetching vendor profile:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch vendor profile',
      code: 'INTERNAL_ERROR'
    }, { status: 500 });
  }
}

// PATCH /api/vendor/profile - Update current authenticated vendor's profile
export async function PATCH(request: NextRequest) {
  try {
    // Authenticate vendor
    const authResult = await vendorAuthMiddleware(request);
    if (!authResult.isAuthenticated || !authResult.vendor) {
      return createUnauthorizedResponse(authResult.error);
    }

    const updateData = await request.json();
    
    // Validate update data (only allow certain fields to be updated)
    const allowedFields = [
      'contactPerson', 'phone', 'address', 'paymentTerms', 'notes'
    ];
    
    const sanitizedUpdate: any = {};
    for (const field of allowedFields) {
      if (updateData[field] !== undefined) {
        sanitizedUpdate[field] = updateData[field];
      }
    }

    if (Object.keys(sanitizedUpdate).length === 0) {
      return NextResponse.json({ 
        error: 'No valid fields provided for update',
        code: 'NO_VALID_FIELDS'
      }, { status: 400 });
    }

    sanitizedUpdate.updatedAt = new Date();

    const db = await getDb();
    
    // Update vendor profile
    const result = await db.collection('vendors').updateOne(
      { 
        _id: new ObjectId(authResult.vendor.id),
        status: 'active'
      },
      { $set: sanitizedUpdate }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json({ 
        error: 'Vendor not found or inactive',
        code: 'VENDOR_NOT_FOUND'
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: 'Profile updated successfully',
      updatedFields: Object.keys(sanitizedUpdate)
    });

  } catch (error) {
    console.error('Error updating vendor profile:', error);
    return NextResponse.json({ 
      error: 'Failed to update vendor profile',
      code: 'INTERNAL_ERROR'
    }, { status: 500 });
  }
}
