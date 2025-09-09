import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/data';

export async function GET(request: NextRequest) {
  try {
    // Get company ID from session/auth
    const companyId = request.headers.get('x-company-id') || 'comp_001'; // Fallback for demo
    
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const search = searchParams.get('search');

    const db = await getDb();
    
    // Build query
    let query: any = { companyId };
    
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

    // Sample vendors if none exist
    if (vendors.length === 0) {
      const sampleVendors = [
        {
          vendorId: 'vendor_001',
          companyId,
          name: 'TechCorp Solutions',
          type: 'Technology',
          status: 'active',
          contractValue: 150000,
          contactEmail: 'contact@techcorp.com',
          createdAt: new Date('2024-01-15'),
          lastContact: new Date('2024-12-01')
        },
        {
          vendorId: 'vendor_002',
          companyId,
          name: 'Green Energy Inc',
          type: 'Energy',
          status: 'active',
          contractValue: 75000,
          contactEmail: 'info@greenenergy.com',
          createdAt: new Date('2024-02-20'),
          lastContact: new Date('2024-11-28')
        },
        {
          vendorId: 'vendor_003',
          companyId,
          name: 'Office Supplies Ltd',
          type: 'Supplies',
          status: 'pending',
          contractValue: 25000,
          contactEmail: 'sales@officesupplies.com',
          createdAt: new Date('2024-11-15'),
          lastContact: new Date('2024-11-29')
        }
      ];
      
      return NextResponse.json({
        success: true,
        vendors: sampleVendors,
        total: sampleVendors.length,
        message: 'Sample vendor data'
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
    const body = await request.json();
    const { name, type, contactEmail, contractValue, status = 'pending' } = body;

    // Get company ID from session/auth
    const companyId = request.headers.get('x-company-id') || 'comp_001'; // Fallback for demo

    if (!name || !type || !contactEmail) {
      return NextResponse.json(
        { error: 'Name, type, and contact email are required' },
        { status: 400 }
      );
    }

    const db = await getDb();
    
    // Create new vendor
    const vendor = {
      vendorId: `vendor_${Date.now()}`,
      companyId,
      name,
      type,
      contactEmail,
      contractValue: contractValue || 0,
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
