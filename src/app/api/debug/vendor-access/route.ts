import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/data';
import { ObjectId } from 'mongodb';

export async function GET(request: NextRequest) {
  try {
    const db = await getDb();
    
    // Get the company
    const company = await db.collection('companies').findOne({
      _id: new ObjectId('68bdcf5b3659db777e755f44')
    });

    // Get all vendor users 
    const vendorUsers = await db.collection('vendor_users').find({}).toArray();

    // Get all vendors
    const vendors = await db.collection('vendors').find({}).toArray();

    return NextResponse.json({
      companyName: company?.name || 'Company not found',
      vendorPortalAccess: company?.vendorPortalAccess || [],
      totalAccessEntries: company?.vendorPortalAccess?.length || 0,
      vendorUsers: vendorUsers.map(u => ({
        id: u._id.toString(),
        vendorId: u.vendorId,
        email: u.email,
        companyId: u.companyId
      })),
      vendors: vendors.map(v => ({
        id: v._id.toString(),
        vendorId: v.vendorId || 'No vendorId field',
        name: v.name,
        email: v.email,
        companyId: v.companyId
      })),
      sessionInfo: {
        id: '68bddb00268cb3a8a06cec5f',
        vendorId: '68bdd771268cb3a8a06cec58',
        companyId: '68bdcf5b3659db777e755f44'
      }
    });

  } catch (error) {
    console.error('Debug error:', error);
    return NextResponse.json({ error: 'Debug failed' }, { status: 500 });
  }
}
