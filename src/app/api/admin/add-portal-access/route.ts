import { NextRequest, NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import { getDb } from '@/shared/lib/data';

export async function POST(request: NextRequest) {
  try {
    const { vendorId, companyId } = await request.json();

    if (!vendorId || !companyId) {
      return NextResponse.json(
        { error: 'vendorId and companyId are required' },
        { status: 400 }
      );
    }

    // Validate vendorId format
    if (typeof vendorId !== 'string' || !vendorId.trim()) {
      return NextResponse.json(
        { error: 'Invalid vendorId format' },
        { status: 400 }
      );
    }

    // Validate companyId is a valid ObjectId string
    if (!ObjectId.isValid(companyId)) {
      return NextResponse.json(
        { error: 'Invalid companyId format' },
        { status: 400 }
      );
    }

    const db = await getDb();

    console.log('Adding portal access for vendor:', vendorId);
    console.log('Company ID:', companyId);

    // Define default feature set for reuse
    const defaultFeatures = {
      viewInvoices: true,
      downloadInvoices: true,
      updatePaymentInfo: true,
      viewContracts: true,
      communicateWithBuyer: true,
      viewComplianceRequirements: true,
      uploadDocuments: true
    };

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

    // Atomically initialize vendorPortalAccess array if it doesn't exist
    await db.collection('companies').updateOne(
      { 
        _id: new ObjectId(companyId),
        vendorPortalAccess: { $exists: false }
      },
      { $set: { vendorPortalAccess: [] } }
    );

    const now = new Date().toISOString();

    // Try to update existing access first using positional operator
    const updateResult = await db.collection('companies').updateOne(
      { 
        _id: new ObjectId(companyId),
        'vendorPortalAccess.vendorId': vendorId
      },
      {
        $set: {
          'vendorPortalAccess.$.enabled': true,
          'vendorPortalAccess.$.features': defaultFeatures,
          'vendorPortalAccess.$.updatedAt': now
        }
      }
    );

    // If no existing access was updated, add new one
    if (updateResult.matchedCount === 0) {
      console.log('Creating new portal access...');
      
      const newAccess = {
        vendorId,
        enabled: true,
        features: defaultFeatures,
        sessionTimeout: 480, // 8 hours in minutes
        requireMFA: false,
        allowedIPs: [],
        createdAt: now,
        updatedAt: now
      };

      await db.collection('companies').updateOne(
        { 
          _id: new ObjectId(companyId),
          'vendorPortalAccess.vendorId': { $ne: vendorId } // Ensure no duplicate
        },
        { $addToSet: { vendorPortalAccess: newAccess } }
      );
    } else {
      console.log('Portal access already exists. Updated.');
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
