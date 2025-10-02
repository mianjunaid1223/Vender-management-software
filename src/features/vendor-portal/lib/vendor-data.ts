import 'server-only';
import { getDb } from '@/shared/lib/data';
import { ObjectId } from 'mongodb';
import type { Invoice, Contract, Vendor } from '@/shared/types/types';
import type { EnhancedVendor, VendorUser, ComplianceDocument, DataSyncQueue } from '@/shared/types/vendor-portal';
import { createAuditLog, createDataAccessLog } from '@/core/services/audit';
import { getVendorSession } from '@/core/auth/vendor-auth';

// === SECURITY HELPERS ===

function assertVendorScope(session: VendorUser, vendorId: string, companyId: string): void {
  if (session.vendorId !== vendorId || session.companyId !== companyId) {
    throw new Error('Forbidden: Access denied to requested vendor/company scope');
  }
}

// === SESSION-DERIVED VENDOR DATA ACCESS ===
// These functions use session-derived IDs for maximum security

export async function getMyInvoices(): Promise<Invoice[]> {
  const session = await getVendorSession();
  if (!session) throw new Error('Unauthorized');

  return getVendorScopedData<Invoice>('invoices', session.vendorId, session.companyId, {}, {
    userId: session.id,
    userRole: session.role,
  });
}

export async function getMyContracts(): Promise<Contract[]> {
  const session = await getVendorSession();
  if (!session) throw new Error('Unauthorized');

  const db = await getDb();
  
  // Vendors can see contracts where they are partyA or partyB
  const contracts = await db.collection('contracts').find({
    companyId: session.companyId,
    $or: [
      { 'partyA.id': session.vendorId },
      { 'partyB.id': session.vendorId }
    ]
  }).sort({ createdAt: -1 }).toArray();

  // Log access
  await createDataAccessLog({
    userId: session.id,
    userRole: session.role as any,
    vendorId: session.vendorId,
    companyId: session.companyId,
    resource: 'contracts',
    resourceId: 'multiple',
    ipAddress: '',
    userAgent: '',
    sessionId: '',
  });

  return JSON.parse(JSON.stringify(contracts.map(contract => ({
    ...contract,
    id: contract._id.toString(),
  }))));
}

export async function getMyProfile(): Promise<EnhancedVendor | null> {
  const session = await getVendorSession();
  if (!session) throw new Error('Unauthorized');

  if (!ObjectId.isValid(session.vendorId)) {
    return null;
  }

  const db = await getDb();
  
  const vendor = await db.collection('vendors').findOne({
    _id: new ObjectId(session.vendorId),
    companyId: session.companyId
  });

  if (!vendor) return null;

  // Get portal access info
  const portalAccess = await db.collection('vendor_portal_access').findOne({
    vendorId: session.vendorId,
    companyId: session.companyId
  });

  // Get vendor users
  const users = await db.collection('vendor_users').find({
    vendorId: session.vendorId,
    companyId: session.companyId
  }).toArray();

  // Log access
  await createDataAccessLog({
    userId: session.id,
    userRole: session.role as any,
    vendorId: session.vendorId,
    companyId: session.companyId,
    resource: 'vendor_profile',
    resourceId: session.vendorId,
    ipAddress: '',
    userAgent: '',
    sessionId: '',
  });

  return JSON.parse(JSON.stringify({
    ...vendor,
    id: vendor._id.toString(),
    portalAccess: portalAccess ? {
      ...portalAccess,
      id: portalAccess._id.toString()
    } : null,
    users: users.map(user => ({
      ...user,
      id: user._id.toString()
    }))
  }));
}

export async function updateMyProfile(updates: Partial<Vendor>): Promise<void> {
  const session = await getVendorSession();
  if (!session) throw new Error('Unauthorized');

  if (!ObjectId.isValid(session.vendorId)) {
    throw new Error('Invalid vendor ID');
  }

  const db = await getDb();
  
  // Get current vendor data for audit trail
  const currentVendor = await db.collection('vendors').findOne({
    _id: new ObjectId(session.vendorId),
    companyId: session.companyId
  });

  if (!currentVendor) throw new Error('Vendor not found');

  // Only allow certain fields to be updated by vendor
  const allowedFields = ['name', 'email', 'website', 'phone', 'address', 'contactPerson', 'notes'];
  const filteredUpdates = Object.keys(updates)
    .filter(key => allowedFields.includes(key))
    .reduce((obj: any, key) => {
      obj[key] = (updates as any)[key];
      return obj;
    }, {});

  if (Object.keys(filteredUpdates).length === 0) {
    throw new Error('No valid fields to update');
  }

  filteredUpdates.updatedAt = new Date().toISOString();
  filteredUpdates.vendorUpdatedBy = session.id;

  await db.collection('vendors').updateOne(
    { _id: new ObjectId(session.vendorId), companyId: session.companyId },
    { $set: filteredUpdates }
  );

  // Create audit log
  await createAuditLog({
    userId: session.id,
    userRole: session.role as any,
    vendorId: session.vendorId,
    companyId: session.companyId,
    action: 'update',
    resource: 'vendor_profile',
    resourceId: session.vendorId,
    oldValues: Object.keys(filteredUpdates).reduce((obj: any, key) => {
      obj[key] = currentVendor[key];
      return obj;
    }, {}),
    newValues: filteredUpdates,
    ipAddress: '',
    userAgent: '',
    sessionId: '',
  });

  // Queue sync for company approval
  await queueDataSync({
    sourceType: 'vendor',
    sourceUserId: session.id,
    targetType: 'company',
    operation: 'update',
    resource: 'vendor_profile',
    resourceId: session.vendorId,
    data: filteredUpdates,
    companyId: session.companyId,
    vendorId: session.vendorId,
  });
}

export async function getMyInvoice(invoiceId: string): Promise<Invoice | null> {
  const session = await getVendorSession();
  if (!session) throw new Error('Unauthorized');

  // Validate ObjectId before construction
  if (!ObjectId.isValid(invoiceId)) {
    return null;
  }

  const db = await getDb();
  
  const invoice = await db.collection('invoices').findOne({
    _id: new ObjectId(invoiceId),
    vendorId: session.vendorId,
    companyId: session.companyId
  });

  if (!invoice) return null;

  // Log access
  await createDataAccessLog({
    userId: session.id,
    userRole: session.role as any,
    vendorId: session.vendorId,
    companyId: session.companyId,
    resource: 'invoice',
    resourceId: invoiceId,
    ipAddress: '',
    userAgent: '',
    sessionId: '',
  });

  return JSON.parse(JSON.stringify({
    ...invoice,
    id: invoice._id.toString(),
  }));
}

export async function updateMyInvoiceStatus(
  invoiceId: string, 
  status: string,
  notes?: string
): Promise<void> {
  const session = await getVendorSession();
  if (!session) throw new Error('Unauthorized');

  // Validate ObjectId before construction
  if (!ObjectId.isValid(invoiceId)) {
    throw new Error('Invalid invoice ID');
  }

  const db = await getDb();
  
  // Get current invoice for audit trail
  const currentInvoice = await db.collection('invoices').findOne({
    _id: new ObjectId(invoiceId),
    vendorId: session.vendorId,
    companyId: session.companyId
  });

  if (!currentInvoice) throw new Error('Invoice not found');

  // Only allow certain status updates from vendor side
  const allowedStatuses = ['acknowledged', 'in_progress', 'completed', 'disputed'];
  if (!allowedStatuses.includes(status)) {
    throw new Error('Invalid status update');
  }

  const updateData = {
    vendorStatus: status,
    vendorNotes: notes,
    vendorUpdatedAt: new Date().toISOString(),
    vendorUpdatedBy: session.id,
  };

  await db.collection('invoices').updateOne(
    { _id: new ObjectId(invoiceId), vendorId: session.vendorId, companyId: session.companyId },
    { $set: updateData }
  );

  // Create audit log
  await createAuditLog({
    userId: session.id,
    userRole: session.role as any,
    vendorId: session.vendorId,
    companyId: session.companyId,
    action: 'update',
    resource: 'invoice',
    resourceId: invoiceId,
    oldValues: { 
      vendorStatus: currentInvoice.vendorStatus,
      vendorNotes: currentInvoice.vendorNotes 
    },
    newValues: updateData,
    ipAddress: '',
    userAgent: '',
    sessionId: '',
  });

  // Queue sync to notify company of update
  await queueDataSync({
    sourceType: 'vendor',
    sourceUserId: session.id,
    targetType: 'company',
    operation: 'update',
    resource: 'invoice',
    resourceId: invoiceId,
    data: updateData,
    companyId: session.companyId,
    vendorId: session.vendorId,
  });
}

// === VENDOR-SCOPED DATA ACCESS ===

export async function getVendorScopedData<T>(
  collection: string,
  vendorId: string,
  companyId: string,
  filter: Record<string, any> = {},
  options: {
    userId?: string;
    userRole?: string;
    ipAddress?: string;
    userAgent?: string;
    sessionId?: string;
  } = {}
): Promise<T[]> {
  const db = await getDb();
  
  // Ensure vendor can only access their own data
  const scopedFilter = {
    ...filter,
    vendorId,
    companyId
  };

  const data = await db
    .collection(collection)
    .find(scopedFilter)
    .sort({ createdAt: -1 })
    .toArray();

  // Log data access for audit trail
  if (options.userId) {
    await createDataAccessLog({
      userId: options.userId,
      userRole: options.userRole as any || 'vendor_user',
      vendorId,
      companyId,
      resource: collection,
      resourceId: 'multiple',
      ipAddress: options.ipAddress || '',
      userAgent: options.userAgent || '',
      sessionId: options.sessionId || '',
      query: scopedFilter
    });
  }

  return JSON.parse(JSON.stringify(data.map(item => ({
    ...item,
    id: item._id.toString(),
  }))));
}

// === LEGACY VENDOR DATA ACCESS (DEPRECATED) ===
// These functions are deprecated in favor of session-derived functions for better security
// Use getMyInvoices(), getMyContracts(), getMyProfile() instead

/**
 * @deprecated Use getMyInvoices() instead for better security
 */
export async function getVendorInvoices(vendorId: string, companyId: string): Promise<Invoice[]> {
  const session = await getVendorSession();
  if (!session) throw new Error('Unauthorized');
  
  // Protect against IDOR - ensure caller can only access their own data
  assertVendorScope(session, vendorId, companyId);

  return getVendorScopedData<Invoice>('invoices', vendorId, companyId, {}, {
    userId: session.id,
    userRole: session.role,
  });
}

/**
 * @deprecated Use getMyInvoices() with specific invoice filtering instead for better security
 */
export async function getVendorInvoice(invoiceId: string, vendorId: string, companyId: string): Promise<Invoice | null> {
  const session = await getVendorSession();
  if (!session) throw new Error('Unauthorized');
  
  // Protect against IDOR - ensure caller can only access their own data
  assertVendorScope(session, vendorId, companyId);
  
  // Validate ObjectId before construction
  if (!ObjectId.isValid(invoiceId)) {
    return null;
  }

  const db = await getDb();
  
  const invoice = await db.collection('invoices').findOne({
    _id: new ObjectId(invoiceId),
    vendorId,
    companyId
  });

  if (!invoice) return null;

  // Log access
  await createDataAccessLog({
    userId: session.id,
    userRole: session.role as any,
    vendorId,
    companyId,
    resource: 'invoice',
    resourceId: invoiceId,
    ipAddress: '',
    userAgent: '',
    sessionId: '',
  });

  return JSON.parse(JSON.stringify({
    ...invoice,
    id: invoice._id.toString(),
  }));
}

/**
 * @deprecated Use session-derived functions for better security
 */
export async function updateVendorInvoiceStatus(
  invoiceId: string, 
  vendorId: string, 
  companyId: string, 
  status: string,
  notes?: string
): Promise<void> {
  const session = await getVendorSession();
  if (!session) throw new Error('Unauthorized');
  
  // Protect against IDOR - ensure caller can only access their own data
  assertVendorScope(session, vendorId, companyId);
  
  // Validate ObjectId before construction
  if (!ObjectId.isValid(invoiceId)) {
    throw new Error('Invalid invoice ID');
  }

  const db = await getDb();
  
  // Get current invoice for audit trail
  const currentInvoice = await db.collection('invoices').findOne({
    _id: new ObjectId(invoiceId),
    vendorId,
    companyId
  });

  if (!currentInvoice) throw new Error('Invoice not found');

  // Only allow certain status updates from vendor side
  const allowedStatuses = ['acknowledged', 'in_progress', 'completed', 'disputed'];
  if (!allowedStatuses.includes(status)) {
    throw new Error('Invalid status update');
  }

  const updateData = {
    vendorStatus: status,
    vendorNotes: notes,
    vendorUpdatedAt: new Date().toISOString(),
    vendorUpdatedBy: session.id,
  };

  await db.collection('invoices').updateOne(
    { _id: new ObjectId(invoiceId), vendorId, companyId },
    { $set: updateData }
  );

  // Create audit log
  await createAuditLog({
    userId: session.id,
    userRole: session.role as any,
    vendorId,
    companyId,
    action: 'update',
    resource: 'invoice',
    resourceId: invoiceId,
    oldValues: { 
      vendorStatus: currentInvoice.vendorStatus,
      vendorNotes: currentInvoice.vendorNotes 
    },
    newValues: updateData,
    ipAddress: '',
    userAgent: '',
    sessionId: '',
  });

  // Queue sync to notify company of update
  await queueDataSync({
    sourceType: 'vendor',
    sourceUserId: session.id,
    targetType: 'company',
    operation: 'update',
    resource: 'invoice',
    resourceId: invoiceId,
    data: updateData,
    companyId,
    vendorId,
  });
}

// === VENDOR CONTRACT MANAGEMENT ===

/**
 * @deprecated Use getMyContracts() instead for better security
 */
export async function getVendorContracts(vendorId: string, companyId: string): Promise<Contract[]> {
  const session = await getVendorSession();
  if (!session) throw new Error('Unauthorized');
  
  // Protect against IDOR - ensure caller can only access their own data
  assertVendorScope(session, vendorId, companyId);

  // Vendors can see contracts where they are partyA or partyB
  const db = await getDb();
  
  const contracts = await db.collection('contracts').find({
    companyId,
    $or: [
      { 'partyA.id': vendorId },
      { 'partyB.id': vendorId }
    ]
  }).sort({ createdAt: -1 }).toArray();

  // Log access
  await createDataAccessLog({
    userId: session.id,
    userRole: session.role as any,
    vendorId,
    companyId,
    resource: 'contracts',
    resourceId: 'multiple',
    ipAddress: '',
    userAgent: '',
    sessionId: '',
  });

  return JSON.parse(JSON.stringify(contracts.map(contract => ({
    ...contract,
    id: contract._id.toString(),
  }))));
}

/**
 * @deprecated Use session-derived functions for better security
 */
export async function acknowledgeContract(
  contractId: string, 
  vendorId: string, 
  companyId: string,
  acknowledgment: {
    acknowledged: boolean;
    acknowledgedAt: string;
    acknowledgedBy: string;
    notes?: string;
  }
): Promise<void> {
  const session = await getVendorSession();
  if (!session) throw new Error('Unauthorized');
  
  // Protect against IDOR - ensure caller can only access their own data
  assertVendorScope(session, vendorId, companyId);
  
  // Validate ObjectId before construction
  if (!ObjectId.isValid(contractId)) {
    throw new Error('Invalid contract ID');
  }

  const db = await getDb();
  
  const updateData = {
    vendorAcknowledgment: acknowledgment,
    updatedAt: new Date().toISOString(),
  };

  await db.collection('contracts').updateOne(
    { 
      _id: new ObjectId(contractId), 
      companyId,
      $or: [
        { 'partyA.id': vendorId },
        { 'partyB.id': vendorId }
      ]
    },
    { $set: updateData }
  );

  // Create audit log
  await createAuditLog({
    userId: session.id,
    userRole: session.role as any,
    vendorId,
    companyId,
    action: 'update',
    resource: 'contract',
    resourceId: contractId,
    newValues: updateData,
    ipAddress: '',
    userAgent: '',
    sessionId: '',
    metadata: { action: 'acknowledge' }
  });
}

// === VENDOR PROFILE MANAGEMENT ===

/**
 * @deprecated Use getMyProfile() instead for better security
 */
export async function getVendorProfile(vendorId: string, companyId: string): Promise<EnhancedVendor | null> {
  const session = await getVendorSession();
  if (!session) throw new Error('Unauthorized');
  
  // Protect against IDOR - ensure caller can only access their own data
  assertVendorScope(session, vendorId, companyId);
  
  // Validate ObjectId before construction
  if (!ObjectId.isValid(vendorId)) {
    return null;
  }

  const db = await getDb();
  
  const vendor = await db.collection('vendors').findOne({
    _id: new ObjectId(vendorId),
    companyId
  });

  if (!vendor) return null;

  // Get portal access info
  const portalAccess = await db.collection('vendor_portal_access').findOne({
    vendorId,
    companyId
  });

  // Get vendor users
  const users = await db.collection('vendor_users').find({
    vendorId,
    companyId
  }).toArray();

  // Log access
  await createDataAccessLog({
    userId: session.id,
    userRole: session.role as any,
    vendorId,
    companyId,
    resource: 'vendor_profile',
    resourceId: vendorId,
    ipAddress: '',
    userAgent: '',
    sessionId: '',
  });

  return JSON.parse(JSON.stringify({
    ...vendor,
    id: vendor._id.toString(),
    portalAccess: portalAccess ? {
      ...portalAccess,
      id: portalAccess._id.toString()
    } : null,
    users: users.map(user => ({
      ...user,
      id: user._id.toString()
    }))
  }));
}

/**
 * @deprecated Use session-derived functions for better security
 */
export async function updateVendorProfile(
  vendorId: string, 
  companyId: string, 
  updates: Partial<Vendor>
): Promise<void> {
  const session = await getVendorSession();
  if (!session) throw new Error('Unauthorized');
  
  // Protect against IDOR - ensure caller can only access their own data
  assertVendorScope(session, vendorId, companyId);
  
  // Validate ObjectId before construction
  if (!ObjectId.isValid(vendorId)) {
    throw new Error('Invalid vendor ID');
  }

  const db = await getDb();
  
  // Get current vendor data for audit trail
  const currentVendor = await db.collection('vendors').findOne({
    _id: new ObjectId(vendorId),
    companyId
  });

  if (!currentVendor) throw new Error('Vendor not found');

  // Only allow certain fields to be updated by vendor
  const allowedFields = ['name', 'email', 'website', 'phone', 'address', 'contactPerson', 'notes'];
  const filteredUpdates = Object.keys(updates)
    .filter(key => allowedFields.includes(key))
    .reduce((obj: any, key) => {
      obj[key] = (updates as any)[key];
      return obj;
    }, {});

  if (Object.keys(filteredUpdates).length === 0) {
    throw new Error('No valid fields to update');
  }

  filteredUpdates.updatedAt = new Date().toISOString();
  filteredUpdates.vendorUpdatedBy = session.id;

  await db.collection('vendors').updateOne(
    { _id: new ObjectId(vendorId), companyId },
    { $set: filteredUpdates }
  );

  // Create audit log
  await createAuditLog({
    userId: session.id,
    userRole: session.role as any,
    vendorId,
    companyId,
    action: 'update',
    resource: 'vendor_profile',
    resourceId: vendorId,
    oldValues: Object.keys(filteredUpdates).reduce((obj: any, key) => {
      obj[key] = currentVendor[key];
      return obj;
    }, {}),
    newValues: filteredUpdates,
    ipAddress: '',
    userAgent: '',
    sessionId: '',
  });

  // Queue sync for company approval
  await queueDataSync({
    sourceType: 'vendor',
    sourceUserId: session.id,
    targetType: 'company',
    operation: 'update',
    resource: 'vendor_profile',
    resourceId: vendorId,
    data: filteredUpdates,
    companyId,
    vendorId,
  });
}

// === COMPLIANCE DOCUMENT MANAGEMENT ===

/**
 * @deprecated Use session-derived functions for better security
 */
export async function uploadComplianceDocument(
  vendorId: string,
  companyId: string,
  document: {
    type: string;
    name: string;
    fileName: string;
    filePath: string;
    fileSize: number;
    mimeType: string;
    expiresAt?: string;
  }
): Promise<string> {
  const session = await getVendorSession();
  if (!session) throw new Error('Unauthorized');
  
  // Protect against IDOR - ensure caller can only access their own data
  assertVendorScope(session, vendorId, companyId);

  const db = await getDb();
  
  const complianceDoc: Omit<ComplianceDocument, 'id'> = {
    type: document.type,
    name: document.name,
    fileName: document.fileName,
    filePath: document.filePath,
    fileSize: document.fileSize,
    mimeType: document.mimeType,
    status: 'pending',
    uploadedAt: new Date().toISOString(),
    uploadedBy: session.id,
    expiresAt: document.expiresAt,
  };

  const result = await db.collection('compliance_documents').insertOne({
    ...complianceDoc,
    vendorId,
    companyId
  });

  // Create audit log
  await createAuditLog({
    userId: session.id,
    userRole: session.role as any,
    vendorId,
    companyId,
    action: 'upload',
    resource: 'compliance_document',
    resourceId: result.insertedId.toString(),
    newValues: complianceDoc,
    ipAddress: '',
    userAgent: '',
    sessionId: '',
  });

  return result.insertedId.toString();
}

// === DATA SYNC QUEUE MANAGEMENT ===

async function queueDataSync(params: {
  sourceType: 'company' | 'vendor';
  sourceUserId: string;
  targetType: 'company' | 'vendor';
  operation: 'create' | 'update' | 'delete' | 'approve';
  resource: string;
  resourceId: string;
  data: Record<string, any>;
  companyId: string;
  vendorId?: string;
  priority?: number;
}): Promise<void> {
  const db = await getDb();
  
  const syncItem: Omit<DataSyncQueue, 'id'> = {
    sourceType: params.sourceType,
    sourceUserId: params.sourceUserId,
    targetType: params.targetType,
    operation: params.operation,
    resource: params.resource,
    resourceId: params.resourceId,
    data: params.data,
    status: 'pending',
    priority: params.priority || 5,
    retryCount: 0,
    maxRetries: 3,
    scheduledAt: new Date().toISOString(),
    companyId: params.companyId,
    vendorId: params.vendorId,
  };

  await db.collection('data_sync_queue').insertOne(syncItem);
}
