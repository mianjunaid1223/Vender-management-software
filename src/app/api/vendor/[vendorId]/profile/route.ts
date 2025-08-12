import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/database/queries';
import { ObjectId } from 'mongodb';
import { vendorAuthMiddleware } from '@/lib/auth/vendor-auth';
import { getSession } from '@/lib/auth';

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

    // Check authentication - dual mode support
    let isAuthorized = false;
    const isDashboardAuth = request.headers.get('X-Dashboard-Auth') === 'true';
    
    if (isDashboardAuth) {
      // For company dashboard access, verify user session and email match
      const userSession = await getSession();
      if (userSession && userSession.email === vendor.email) {
        isAuthorized = true;
      }
    } else {
      // Regular vendor token authentication
      const authResult = await vendorAuthMiddleware(request);
      if (authResult.isAuthenticated && authResult.vendor && authResult.vendor.id === vendorId) {
        isAuthorized = true;
      }
    }

    if (!isAuthorized) {
      return NextResponse.json(
        { error: 'Access denied. You can only view your own profile.' },
        { status: 403 }
      );
    }

    // Return vendor profile with all fields matching actual schema
    const profile = {
      _id: vendor._id.toString(),
      name: vendor.name,
      contactPerson: vendor.contactPerson,
      email: vendor.email,
      phone: vendor.phone || '',
      service: vendor.service || '',
      taxId: vendor.taxId || '',
      address: {
        street: vendor.address?.street || '',
        city: vendor.address?.city || '',
        state: vendor.address?.state || '',
        zipCode: vendor.address?.zipCode || '',
        country: vendor.address?.country || ''
      },
      paymentTerms: vendor.paymentTerms || '',
      notes: vendor.notes || '',
      status: vendor.status,
      createdAt: vendor.createdAt,
      updatedAt: vendor.updatedAt
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

    // Check authentication - dual mode support
    let isAuthorized = false;
    const isDashboardAuth = request.headers.get('X-Dashboard-Auth') === 'true';
    
    if (isDashboardAuth) {
      // For company dashboard access, verify user session and email match
      const userSession = await getSession();
      if (userSession && userSession.email === vendor.email) {
        isAuthorized = true;
      }
    } else {
      // Regular vendor token authentication
      const authResult = await vendorAuthMiddleware(request);
      if (authResult.isAuthenticated && authResult.vendor && authResult.vendor.id === vendorId) {
        isAuthorized = true;
      }
    }

    if (!isAuthorized) {
      return NextResponse.json(
        { error: 'Access denied. You can only update your own profile.' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      name,
      contactPerson,
      email,
      phone,
      service,
      taxId,
      address,
      paymentTerms,
      notes
    } = body;

    // Use the existing db connection from the earlier vendor lookup
    
    // Update vendor profile matching your actual schema
    const updateData: any = {
      ...(name && { name }),
      ...(contactPerson && { contactPerson }),
      ...(email && { email }),
      ...(phone !== undefined && { phone }),
      ...(service !== undefined && { service }),
      ...(taxId !== undefined && { taxId }),
      ...(paymentTerms !== undefined && { paymentTerms }),
      ...(notes !== undefined && { notes }),
      updatedAt: new Date()
    };

    // Handle nested address object
    if (address) {
      updateData.address = {};
      if (address.street !== undefined) updateData.address.street = address.street;
      if (address.city !== undefined) updateData.address.city = address.city;
      if (address.state !== undefined) updateData.address.state = address.state;
      if (address.zipCode !== undefined) updateData.address.zipCode = address.zipCode;
      if (address.country !== undefined) updateData.address.country = address.country;
    }

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
      _id: updatedVendor!._id.toString(),
      name: updatedVendor!.name,
      contactPerson: updatedVendor!.contactPerson,
      email: updatedVendor!.email,
      phone: updatedVendor!.phone || '',
      service: updatedVendor!.service || '',
      taxId: updatedVendor!.taxId || '',
      address: {
        street: updatedVendor!.address?.street || '',
        city: updatedVendor!.address?.city || '',
        state: updatedVendor!.address?.state || '',
        zipCode: updatedVendor!.address?.zipCode || '',
        country: updatedVendor!.address?.country || ''
      },
      paymentTerms: updatedVendor!.paymentTerms || '',
      notes: updatedVendor!.notes || '',
      status: updatedVendor!.status,
      createdAt: updatedVendor!.createdAt,
      updatedAt: updatedVendor!.updatedAt
    };

    return NextResponse.json({ profile });
  } catch (error) {
    console.error('Error updating vendor profile:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
