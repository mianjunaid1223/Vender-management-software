import { NextRequest, NextResponse } from 'next/server';
import { getVendorSession } from '@/lib/auth/vendor-auth';
import { getDb } from '@/lib/data';
import { ObjectId } from 'mongodb';

// Check if vendor has permission for a specific action
async function checkPermission(session: any, action: 'read' | 'edit' | 'create') {
  const db = await getDb();
  const company = await db.collection('companies').findOne({
    _id: new ObjectId(session.companyId)
  });

  if (!company) return false;

  const vendorAccess = company.vendorPortalAccess?.find(
    (access: any) => access.vendorId === session.vendorId
  );

  if (!vendorAccess || !vendorAccess.enabled) return false;

  // Check if access has expired
  if (vendorAccess.expiresAt && new Date() > new Date(vendorAccess.expiresAt)) {
    return false;
  }

  return vendorAccess.features?.invoiceManagement?.[action] || false;
}

// GET - View invoices (requires READ permission)
export async function GET(request: NextRequest) {
  try {
    const session = await getVendorSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const hasPermission = await checkPermission(session, 'read');
    if (!hasPermission) {
      return NextResponse.json({ 
        error: 'You do not have permission to view invoices' 
      }, { status: 403 });
    }

    const db = await getDb();
    
    // Get invoices for this vendor
    const invoices = await db.collection('invoices').find({
      vendorId: session.vendorId,
      companyId: session.companyId
    }).sort({ createdAt: -1 }).toArray();

    return NextResponse.json({
      invoices: invoices.map(invoice => ({
        id: invoice._id.toString(),
        number: invoice.invoiceNumber || invoice.number,
        amount: invoice.amount || 0,
        status: invoice.status || 'pending',
        dueDate: invoice.dueDate,
        uploadDate: invoice.createdAt || invoice.uploadDate,
        description: invoice.description || invoice.subject,
        documentUrl: invoice.documentUrl
      }))
    });

  } catch (error) {
    console.error('Error fetching invoices:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Create/Upload invoice (requires CREATE permission)
export async function POST(request: NextRequest) {
  try {
    const session = await getVendorSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const hasPermission = await checkPermission(session, 'create');
    if (!hasPermission) {
      return NextResponse.json({ 
        error: 'You do not have permission to create invoices' 
      }, { status: 403 });
    }

    const body = await request.json();
    const { invoiceNumber, amount, dueDate, description, documentUrl } = body;

    if (!invoiceNumber || !amount || !dueDate) {
      return NextResponse.json(
        { error: 'Invoice number, amount, and due date are required' },
        { status: 400 }
      );
    }

    const db = await getDb();

    // Create new invoice
    const invoice = {
      invoiceNumber,
      amount: parseFloat(amount),
      dueDate: new Date(dueDate),
      description: description || '',
      documentUrl: documentUrl || '',
      status: 'pending', // All vendor-submitted invoices require company approval
      vendorId: session.vendorId,
      companyId: session.companyId,
      submittedBy: session.id,
      createdAt: new Date(),
      updatedAt: new Date(),
      requiresApproval: true
    };

    const result = await db.collection('invoices').insertOne(invoice);

    // Create notification for company
    await db.collection('notifications').insertOne({
      notificationId: `notif_${Date.now()}_${session.vendorId}`,
      companyId: session.companyId,
      type: 'new_invoice_submission',
      title: 'New Invoice Submitted',
      message: `Vendor has submitted invoice ${invoiceNumber} for approval`,
      read: false,
      createdAt: new Date(),
      metadata: {
        invoiceId: result.insertedId.toString(),
        vendorId: session.vendorId,
        amount: amount
      }
    });

    return NextResponse.json({
      message: 'Invoice submitted successfully and is pending company approval',
      invoiceId: result.insertedId.toString()
    });

  } catch (error) {
    console.error('Error creating invoice:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
