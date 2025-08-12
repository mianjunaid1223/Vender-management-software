import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/database/mongodb';
import { vendorAuthMiddleware, createUnauthorizedResponse } from '@/lib/auth/vendor-auth';
import { ObjectId } from 'mongodb';

// GET /api/vendor/companies - Get companies where user is both vendor and registered user
export async function GET(request: NextRequest) {
  try {
    const authResult = await vendorAuthMiddleware(request);
    if (!authResult.isAuthenticated || !authResult.vendor) {
      return createUnauthorizedResponse(authResult.error);
    }

    const client = await clientPromise;
    if (!client) {
      return NextResponse.json({ 
        error: 'Database connection failed',
        code: 'DB_CONNECTION_FAILED'
      }, { status: 500 });
    }
    
    const db = client.db('vendorverse');
    
    // Find all companies where this user is a vendor
    const vendorEmail = authResult.vendor.email;
    
    // Find companies where user is a vendor
    const vendorCompanies = await db.collection('vendors').find({ 
      email: vendorEmail,
      status: { $regex: /^(active|approved)$/i }
    }).toArray();
    
    if (vendorCompanies.length === 0) {
      return NextResponse.json({ companies: [] });
    }

    // Get company details
    const companyIds = vendorCompanies
      .filter(v => v.companyId && ObjectId.isValid(v.companyId))
      .map(v => new ObjectId(v.companyId));
    const companies = await db.collection('companies').find({
      _id: { $in: companyIds }
    }).toArray();

    // Check if user is also a registered user in any companies
    const userCompanies = await db.collection('users').find({
      email: vendorEmail
    }).toArray();

    const userCompanyIds = userCompanies
      .filter(u => u.companyId && ObjectId.isValid(u.companyId))
      .map(u => new ObjectId(u.companyId));

    // Combine and format the response
    const result = companies.map(company => {
      const vendorInfo = vendorCompanies.find(v => v.companyId === company._id.toString());
      const isRegisteredUser = userCompanyIds.some(id => id.toString() === company._id.toString());
      
      return {
        id: company._id.toString(),
        name: company.name,
        isVendor: true,
        isRegisteredUser,
        vendorId: vendorInfo?._id.toString() || '',
        dashboardUrl: isRegisteredUser ? `/dashboard?company=${company._id}` : null
      };
    });

    return NextResponse.json({ 
      companies: result,
      totalCompanies: result.length,
      registeredUserCompanies: result.filter(c => c.isRegisteredUser).length
    });

  } catch (error) {
    console.error('Error fetching vendor companies:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch companies',
      code: 'FETCH_COMPANIES_FAILED'
    }, { status: 500 });
  }
}
