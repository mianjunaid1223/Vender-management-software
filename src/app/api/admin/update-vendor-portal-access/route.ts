import { NextRequest, NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import { getDb } from '@/lib/data';

export async function POST(request: NextRequest) {
  try {
    const { companyId, vendorId, features } = await request.json();

    if (!companyId || !vendorId) {
      return NextResponse.json({ error: 'Company ID and Vendor ID are required' }, { status: 400 });
    }

    const db = await getDb();

    const defaultFeatures = {
      invoiceManagement: true,
      documentUpload: true,
      communicationTools: true,
      complianceTracking: true,
      paymentStatus: true,
      reporting: true,
      profileManagement: true
    };

    const finalFeatures = features || defaultFeatures;

    // Update or create vendor portal access in the company
    const result = await db.collection('companies').updateOne(
      { _id: new ObjectId(companyId) },
      {
        $set: {
          [`vendorPortalAccess.${vendorId}`]: {
            enabled: true,
            features: finalFeatures,
            enabledAt: new Date(),
            enabledBy: 'admin'
          }
        }
      },
      { upsert: true }
    );

    console.log('Portal access update result:', result);

    // Verify the update
    const company = await db.collection('companies').findOne(
      { _id: new ObjectId(companyId) },
      { projection: { vendorPortalAccess: 1, name: 1 } }
    );

    console.log('Updated company portal access:', company?.vendorPortalAccess);

    return NextResponse.json({
      success: true,
      message: 'Vendor portal access updated successfully',
      portalAccess: company?.vendorPortalAccess?.[vendorId] || null
    });

  } catch (error) {
    console.error('Error updating vendor portal access:', error);
    return NextResponse.json({ error: 'Failed to update portal access' }, { status: 500 });
  }
}
