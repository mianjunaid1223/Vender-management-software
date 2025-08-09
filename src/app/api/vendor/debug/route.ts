import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/data';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const pin = searchParams.get('pin');
    const email = searchParams.get('email');

    const db = await getDb();
    
    // Check if vendor exists with this PIN
    const vendorByPin = await db.collection('vendors').findOne({ 
      vendorPin: pin?.toUpperCase()
    });
    
    // Check if vendor exists with this email
    const vendorByEmail = await db.collection('vendors').findOne({ 
      email: email?.toLowerCase()
    });
    
    // Check all vendors with status active
    const activeVendors = await db.collection('vendors').find({ 
      status: 'active' 
    }).toArray();

    return NextResponse.json({
      pin: pin,
      email: email,
      vendorByPin: vendorByPin ? {
        id: vendorByPin._id.toString(),
        name: vendorByPin.name,
        email: vendorByPin.email,
        pin: vendorByPin.vendorPin,
        status: vendorByPin.status
      } : null,
      vendorByEmail: vendorByEmail ? {
        id: vendorByEmail._id.toString(),
        name: vendorByEmail.name,
        email: vendorByEmail.email,
        pin: vendorByEmail.vendorPin,
        status: vendorByEmail.status
      } : null,
      totalActiveVendors: activeVendors.length,
      activeVendorEmails: activeVendors.map(v => v.email)
    });

  } catch (error) {
    return NextResponse.json({ 
      error: 'Database query failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
