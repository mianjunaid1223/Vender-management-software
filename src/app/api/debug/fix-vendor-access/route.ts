import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/data';
import { ObjectId } from 'mongodb';

export async function POST(request: NextRequest) {
  try {
    const db = await getDb();
    
    const vendorId = '68bdd771268cb3a8a06cec58';
    const companyId = '68bdcf5b3659db777e755f44';
    
    // Add comprehensive portal access for this vendor
    const portalAccessData = {
      vendorId,
      enabled: true,
      enabledAt: new Date().toISOString(),
      features: {
        viewInvoices: true,
        downloadInvoices: true,
        updatePaymentInfo: true,
        viewContracts: true,
        communicateWithBuyer: true,
        viewComplianceRequirements: true,
        uploadDocuments: true
      },
      restrictions: [],
      mfaRequired: false,
      sessionTimeout: 480,
      lastLoginAt: null,
      loginAttempts: 0,
      lockedUntil: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: 'admin',
      updatedBy: 'admin'
    };

    // Remove existing access and add new one
    await db.collection('companies').updateOne(
      { _id: new ObjectId(companyId) },
      { 
        $pull: { "vendorPortalAccess": { vendorId: vendorId } } as any
      }
    );

    await db.collection('companies').updateOne(
      { _id: new ObjectId(companyId) },
      { 
        $push: { "vendorPortalAccess": portalAccessData } as any
      }
    );

    return NextResponse.json({ 
      success: true, 
      message: 'Portal access configured successfully',
      data: portalAccessData
    });

  } catch (error) {
    console.error('Fix error:', error);
    return NextResponse.json({ error: 'Fix failed' }, { status: 500 });
  }
}
