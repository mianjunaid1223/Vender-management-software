import { NextRequest, NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import { getDb } from '@/lib/data';

export async function POST(request: NextRequest) {
  try {
    const { vendorId, companyId } = await request.json();

    if (!vendorId || !companyId) {
      return NextResponse.json(
        { error: 'vendorId and companyId are required' },
        { status: 400 }
      );
    }

    const db = await getDb();

    console.log('Adding portal access for vendor:', vendorId);
    console.log('Company ID:', companyId);

    // Check if company exists
    const company = await db.collection('companies').findOne({
      _id: new ObjectId(companyId)
    });

    if (!company) {
      return NextResponse.json(
        { error: 'Company not found' },
        { status: 404 }
      );
    }

    // Initialize vendorPortalAccess array if it doesn't exist
    if (!company.vendorPortalAccess) {
      await db.collection('companies').updateOne(
        { _id: new ObjectId(companyId) },
        { $set: { vendorPortalAccess: [] } }
      );
    }

    // Check if portal access already exists
    const existingAccessIndex = company.vendorPortalAccess?.findIndex(
      (access: any) => access.vendorId === vendorId
    ) ?? -1;

    if (existingAccessIndex >= 0) {
      console.log('Portal access already exists. Updating...');
      
      // Update existing access
      await db.collection('companies').updateOne(
        { _id: new ObjectId(companyId) },
        {
          $set: {
            [`vendorPortalAccess.${existingAccessIndex}.enabled`]: true,
            [`vendorPortalAccess.${existingAccessIndex}.features`]: {
              viewInvoices: true,
              downloadInvoices: true,
              updatePaymentInfo: true,
              viewContracts: true,
              communicateWithBuyer: true,
              viewComplianceRequirements: true,
              uploadDocuments: true
            },
            [`vendorPortalAccess.${existingAccessIndex}.updatedAt`]: new Date().toISOString()
          }
        }
      );
    } else {
      console.log('Creating new portal access...');
      
      // Add new portal access
      const newAccess = {
        vendorId,
        enabled: true,
        features: {
          viewInvoices: true,
          downloadInvoices: true,
          updatePaymentInfo: true,
          viewContracts: true,
          communicateWithBuyer: true,
          viewComplianceRequirements: true,
          uploadDocuments: true
        },
        sessionTimeout: 8,
        requireMFA: false,
        allowedIPs: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      await db.collection('companies').updateOne(
        { _id: new ObjectId(companyId) },
        { $addToSet: { vendorPortalAccess: newAccess } }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Portal access configured successfully'
    });

  } catch (error) {
    console.error('Error adding portal access:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
