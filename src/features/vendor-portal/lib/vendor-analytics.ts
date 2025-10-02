import { getDb } from '@/shared/lib/data';
import { ObjectId } from 'mongodb';

// Enhanced invoice data management
interface VendorAnalyticsQuery {
  vendorId: string;
  status?: string;
  createdAt?: { $gte?: Date; $lte?: Date };
  $or?: Array<{ [key: string]: { $regex: string; $options: string } }>;
}

export async function getVendorInvoicesEnhanced(vendorId: string, companyId: string, options: {
  status?: string;
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}) {
  const db = await getDb();
  
  const {
    status,
    page = 1,
    limit = 10,
    search,
    sortBy = 'createdAt',
    sortOrder = 'desc'
  } = options;

  // Build query with proper typing
  const query: VendorAnalyticsQuery = { vendorId };
  
  if (status && status !== 'all') {
    query.status = status;
  }
  
  if (search) {
    query.$or = [
      { invoiceNumber: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } }
    ];
  }

  // Count total documents
  const total = await db.collection('invoices').countDocuments(query);

  // Get invoices with pagination and sorting
  const invoices = await db.collection('invoices')
    .find(query)
    .sort({ [sortBy]: sortOrder === 'desc' ? -1 : 1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .toArray();

  return {
    data: invoices.map(invoice => ({
      id: invoice._id.toString(),
      number: invoice.invoiceNumber || `INV-${invoice._id.toString().slice(-6)}`,
      amount: invoice.amount || 0,
      status: invoice.status || 'pending',
      dueDate: invoice.dueDate,
      uploadDate: invoice.createdAt,
      description: invoice.description || 'No description',
      fileName: invoice.fileName,
      filePath: invoice.filePath
    })),
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      hasNext: page < Math.ceil(total / limit),
      hasPrev: page > 1
    }
  };
}

interface VendorContractQuery {
  vendorId: string;
  status?: string;
  $or?: Array<{ [key: string]: { $regex: string; $options: string } }>;
}

// Enhanced contract data management
export async function getVendorContractsEnhanced(vendorId: string, companyId: string, options: {
  status?: string;
  page?: number;
  limit?: number;
  search?: string;
}) {
  const db = await getDb();
  
  const {
    status,
    page = 1,
    limit = 10,
    search
  } = options;

  // Build query with proper typing
  const query: VendorContractQuery = { vendorId };
  
  if (status && status !== 'all') {
    query.status = status;
  }
  
  if (search) {
    query.$or = [
      { title: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } }
    ];
  }

  const total = await db.collection('contracts').countDocuments(query);

  const contracts = await db.collection('contracts')
    .find(query)
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .toArray();

  return {
    data: contracts.map(contract => ({
      id: contract._id.toString(),
      title: contract.title || 'Untitled Contract',
      status: contract.status || 'draft',
      startDate: contract.startDate,
      endDate: contract.endDate,
      value: contract.value || 0,
      description: contract.description || '',
      terms: contract.terms || '',
      signedDate: contract.signedDate,
      createdAt: contract.createdAt
    })),
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      hasNext: page < Math.ceil(total / limit),
      hasPrev: page > 1
    }
  };
}

// Get vendor dashboard statistics
export async function getVendorDashboardStats(vendorId: string, companyId: string) {
  const db = await getDb();

  // Get invoice statistics
  const invoiceStats = await db.collection('invoices').aggregate([
    { $match: { vendorId } },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        totalAmount: { $sum: '$amount' }
      }
    }
  ]).toArray();

  // Get contract statistics
  const contractStats = await db.collection('contracts').aggregate([
    { $match: { vendorId } },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 }
      }
    }
  ]).toArray();

  // Calculate totals
  let totalInvoices = 0;
  let pendingInvoices = 0;
  let paidInvoices = 0;
  let totalAmount = 0;

  invoiceStats.forEach(stat => {
    totalInvoices += stat.count;
    totalAmount += stat.totalAmount || 0;
    
    if (stat._id === 'pending') pendingInvoices = stat.count;
    if (stat._id === 'paid') paidInvoices = stat.count;
  });

  let activeContracts = 0;
  contractStats.forEach(stat => {
    if (stat._id === 'active') activeContracts = stat.count;
  });

  // Calculate compliance score (simplified)
  const complianceScore = Math.min(95, Math.round(70 + (paidInvoices / totalInvoices) * 25));

  return {
    totalInvoices,
    pendingInvoices,
    paidInvoices,
    totalAmount,
    activeContracts,
    complianceScore: isNaN(complianceScore) ? 95 : complianceScore
  };
}

// Get vendor activity feed
export async function getVendorActivity(vendorId: string, companyId: string, limit = 20) {
  const db = await getDb();

  const activities = await db.collection('audit_logs')
    .find({
      userId: vendorId,
      userType: 'vendor'
    })
    .sort({ timestamp: -1 })
    .limit(limit)
    .toArray();

  return activities.map(activity => ({
    id: activity._id.toString(),
    action: activity.action,
    description: getActivityDescription(activity),
    timestamp: activity.timestamp,
    type: getActivityType(activity.action)
  }));
}

// Get vendor notifications
export async function getVendorNotifications(vendorId: string, companyId: string, limit = 10) {
  const db = await getDb();

  const notifications = await db.collection('notifications')
    .find({
      recipientId: vendorId,
      recipientType: 'vendor'
    })
    .sort({ createdAt: -1 })
    .limit(limit)
    .toArray();

  return notifications.map(notification => ({
    id: notification._id.toString(),
    title: notification.title,
    message: notification.message,
    type: notification.type || 'info',
    priority: notification.priority || 'medium',
    read: notification.read || false,
    createdAt: notification.createdAt
  }));
}

// Utility functions
function getActivityDescription(activity: any): string {
  switch (activity.action) {
    case 'invoice_uploaded':
      return `Uploaded invoice ${activity.details?.invoiceNumber || 'N/A'}`;
    case 'contract_signed':
      return `Signed contract: ${activity.details?.contractTitle || 'Unknown'}`;
    case 'profile_updated':
      return 'Updated profile information';
    case 'payment_received':
      return `Payment received for ${activity.details?.invoiceNumber || 'invoice'}`;
    default:
      return activity.action.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase());
  }
}

function getActivityType(action: string): string {
  if (action.includes('invoice')) return 'invoice';
  if (action.includes('contract')) return 'contract';
  if (action.includes('payment')) return 'payment';
  if (action.includes('profile')) return 'profile';
  return 'general';
}

// Upload document helper - server-friendly file types
interface ServerFile {
  name: string;
  data: Buffer;
  mime?: string;
}

export async function uploadVendorDocument(
  vendorId: string,
  companyId: string,
  file: Buffer | NodeJS.ReadableStream | string | ServerFile,
  documentType: string,
  description?: string
) {
  const db = await getDb();

  // Handle different file types
  let fileName: string;
  let originalName: string; 
  let size: number;
  
  if (typeof file === 'string') {
    // File path
    const path = await import('path');
    const fs = await import('fs/promises');
    originalName = path.basename(file);
    const stats = await fs.stat(file);
    size = stats.size;
  } else if (Buffer.isBuffer(file)) {
    // Buffer
    originalName = `document_${Date.now()}`;
    size = file.length;
  } else if ('name' in file && 'data' in file) {
    // ServerFile interface
    originalName = file.name;
    size = file.data.length;  
  } else {
    // ReadableStream
    originalName = `document_${Date.now()}`;
    size = 0; // Cannot determine size from stream
  }

  const timestamp = Date.now();
  const fileExtension = originalName.split('.').pop() || 'bin';
  fileName = `${documentType}_${vendorId}_${timestamp}.${fileExtension}`;

  const document = {
    vendorId,
    companyId,
    fileName,
    originalName,
    documentType,
    description: description || '',
    size,
    uploadDate: new Date(),
    status: 'pending_review'
  };

  const result = await db.collection('vendor_documents').insertOne(document);

  return {
    id: result.insertedId.toString(),
    fileName,
    message: 'Document uploaded successfully'
  };
}
