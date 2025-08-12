import { NextRequest, NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import clientPromise from '@/lib/database/mongodb';
import { vendorAuthMiddleware } from '@/lib/auth/vendor-auth';
import { getSession } from '@/lib/auth';

// GET /api/vendor/company-profile/[companyId] - Get company profile information for vendors
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ companyId: string }> }
) {
  try {
    const { companyId } = await params;

    if (!companyId) {
      return NextResponse.json({ 
        error: 'Company ID is required',
        code: 'COMPANY_ID_REQUIRED'
      }, { status: 400 });
    }

    // Validate ObjectId format
    if (!ObjectId.isValid(companyId)) {
      return NextResponse.json({ 
        error: 'Invalid company ID format',
        code: 'INVALID_COMPANY_ID'
      }, { status: 400 });
    }

    const client = await clientPromise;
    if (!client) {
      return NextResponse.json({ 
        error: 'Database connection failed',
        code: 'DB_CONNECTION_FAILED'
      }, { status: 500 });
    }
    
    const db = client.db('vendorverse');

    // Check authentication - either vendor token or user session
    let authorizedVendor = null;
    const isDashboardAuth = request.headers.get('X-Dashboard-Auth') === 'true';
    
    if (isDashboardAuth) {
      // For company dashboard access, verify user session
      const userSession = await getSession();
      if (userSession) {
        // Find vendor record with matching email and company
        authorizedVendor = await db.collection('vendors').findOne({
          email: userSession.email,
          companyId: companyId,
          status: { $regex: /^(active|approved)$/i }
        });
      }
    } else {
      // Regular vendor token authentication
      const authResult = await vendorAuthMiddleware(request);
      if (authResult.isAuthenticated && authResult.vendor) {
        // Verify vendor has access to this company
        const vendorId = new ObjectId(authResult.vendor.id);
        authorizedVendor = await db.collection('vendors').findOne({
          _id: vendorId,
          companyId: companyId,
          status: { $regex: /^(active|approved)$/i }
        });
      }
    }

    if (!authorizedVendor) {
      return NextResponse.json({ 
        error: 'Access denied. You are not authorized to view this company profile.',
        code: 'ACCESS_DENIED'
      }, { status: 403 });
    }

    if (!authorizedVendor) {
      return NextResponse.json({ 
        error: 'Access denied. You are not associated with this company.',
        code: 'ACCESS_DENIED'
      }, { status: 403 });
    }

    // Get company information
    const company = await db.collection('companies').findOne({ 
      _id: new ObjectId(companyId) 
    });

    if (!company) {
      return NextResponse.json({ 
        error: 'Company not found',
        code: 'COMPANY_NOT_FOUND'
      }, { status: 404 });
    }

    // Get company users (optional - only show if vendor is also a registered user)
    let users: any[] = [];
    const userCompany = await db.collection('users').findOne({
      email: authorizedVendor.email,
      companyId: companyId
    });

    if (userCompany) {
      users = await db.collection('users').find({ 
        companyId: companyId 
      }).project({
        _id: 1,
        name: 1,
        email: 1,
        role: 1,
        createdAt: 1
      }).toArray();
    }

    // Get company statistics
    const [
      totalVendors,
      totalContracts,
      totalInvoices,
      activeContracts
    ] = await Promise.all([
      db.collection('vendors').countDocuments({ companyId: companyId }),
      db.collection('contracts').countDocuments({ companyId: companyId }),
      db.collection('invoices').countDocuments({ companyId: companyId }),
      db.collection('contracts').countDocuments({ 
        companyId: companyId,
        status: 'active'
      })
    ]);

    const companyProfile = {
      company: {
        id: company._id.toString(),
        name: company.name,
        email: company.email,
        address: company.address || null,
        phone: company.phone || null,
        website: company.website || null,
        industry: company.industry || null,
        description: company.description || null,
        createdAt: company.createdAt,
        updatedAt: company.updatedAt
      },
      statistics: {
        totalVendors,
        totalContracts,
        activeContracts,
        totalInvoices
      },
      users: users.map(user => ({
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
        joinedAt: user.createdAt
      })),
      vendorAccess: {
        isRegisteredUser: !!userCompany,
        vendorSince: authorizedVendor.createdAt,
        vendorStatus: authorizedVendor.status
      }
    };

    return NextResponse.json(companyProfile);

  } catch (error) {
    console.error('Error fetching company profile:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch company profile',
      code: 'FETCH_COMPANY_PROFILE_FAILED'
    }, { status: 500 });
  }
}
