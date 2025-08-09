import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/data';
import { ObjectId } from 'mongodb';
import { vendorAuthMiddleware, createUnauthorizedResponse } from '@/lib/vendor-auth-middleware';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ vendorId: string }> }
) {
  try {
    const { vendorId } = await params;
    
    if (!vendorId || !ObjectId.isValid(vendorId)) {
      return NextResponse.json(
        { error: 'Invalid vendor ID' },
        { status: 400 }
      );
    }

    // Authenticate vendor
    const authResult = await vendorAuthMiddleware(request);
    if (!authResult.isAuthenticated || !authResult.vendor) {
      return createUnauthorizedResponse(authResult.error);
    }

    // Ensure vendor can only access their own profile
    if (authResult.vendor.id !== vendorId) {
      return NextResponse.json(
        { error: 'Access denied. You can only view your own profile.' },
        { status: 403 }
      );
    }

    const db = await getDb();
    const vendor = await db.collection('vendors').findOne({
      _id: new ObjectId(vendorId)
    });

    if (!vendor) {
      return NextResponse.json(
        { error: 'Vendor not found' },
        { status: 404 }
      );
    }

    // Return vendor profile with all fields
    const profile = {
      id: vendor._id.toString(),
      name: vendor.name,
      email: vendor.email,
      phone: vendor.phone || '',
      address: vendor.address || '',
      city: vendor.city || '',
      state: vendor.state || '',
      zipCode: vendor.zipCode || '',
      country: vendor.country || '',
      website: vendor.website || '',
      description: vendor.description || '',
      taxId: vendor.taxId || '',
      businessType: vendor.businessType || '',
      contactPerson: vendor.contactPerson || vendor.name,
      createdAt: vendor.createdAt,
      status: vendor.status
    };

    return NextResponse.json({ profile });
  } catch (error) {
    console.error('Error fetching vendor profile:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ vendorId: string }> }
) {
  try {
    const { vendorId } = await params;
    
    if (!vendorId || !ObjectId.isValid(vendorId)) {
      return NextResponse.json(
        { error: 'Invalid vendor ID' },
        { status: 400 }
      );
    }

    // Authenticate vendor
    const authResult = await vendorAuthMiddleware(request);
    if (!authResult.isAuthenticated || !authResult.vendor) {
      return createUnauthorizedResponse(authResult.error);
    }

    // Ensure vendor can only update their own profile
    if (authResult.vendor.id !== vendorId) {
      return NextResponse.json(
        { error: 'Access denied. You can only update your own profile.' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      name,
      email,
      phone,
      address,
      city,
      state,
      zipCode,
      country,
      website,
      description,
      taxId,
      businessType,
      contactPerson
    } = body;

    const db = await getDb();
    
    // Check if vendor exists
    const existingVendor = await db.collection('vendors').findOne({
      _id: new ObjectId(vendorId)
    });

    if (!existingVendor) {
      return NextResponse.json(
        { error: 'Vendor not found' },
        { status: 404 }
      );
    }

    // Update vendor profile
    const updateData = {
      ...(name && { name }),
      ...(email && { email }),
      ...(phone !== undefined && { phone }),
      ...(address !== undefined && { address }),
      ...(city !== undefined && { city }),
      ...(state !== undefined && { state }),
      ...(zipCode !== undefined && { zipCode }),
      ...(country !== undefined && { country }),
      ...(website !== undefined && { website }),
      ...(description !== undefined && { description }),
      ...(taxId !== undefined && { taxId }),
      ...(businessType !== undefined && { businessType }),
      ...(contactPerson !== undefined && { contactPerson }),
      updatedAt: new Date()
    };

    const result = await db.collection('vendors').updateOne(
      { _id: new ObjectId(vendorId) },
      { $set: updateData }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { error: 'Vendor not found' },
        { status: 404 }
      );
    }

    // Fetch updated vendor
    const updatedVendor = await db.collection('vendors').findOne({
      _id: new ObjectId(vendorId)
    });

    const profile = {
      id: updatedVendor!._id.toString(),
      name: updatedVendor!.name,
      email: updatedVendor!.email,
      phone: updatedVendor!.phone || '',
      address: updatedVendor!.address || '',
      city: updatedVendor!.city || '',
      state: updatedVendor!.state || '',
      zipCode: updatedVendor!.zipCode || '',
      country: updatedVendor!.country || '',
      website: updatedVendor!.website || '',
      description: updatedVendor!.description || '',
      taxId: updatedVendor!.taxId || '',
      businessType: updatedVendor!.businessType || '',
      contactPerson: updatedVendor!.contactPerson || updatedVendor!.name,
      createdAt: updatedVendor!.createdAt,
      status: updatedVendor!.status
    };

    return NextResponse.json({ profile });
    return NextResponse.json({ profile });
  } catch (error) {
    console.error('Error updating vendor profile:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
