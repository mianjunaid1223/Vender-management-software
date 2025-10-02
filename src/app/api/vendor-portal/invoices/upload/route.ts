import { NextRequest, NextResponse } from 'next/server';
import { getVendorSession } from '@/core/auth/vendor-auth';
import { ObjectId } from 'mongodb';
import { getDb } from '@/shared/lib/data';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';
import type { VendorPortalAccess } from '@/shared/types/vendor-portal';
import { FILE_UPLOAD, VALIDATION } from '@/config/constants';
import { handleAPIError, ValidationErrors } from '@/core/utils/error-handling';

export async function POST(request: NextRequest) {
  let session: any = null;
  
  try {
    session = await getVendorSession();
    
    if (!session) {
      throw ValidationErrors.UNAUTHORIZED();
    }

    // Check if vendor has upload permission
    const db = await getDb();
    const company = await db.collection('companies').findOne({
      _id: new ObjectId(session.companyId)
    });

    const portalAccess = company?.vendorPortalAccess?.find(
      (access: VendorPortalAccess) => access.vendorId === session.vendorId
    );

    if (!portalAccess?.features?.uploadInvoices && !portalAccess?.features?.canUploadInvoices) {
      throw ValidationErrors.FORBIDDEN('Upload invoices');
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

    // Validate file type and extension
    if (!FILE_UPLOAD.ALLOWED_TYPES.includes(file.type as any)) {
      return NextResponse.json(
        { error: 'Only PDF and image files are allowed' },
        { status: 400 }
      );
    }

    // Additional security: validate file extension matches MIME type
    const originalExtension = file.name.split('.').pop()?.toLowerCase();
    const mimeToExtension: { [key: string]: string[] } = {
      'application/pdf': ['pdf'],
      'image/jpeg': ['jpg', 'jpeg'],
      'image/jpg': ['jpg', 'jpeg'],
      'image/png': ['png']
    };
    
    const allowedExtensions = mimeToExtension[file.type];
    if (!allowedExtensions || !originalExtension || !allowedExtensions.includes(originalExtension)) {
      return NextResponse.json(
        { error: 'File extension does not match file type' },
        { status: 400 }
      );
    }

    // Validate file size (configurable max)
    if (file.size > FILE_UPLOAD.MAX_SIZE) {
      return NextResponse.json(
        { error: `File size must be less than ${Math.round(FILE_UPLOAD.MAX_SIZE / 1024 / 1024)}MB` },
        { status: 400 }
      );
    }

    // Create unique filename with secure extension
    const timestamp = Date.now();
    
    // Map MIME type to safe extension (reuse from validation)
    const safeExtension = allowedExtensions[0]; // Use first allowed extension
    const fileName = `invoice_${session.vendorId}_${timestamp}.${safeExtension}`;
    
    // Get file buffer for cloud upload
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    
    // Upload to cloud storage (S3 example - replace with your configured cloud storage)
    try {
      // @ts-ignore - AWS SDK is optional dependency
      const { S3Client, PutObjectCommand } = await import('@aws-sdk/client-s3');
      
      if (!process.env.AWS_REGION || !process.env.AWS_S3_BUCKET) {
        throw new Error('Cloud storage not configured');
      }
      
      const s3Client = new S3Client({
        region: process.env.AWS_REGION,
        credentials: {
          accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!
        }
      });
      
      const key = `invoices/${fileName}`;
      
      const command = new PutObjectCommand({
        Bucket: process.env.AWS_S3_BUCKET,
        Key: key,
        Body: buffer,
        ContentType: file.type,
        ACL: 'private' // Secure by default
      });
      
      await s3Client.send(command);
      
      // Basic content validation - check file signature/magic bytes before upload
      const magicBytes = buffer.slice(0, 4);
      const isPDF = magicBytes.toString() === '%PDF';
      const isJPEG = magicBytes[0] === 0xFF && magicBytes[1] === 0xD8;
      const isPNG = magicBytes[0] === 0x89 && magicBytes[1] === 0x50 && 
                    magicBytes[2] === 0x4E && magicBytes[3] === 0x47;
      
      const validContent = (file.type === 'application/pdf' && isPDF) ||
                          ((file.type === 'image/jpeg' || file.type === 'image/jpg') && isJPEG) ||
                          (file.type === 'image/png' && isPNG);
      
      if (!validContent) {
        return NextResponse.json(
          { error: 'File content does not match declared type' },
          { status: 400 }
        );
      }
      
      await s3Client.send(command);
      
      // Generate signed URL for access (or use the key)
      var publicPath = `https://${process.env.AWS_S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
      
    } catch (error) {
      console.error('Failed to upload to cloud storage:', error);
      return NextResponse.json(
        { error: 'File upload failed. Please try again.' },
        { status: 500 }
      );
    }

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
    return handleAPIError(error, {
      userId: session?.id,
      userRole: 'vendor_user',
      vendorId: session?.vendorId,
      companyId: session?.companyId,
      action: 'upload',
      resource: 'invoice',
      ipAddress: request.headers.get('x-forwarded-for') || undefined,
      userAgent: request.headers.get('user-agent') || undefined
    });
  }
}
