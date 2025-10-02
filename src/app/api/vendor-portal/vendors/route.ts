import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/shared/lib/data';
import { getVendorSession } from '@/core/auth/vendor-auth';
import { v4 as uuidv4 } from 'uuid';

const VALID_VENDOR_TYPES = ['supplier', 'partner', 'contractor', 'service_provider', 'consultant'] as const;
type VendorType = typeof VALID_VENDOR_TYPES[number];

export async function GET(request: NextRequest) {
  try {
    const session = await getVendorSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const companyId = session.companyId;
    const vendorId = session.vendorId;
    
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const search = searchParams.get('search');

    const db = await getDb();
    
    // Build query - scope to authenticated vendor only
    let query: any = { companyId, vendorId };
    
    if (status && status !== 'all') {
      query.status = status;
    }
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { type: { $regex: search, $options: 'i' } }
      ];
    }

    // Get vendors for this company
    const vendors = await db.collection('vendors').find(query).toArray();

    // Return real empty response when no vendors found
    if (vendors.length === 0) {
      return NextResponse.json({
        success: true,
        vendors: [],
        total: 0,
        message: 'No vendors found'
      });
    }

    return NextResponse.json({
      success: true,
      vendors,
      total: vendors.length
    });

  } catch (error) {
    console.error('Error fetching vendors:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getVendorSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const body = await request.json();
    const { name, type, contactEmail, contractValue, status = 'pending' } = body;

    // Enhanced input validation
    if (typeof name !== 'string' || !name.trim() || name.length > 255 ||
        typeof type !== 'string' || !type.trim() || type.length > 100 ||
        typeof contactEmail !== 'string' || contactEmail.length > 255 ||
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail)) {
      return NextResponse.json({ error: 'Invalid name, type, or email format' }, { status: 400 });
    }

    // Validate type enum
    if (!VALID_VENDOR_TYPES.includes(type.toLowerCase() as VendorType)) {
      return NextResponse.json({ error: 'Invalid vendor type' }, { status: 400 });
    }

    // Validate contract value
    const contractValueNum = contractValue == null ? 0 : Number(contractValue);
    if (!Number.isFinite(contractValueNum) || contractValueNum < 0) {
      return NextResponse.json({ error: 'Invalid contract value' }, { status: 400 });
    }

    const companyId = session.companyId;

    const db = await getDb();
    
    // Create new vendor
    const vendor = {
      vendorId: `vendor_${uuidv4()}`,
      companyId,
      name: name.trim(),
      type: type.toLowerCase(),
      contactEmail: contactEmail.toLowerCase(),
      contractValue: contractValueNum,
      status,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await db.collection('vendors').insertOne(vendor);

    return NextResponse.json({
      success: true,
      vendor: {
        ...vendor,
        _id: result.insertedId
      },
      message: 'Vendor created successfully'
    });

  } catch (error) {
    console.error('Vendor creation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
