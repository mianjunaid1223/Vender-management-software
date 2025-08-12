import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import clientPromise from '@/lib/database/mongodb';
import { ObjectId } from 'mongodb';

// GET /api/user/vendor-companies - Get all companies where current user is a vendor
export async function GET(request: NextRequest) {
  try {
    // Get current user session
    const user = await getSession();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const client = await clientPromise;
    if (!client) {
      return NextResponse.json({ error: 'Database connection failed' }, { status: 500 });
    }
    
    const db = client.db('vendorverse');

    // Find all vendors where current user email matches
    const vendors = await db.collection('vendors').find({ 
      email: user.email,
      status: { $in: ['approved', 'active'] } // Only show active vendor relationships
    }).toArray();

    if (!vendors || vendors.length === 0) {
      return NextResponse.json({ vendorCompanies: [] });
    }

    // Get company details for each vendor relationship
    const companyIds = vendors.map(vendor => new ObjectId(vendor.companyId));
    const companies = await db.collection('companies').find({
      _id: { $in: companyIds }
    }).toArray();

    // Map vendors to their companies with additional vendor info
    const vendorCompanies = vendors.map(vendor => {
      const company = companies.find(c => c._id.toString() === vendor.companyId.toString());
      
      return {
        vendorId: vendor._id.toString(),
        vendorName: vendor.name,
        vendorPin: vendor.pin,
        company: {
          id: company?._id.toString(),
          name: company?.name,
          logo: company?.logo,
          industry: company?.industry
        },
        joinedDate: vendor.createdAt,
        status: vendor.status
      };
    });

    return NextResponse.json({ 
      vendorCompanies: vendorCompanies.filter(vc => vc.company.id) // Filter out any without company
    });

  } catch (error) {
    console.error('Error fetching user vendor companies:', error);
    return NextResponse.json(
      { error: 'Failed to fetch vendor companies' }, 
      { status: 500 }
    );
  }
}
