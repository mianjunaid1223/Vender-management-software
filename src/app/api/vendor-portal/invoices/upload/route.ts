import { NextRequest, NextResponse } from 'next/server';
import { getVendorSession } from '@/lib/auth/vendor-auth';
import { ObjectId } from 'mongodb';
import { getDb } from '@/lib/data';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

export async function POST(request: NextRequest) {
  try {
    const session = await getVendorSession();
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if vendor has upload permission
    const db = await getDb();
    const company = await db.collection('companies').findOne({
      _id: new ObjectId(session.companyId)
    });

    const portalAccess = company?.vendorPortalAccess?.find(
      (access: any) => access.vendorId === session.vendorId
    );

    if (!portalAccess?.features?.uploadInvoices && !portalAccess?.features?.canUploadInvoices) {
      return NextResponse.json({ error: 'Upload permission denied' }, { status: 403 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const description = formData.get('description') as string;
    const amount = parseFloat(formData.get('amount') as string);
    if (isNaN(amount) || amount <= 0) {
      return NextResponse.json(
        { error: 'Invalid amount. Amount must be a positive number' },
        { status: 400 }
      );
    }
    const dueDate = formData.get('dueDate') as string;

    if (!file || !description || !amount || !dueDate) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      );
    }

    // Validate file type
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Only PDF and image files are allowed' },
        { status: 400 }
      );
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'File size must be less than 5MB' },
        { status: 400 }
      );
    }

    // Create unique filename with secure extension
    const timestamp = Date.now();
    
    // Map MIME type to safe extension
    const mimeToExtension: { [key: string]: string } = {
      'application/pdf': 'pdf',
      'image/jpeg': 'jpg',
      'image/jpg': 'jpg',
      'image/png': 'png'
    };
    const safeExtension = mimeToExtension[file.type];
    if (!safeExtension) {
      return NextResponse.json(
        { error: 'Invalid file type extension' },
        { status: 400 }
      );
    }
    const fileName = `invoice_${session.vendorId}_${timestamp}.${safeExtension}`;
    
    // Ensure uploads directory exists
    const uploadsDir = join(process.cwd(), 'public', 'uploads', 'invoices');
    try {
      if (!existsSync(uploadsDir)) {
        await mkdir(uploadsDir, { recursive: true });
      }
    } catch (error) {
      console.error('Failed to create upload directory:', error);
      return NextResponse.json(
        { error: 'Server configuration error. Please contact support.' },
        { status: 500 }
      );
    }
    
    const filePath = join(uploadsDir, fileName);
    const publicPath = `/uploads/invoices/${fileName}`;

    // Save file
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filePath, buffer);

    // Save invoice to database
    const invoice = {
      invoiceNumber: `INV-${session.vendorId}-${timestamp}`,
      vendorId: session.vendorId,
      companyId: session.companyId,
      description,
      amount,
      dueDate: new Date(dueDate),
      status: 'pending',
      fileName,
      filePath: publicPath,
      originalFileName: file.name,
      fileSize: file.size,
      fileType: file.type,
      uploadedBy: session.id,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await db.collection('invoices').insertOne(invoice);

    // Create audit log
    await db.collection('audit_logs').insertOne({
      action: 'invoice_uploaded',
      userId: session.id,
      userType: 'vendor',
      targetType: 'invoice',
      targetId: result.insertedId.toString(),
      details: {
        invoiceNumber: invoice.invoiceNumber,
        amount: invoice.amount,
        description: invoice.description,
        fileName: invoice.fileName
      },
      timestamp: new Date(),
      ipAddress: request.headers.get('x-forwarded-for') || 'unknown'
    });

    return NextResponse.json({
      success: true,
      invoiceId: result.insertedId.toString(),
      invoiceNumber: invoice.invoiceNumber,
      message: 'Invoice uploaded successfully'
    });

  } catch (error) {
    console.error('Error uploading invoice:', error);
    return NextResponse.json(
      { error: 'Failed to upload invoice' },
      { status: 500 }
    );
  }
}
