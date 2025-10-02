import { NextRequest, NextResponse } from 'next/server';
import { getVendorSession } from '@/core/auth/vendor-auth';
import { ObjectId } from 'mongodb';
import { getDb } from '@/shared/lib/data';

export async function GET(request: NextRequest) {
  try {
    const session = await getVendorSession();
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('Company info session:', { 
      id: session.id, 
      vendorId: session.vendorId, 
      companyId: session.companyId 
    });

    const db = await getDb();
    
    // Get vendor user using vendorId from session
    console.log('Looking for vendor user with vendorId:', session.vendorId);
    
    let vendorUser = await db.collection('vendor_users').findOne({
      vendorId: session.vendorId
    });

    // If not found by vendorId, try by _id
    if (!vendorUser) {
      console.log('Trying to find vendor user by session ID:', session.id);
      vendorUser = await db.collection('vendor_users').findOne({
        _id: new ObjectId(session.id)
      });
    }

    console.log('Vendor user found:', !!vendorUser);
    console.log('Vendor user details:', vendorUser ? {
      id: vendorUser._id.toString(),
      vendorId: vendorUser.vendorId,
      email: vendorUser.email
    } : 'No user found');

    if (!vendorUser) {
      // If vendor user doesn't exist, we can still get company info using session data
      console.log('No vendor user found, but we have session data. Proceeding with company lookup...');
    }

    // Get company information directly using the companyId from session
    const company = await db.collection('companies').findOne({
      _id: new ObjectId(session.companyId)
    });

    console.log('Company found:', !!company);

    if (!company) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 });
    }

    // Get vendor portal access settings for this vendor
    const portalAccess = company.vendorPortalAccess?.find(
      (access: any) => access.vendorId === session.vendorId
    );

    console.log('Portal access found:', !!portalAccess);
    console.log('Portal access features:', portalAccess?.features);

    const companyInfo = {
      name: company.name,
      industry: company.industry,
      address: company.address,
      features: portalAccess?.features || {
        viewInvoices: true,
        downloadInvoices: true,
        uploadInvoices: true,
        editProfile: true,
        viewContracts: true,
        createContracts: true,
        manageVendors: true,
        uploadDocuments: true
      }
    };

    return NextResponse.json(companyInfo);
  } catch (error) {
    console.error('Error fetching company info:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
