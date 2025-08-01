
'use server';

import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import type { Invoice, Vendor, User, Contract, Company, Notification, ActionLog, SearchFilters } from '@/lib/types';
import { unstable_noStore as noStore } from 'next/cache';
import { add } from 'date-fns';
import { getSession } from '@/lib/auth';

export const getDb = async () => {
    if (!clientPromise) {
        throw new Error('MongoDB client not configured. Please check your MONGODB_URI environment variable.');
    }
    try {
        const client = await clientPromise;
        return client.db('vendorverse');
    } catch (error) {
        console.error('Database connection failed:', error);
        throw new Error('Failed to connect to database. Please check your MongoDB connection.');
    }
}

export const getClient = async () => {
    if (!clientPromise) {
        throw new Error('MongoDB client not configured. Please check your MONGODB_URI environment variable.');
    }
    try {
        return await clientPromise;
    } catch (error) {
        console.error('Database connection failed:', error);
        throw new Error('Failed to connect to database. Please check your MongoDB connection.');
    }
}

async function getCurrentUserCompanyId(): Promise<string | null> {
    const user = await getSession();
    return user?.companyId || null;
}

export async function fetchInvoices(): Promise<Invoice[]> {
    noStore();
    const db = await getDb();
    const companyId = await getCurrentUserCompanyId();
    
    if (!companyId) {
        return [];
    }

    try {
        const invoices = await db
            .collection('invoices')
            .find({ companyId }) 
            .sort({ invoiceDate: -1 })
            .toArray();
        
        return JSON.parse(JSON.stringify(invoices.map(invoice => ({
            ...invoice,
            id: invoice._id.toString(),
        }))));

    } catch (error) {
        console.error('Database Error:', error);
        throw new Error('Failed to fetch invoices from database.');
    }
}

export async function fetchVendors(): Promise<Vendor[]> {
    noStore();
    const db = await getDb();
    const companyId = await getCurrentUserCompanyId();
    
    if (!companyId) {
        return [];
    }
    
    try {
        const vendors = await db
            .collection('vendors')
            .find({ companyId }) 
            .sort({ name: 1 })
            .toArray();

        return JSON.parse(JSON.stringify(vendors.map(vendor => ({
            ...vendor,
            id: vendor._id.toString(),
        }))));

    } catch (error) {
        console.error('Database Error:', error);
        throw new Error('Failed to fetch vendors from database.');
    }
}

export async function fetchCardData() {
    noStore();
    const db = await getDb();
    const companyId = await getCurrentUserCompanyId();
    
    if (!companyId) {
         return {
            totalSpend: 0,
            activeVendors: 0,
            unpaidInvoices: 0,
            nextPaymentDue: null,
        };
    }

    try {
        const invoicesCollection = db.collection('invoices');
        const vendorsCollection = db.collection('vendors');

        const totalSpendPromise = invoicesCollection.aggregate([
            { $match: { status: 'Paid', companyId } },
            { $group: { _id: null, total: { $sum: '$totalAmount' } } }
        ]).toArray();
        
        const activeVendorsPromise = vendorsCollection.countDocuments({ companyId });
        
        const unpaidInvoicesPromise = invoicesCollection.countDocuments({ 
          status: { $in: ['Unpaid', 'Pending', 'Overdue'] },
          companyId
        });
        
        const nextPaymentDuePromise = invoicesCollection.find({ 
          status: { $in: ['Unpaid', 'Pending', 'Overdue'] },
          companyId,
          invoiceDueDate: { $exists: true }
        })
            .sort({ invoiceDueDate: 1 })
            .limit(1)
            .toArray();

        const data = await Promise.all([
            totalSpendPromise,
            activeVendorsPromise,
            unpaidInvoicesPromise,
            nextPaymentDuePromise
        ]);

        const totalSpend = data[0][0]?.total || 0;
        const activeVendors = data[1];
        const unpaidInvoices = data[2];
        let nextPaymentDue = data[3][0] || null;

        if (nextPaymentDue) {
            nextPaymentDue = JSON.parse(JSON.stringify(nextPaymentDue));
        }

        return {
            totalSpend,
            activeVendors,
            unpaidInvoices,
            nextPaymentDue,
        };
    } catch (error) {
        console.error('Database Error:', error);
        if (error instanceof Error) {
            throw new Error(error.message);
        }
        throw new Error('Failed to fetch card data.');
    }
}


export async function getUser(): Promise<User | null> {
    noStore();
    const user = await getSession();
    return user;
}

export async function processAndFetchContracts(): Promise<Contract[]> {
    noStore();
    const db = await getDb();
    const companyId = await getCurrentUserCompanyId();
    const today = new Date();
  
    if (!companyId) {
        return [];
    }
  
    try {
      const contractsCollection = db.collection('contracts');
      const activeContracts = await contractsCollection
        .find({ 
            status: { $nin: ['Expired', 'Terminated'] },
            companyId
        })
        .toArray();
  
      for (const contract of activeContracts) {
        const endDate = new Date(contract.endDate);
  
        if (endDate < today) {
          if (contract.autoRenew) {
            const renewalPeriod = contract.renewalPeriod || 12;
            const newStartDate = new Date(contract.endDate);
            newStartDate.setDate(newStartDate.getDate() + 1);
            
            const newEndDate = add(newStartDate, { months: renewalPeriod });
  
            await contractsCollection.updateOne(
              { _id: contract._id, companyId },
              {
                $set: {
                  startDate: newStartDate.toISOString(),
                  endDate: newEndDate.toISOString(),
                  updatedAt: new Date().toISOString(),
                },
              }
            );
          } else {
            await contractsCollection.updateOne(
              { _id: contract._id, companyId },
              { $set: { status: 'Expired', updatedAt: new Date().toISOString() } }
            );
          }
        }
      }
  
      const allContracts = await contractsCollection.find({ companyId }).sort({ createdAt: -1 }).toArray();
      return JSON.parse(JSON.stringify(allContracts.map(c => ({...c, id: c._id.toString()}))));
  
    } catch (error) {
      console.error('Database Error processing contracts:', error);
      throw new Error('Failed to process and fetch contracts.');
    }
}

export async function fetchContracts(): Promise<Contract[]> {
    noStore();
    const db = await getDb();
    const companyId = await getCurrentUserCompanyId();
    
    if (!companyId) {
        return [];
    }
    try {
        const contracts = await db
            .collection('contracts')
            .find({ companyId }) 
            .sort({ createdAt: -1 })
            .toArray();

        return JSON.parse(JSON.stringify(contracts.map(c => ({...c, id: c._id.toString()}))));
    } catch (error) {
        console.error('Database Error:', error);
        throw new Error('Failed to fetch contracts from database.');
    }
}

export async function createInvoice(invoice: Partial<Invoice>): Promise<Invoice> {
    noStore();
    const db = await getDb();
    const companyId = await getCurrentUserCompanyId();
    
    if (!companyId) {
        throw new Error('User not authenticated or no company associated');
    }
    
    try {
        const invoiceData = {
            ...invoice,
            companyId, 
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };
        
        const result = await db.collection('invoices').insertOne(invoiceData);
        
        const newInvoiceDoc = await db.collection('invoices').findOne({ _id: result.insertedId });
        if (!newInvoiceDoc) {
          throw new Error('Failed to retrieve newly created invoice.');
        }
        const { _id, ...rest } = newInvoiceDoc;
        const newInvoice = { ...rest, id: _id.toString() } as Invoice;

        return JSON.parse(JSON.stringify(newInvoice));
    } catch (error) {
        console.error('Database Error:', error);
        if (error instanceof Error) {
            throw new Error(error.message);
        }
        throw new Error('Failed to create invoice.');
    }
}

export async function updateInvoice(id: string, updates: Partial<Invoice>): Promise<Invoice> {
    noStore();
    const db = await getDb();
    const companyId = await getCurrentUserCompanyId();
    
    if (!companyId) {
        throw new Error('User not authenticated or no company associated');
    }
    
    try {
        const { id: _, _id, ...updateData } = updates as any;
        updateData.updatedAt = new Date().toISOString();
        
        const result = await db.collection('invoices').findOneAndUpdate(
            { _id: new ObjectId(id), companyId }, 
            { $set: updateData },
            { returnDocument: 'after' }
        );
        
        if (!result) {
            throw new Error('Invoice not found or access denied');
        }
        
        const newDoc = { ...result, id: result._id.toString() };
        return JSON.parse(JSON.stringify(newDoc));
    } catch (error) {
        console.error('Database Error:', error);
        if (error instanceof Error) {
            throw new Error(error.message);
        }
        throw new Error('Failed to update invoice.');
    }
}

export async function deleteInvoice(id: string): Promise<void> {
    noStore();
    const db = await getDb();
    const companyId = await getCurrentUserCompanyId();
    
    if (!companyId) {
        throw new Error('User not authenticated or no company associated');
    }
    
    try {
        const result = await db.collection('invoices').deleteOne({ 
            _id: new ObjectId(id), 
            companyId
        });
        
        if (result.deletedCount === 0) {
            throw new Error('Invoice not found or access denied');
        }
    } catch (error) {
        console.error('Database Error:', error);
        if (error instanceof Error) {
            throw new Error(error.message);
        }
        throw new Error('Failed to delete invoice.');
    }
}

export async function updateInvoiceStatus(id: string, status: Invoice['status']): Promise<void> {
    noStore();
    const db = await getDb();
    const companyId = await getCurrentUserCompanyId();
    
    if (!companyId) {
        throw new Error('User not authenticated or no company associated');
    }
    
    try {
        const updateData = {
            status,
            paymentStatus: status === 'Paid' ? 'Paid' : status === 'Overdue' ? 'Overdue' : 'Pending',
            updatedAt: new Date().toISOString(),
        };
        
        const result = await db.collection('invoices').updateOne(
            { _id: new ObjectId(id), companyId },
            { $set: updateData }
        );
        
        if (result.matchedCount === 0) {
            throw new Error('Invoice not found');
        }
    } catch (error) {
        console.error('Database Error:', error);
        if (error instanceof Error) {
            throw new Error(error.message);
        }
        throw new Error('Failed to update invoice status.');
    }
}

// Company/Agency Operations
export async function fetchCompany(): Promise<Company | null> {
    noStore();
    const db = await getDb();
    const companyId = await getCurrentUserCompanyId();
    
    if (!companyId) {
        return null;
    }
    
    try {
        const company = await db.collection('companies').findOne({ companyId: companyId });
        
        if (!company) {
            return null;
        }
        
        const { _id, ...companyData } = company;
        return JSON.parse(JSON.stringify({ ...companyData, id: _id.toString() }));

    } catch (error) {
        console.error('Database Error:', error);
        throw new Error('Failed to fetch company from database.');
    }
}

export async function createCompany(company: Partial<Company>): Promise<Company> {
    noStore();
    const db = await getDb();
    const user = await getUser();
    
    if (!user || !user.companyId) {
        throw new Error('User not authenticated or missing companyId');
    }
    
    try {
        const companyData = {
            ...company,
            companyId: user.companyId,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            createdBy: user.id,
        };
        
        const existingCompany = await db.collection('companies').findOne({ 
            companyId: user.companyId
        });
        
        if (existingCompany) {
            return updateCompany(existingCompany._id.toString(), companyData);
        }
        
        const result = await db.collection('companies').insertOne(companyData);
        
        const newCompanyDoc = await db.collection('companies').findOne({ _id: result.insertedId });
        if (!newCompanyDoc) {
          throw new Error('Failed to retrieve newly created company.');
        }
        
        const { _id, ...rest } = newCompanyDoc;
        return JSON.parse(JSON.stringify({ ...rest, id: _id.toString() }));
    } catch (error) {
        console.error('Database Error:', error);
        throw new Error('Failed to create company.');
    }
}

export async function updateCompany(id: string, updates: Partial<Company>): Promise<Company> {
    noStore();
    const db = await getDb();
    const companyId = await getCurrentUserCompanyId();
    
    try {
        const { id: _, _id, ...updateData } = updates as any;
        updateData.updatedAt = new Date().toISOString();
        
        const result = await db.collection('companies').findOneAndUpdate(
            { _id: new ObjectId(id), companyId },
            { $set: updateData },
            { returnDocument: 'after' }
        );
        
        if (!result) {
            throw new Error('Company not found during update operation');
        }
        
        const updatedDoc = { ...result, id: result._id.toString() };
        return JSON.parse(JSON.stringify(updatedDoc));
    } catch (error) {
        console.error('Database Error:', error);
        throw new Error('Failed to update company.');
    }
}

export async function createOrUpdateCompany(companyData: Partial<Company>): Promise<Company> {
    noStore();
    const existingCompany = await fetchCompany();
    if (existingCompany) {
        return updateCompany(existingCompany.id, companyData);
    } else {
        return createCompany(companyData);
    }
}

// Enhanced Contract Operations
export async function createContract(contract: Partial<Contract>): Promise<Contract> {
    noStore();
    const db = await getDb();
    const companyId = await getCurrentUserCompanyId();
    
    if (!companyId) {
        throw new Error('User not authenticated or no company associated');
    }
    
    try {
        const contractData = {
            ...contract,
            companyId, 
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };
        
        const result = await db.collection('contracts').insertOne(contractData);
        
        const newContractDoc = await db.collection('contracts').findOne({ _id: result.insertedId });
        if (!newContractDoc) throw new Error("Failed to retrieve new contract");
        const { _id, ...rest} = newContractDoc;
        return JSON.parse(JSON.stringify({...rest, id: _id.toString()}));
    } catch (error) {
        console.error('Database Error:', error);
        throw new Error('Failed to create contract.');
    }
}

export async function updateContract(id: string, updates: Partial<Contract>): Promise<Contract> {
    noStore();
    const db = await getDb();
    const companyId = await getCurrentUserCompanyId();
    
    if (!companyId) {
        throw new Error('User not authenticated or no company associated');
    }
    
    try {
        const { id: _, _id, ...updateData } = updates as any;
        updateData.updatedAt = new Date().toISOString();
        
        const result = await db.collection('contracts').findOneAndUpdate(
            { _id: new ObjectId(id), companyId },
            { $set: updateData },
            { returnDocument: 'after' }
        );
        
        if (!result) {
            throw new Error('Contract not found or access denied');
        }
        
        const newDoc = { ...result, id: result._id.toString() };
        return JSON.parse(JSON.stringify(newDoc));
    } catch (error) {
        console.error('Database Error:', error);
        throw new Error('Failed to update contract.');
    }
}

export async function deleteContract(id: string): Promise<void> {
    noStore();
    const db = await getDb();
    const companyId = await getCurrentUserCompanyId();
    const session = (await clientPromise)!.startSession();
    
    if (!companyId) {
        throw new Error('User not authenticated or no company associated');
    }

    try {
        await session.withTransaction(async () => {
            const contractsCollection = db.collection('contracts');
            const invoicesCollection = db.collection('invoices');

            await invoicesCollection.deleteMany({ 
                contractId: id, 
                companyId 
            }, { session });

            const result = await contractsCollection.deleteOne({ 
                _id: new ObjectId(id), 
                companyId
            }, { session });
            
            if (result.deletedCount === 0) {
                throw new Error('Contract not found during transaction.');
            }
        });
    } catch (error) {
        console.error('Transaction Error deleting contract:', error);
        throw new Error('Failed to delete contract and its associated data.');
    } finally {
        await session.endSession();
    }
}

export async function fetchContractsByVendor(vendorId: string): Promise<Contract[]> {
    noStore();
    const db = await getDb();
    const companyId = await getCurrentUserCompanyId();
    
    if (!companyId) {
        throw new Error('User not authenticated or no company associated');
    }
    
    try {
        const contracts = await db
            .collection('contracts')
            .find({ 
                companyId,
                $or: [ { "partyA.id": vendorId }, { "partyB.id": vendorId } ]
            })
            .sort({ createdAt: -1 })
            .toArray();

        return JSON.parse(JSON.stringify(contracts.map(c => ({...c, id: c._id.toString()}))));
    } catch (error) {
        console.error('Database Error:', error);
        throw new Error('Failed to fetch contracts by vendor.');
    }
}

export async function fetchInvoicesByContract(contractId: string): Promise<Invoice[]> {
    noStore();
    const db = await getDb();
    const companyId = await getCurrentUserCompanyId();
    
    if (!companyId) {
        throw new Error('User not authenticated or no company associated');
    }
    
    try {
        const invoices = await db
            .collection('invoices')
            .find({ 
                contractId, 
                companyId
            })
            .sort({ createdAt: -1 })
            .toArray();

        return JSON.parse(JSON.stringify(invoices.map(i => ({...i, id: i._id.toString()}))));
    } catch (error) {
        console.error('Database Error:', error);
        throw new Error('Failed to fetch invoices by contract.');
    }
}


export async function fetchExpiringContracts(daysAhead: number = 30): Promise<Contract[]> {
    noStore();
    const db = await getDb();
    const companyId = await getCurrentUserCompanyId();
    
    if (!companyId) {
        return [];
    }
    
    try {
        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + daysAhead);
        
        const contracts = await db
            .collection('contracts')
            .find({ 
                companyId,
                endDate: { $lte: futureDate.toISOString() },
                status: { $in: ['Active', 'Pending'] }
            })
            .sort({ endDate: 1 })
            .toArray();

        return JSON.parse(JSON.stringify(contracts.map(c => ({...c, id: c._id.toString()}))));
    } catch (error) {
        console.error('Database Error:', error);
        throw new Error('Failed to fetch expiring contracts.');
    }
}

export async function fetchPendingVendorApplications(): Promise<Array<{
    id: string;
    vendorName: string;
    submittedAt: Date;
    status: 'pending' | 'approved' | 'rejected';
    service: string;
}>> {
    noStore();
    const db = await getDb();
    const companyId = await getCurrentUserCompanyId();
    
    if (!companyId) {
        return [];
    }

    try {
        const applications = await db.collection('vendorApplications').find({
            targetCompanyId: new ObjectId(companyId),
            status: 'pending',
        }).sort({ submittedAt: -1 }).toArray();

        return applications.map(app => ({
            id: app._id.toString(),
            vendorName: app.companyName || 'Unknown Vendor',
            submittedAt: app.submittedAt || new Date(),
            status: app.status || 'pending',
            service: app.service || 'General Services',
        }));
    } catch (error) {
        console.error('Error fetching pending vendor applications:', error);
        throw new Error('Failed to fetch pending vendor applications');
    }
}

// Enhanced Vendor Operations
export async function createVendor(vendor: Partial<Vendor>): Promise<Vendor> {
    noStore();
    const db = await getDb();
    const companyId = await getCurrentUserCompanyId();
    
    if (!companyId) {
        throw new Error('User not authenticated or no company associated');
    }
    
    try {
        const vendorData = {
            ...vendor,
            companyId,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };
        
        const result = await db.collection('vendors').insertOne(vendorData);
        
        const newVendorDoc = await db.collection('vendors').findOne({ _id: result.insertedId });
        if (!newVendorDoc) throw new Error("Failed to retrieve new vendor");
        const { _id, ...rest} = newVendorDoc;

        return JSON.parse(JSON.stringify({...rest, id: _id.toString()}));
    } catch (error) {
        console.error('Database Error:', error);
        throw new Error('Failed to create vendor.');
    }
}

export async function updateVendor(id: string, updates: Partial<Vendor>): Promise<Vendor> {
    noStore();
    const db = await getDb();
    const companyId = await getCurrentUserCompanyId();
    
    if (!companyId) {
        throw new Error('User not authenticated or no company associated');
    }
    
    try {
        const { _id, ...updateData } = updates as any;
        updateData.updatedAt = new Date().toISOString();

        const result = await db.collection('vendors').findOneAndUpdate(
            { _id: new ObjectId(id), companyId },
            { $set: updateData },
            { returnDocument: 'after' }
        );
        
        if (!result) {
            throw new Error('Vendor not found or access denied');
        }
        
        const updatedDoc = { ...result, id: result._id.toString() };
        return JSON.parse(JSON.stringify(updatedDoc));
        
    } catch (error) {
        console.error('Database Error:', error);
        throw new Error('Failed to update vendor.');
    }
}

export async function deleteVendor(id: string): Promise<void> {
    noStore();
    const db = await getDb();
    const companyId = await getCurrentUserCompanyId();
    const session = (await clientPromise)!.startSession();
    
    if (!companyId) {
        throw new Error('User not authenticated or no company associated');
    }

    try {
        await session.withTransaction(async () => {
            const vendorsCollection = db.collection('vendors');
            const contractsCollection = db.collection('contracts');
            const invoicesCollection = db.collection('invoices');

            const contractsToDelete = await contractsCollection.find({ 
                companyId,
                $or: [ { "partyA.id": id }, { "partyB.id": id } ] 
            }, { session }).project({ _id: 1 }).toArray();
            const contractIdsToDelete = contractsToDelete.map(c => c._id.toString());
            
            await invoicesCollection.deleteMany({ 
                companyId,
                $or: [{ contractId: { $in: contractIdsToDelete } }, { vendorId: id }] 
            }, { session });
            
            await contractsCollection.deleteMany({ 
                companyId,
                $or: [ { "partyA.id": id }, { "partyB.id": id } ] 
            }, { session });
            
            const result = await vendorsCollection.deleteOne({ 
                _id: new ObjectId(id), 
                companyId
            }, { session });

            if (result.deletedCount === 0) {
                throw new Error('Vendor not found or access denied.');
            }
        });
    } catch (error) {
        console.error('Transaction Error deleting vendor:', error);
        throw new Error('Failed to delete vendor and its associated data.');
    } finally {
        await session.endSession();
    }
}

export async function fetchInvoicesByVendor(vendorId: string): Promise<Invoice[]> {
    noStore();
    const db = await getDb();
    const companyId = await getCurrentUserCompanyId();

    if (!companyId) {
      return [];
    }
    try {
        const invoices = await db.collection('invoices').find({ vendorId, companyId }).toArray();
        return JSON.parse(JSON.stringify(invoices.map(i => ({...i, id: i._id.toString()}))));
    } catch (error) {
        console.error("Database Error fetching invoices by vendor:", error);
        throw new Error('Failed to fetch invoices for vendor.');
    }
}


export async function searchVendors(filters: SearchFilters): Promise<Vendor[]> {
    noStore();
    const db = await getDb();
    
    try {
        const query: any = {};
        
        if (filters.query) {
            query.$or = [
                { name: { $regex: filters.query, $options: 'i' } },
                { email: { $regex: filters.query, $options: 'i' } },
                { service: { $regex: filters.query, $options: 'i' } },
            ];
        }
        
        if (filters.status && filters.status.length > 0) {
            query.status = { $in: filters.status };
        }
        
        if (filters.tags && filters.tags.length > 0) {
            query.tags = { $in: filters.tags };
        }
        
        const vendors = await db
            .collection('vendors')
            .find(query)
            .sort({ name: 1 })
            .toArray();

        return JSON.parse(JSON.stringify(vendors.map(v => ({...v, id: v._id.toString()}))));
    } catch (error) {
        console.error('Database Error:', error);
        throw new Error('Failed to search vendors.');
    }
}

// Notification Operations
export async function createNotification(notification: Partial<Notification>): Promise<Notification> {
    noStore();
    const db = await getDb();
    const companyId = await getCurrentUserCompanyId();
    
    if (!companyId) {
        throw new Error('User not authenticated or no company associated');
    }
    
    try {
        const notificationData = {
            ...notification,
            companyId,
            createdAt: new Date().toISOString(),
            isRead: false,
        };
        
        const result = await db.collection('notifications').insertOne(notificationData);
        
        const newNotification = await db.collection('notifications').findOne({ _id: result.insertedId });
        return JSON.parse(JSON.stringify(newNotification));
    } catch (error) {
        console.error('Database Error:', error);
        throw new Error('Failed to create notification.');
    }
}

export async function fetchNotifications(userId: string): Promise<Notification[]> {
    noStore();
    const db = await getDb();
    const companyId = await getCurrentUserCompanyId();
    
    if (!companyId) {
        return [];
    }
    
    try {
        const notifications = await db
            .collection('notifications')
            .find({ 
                userId, 
                companyId
            })
            .sort({ createdAt: -1 })
            .limit(50)
            .toArray();

        return JSON.parse(JSON.stringify(notifications));
    } catch (error) {
        console.error('Database Error:', error);
        throw new Error('Failed to fetch notifications.');
    }
}

export async function markNotificationAsRead(id: string): Promise<void> {
    noStore();
    const db = await getDb();
    const companyId = await getCurrentUserCompanyId();
    
    if (!companyId) {
        throw new Error('User not authenticated or no company associated');
    }
    
    try {
        await db.collection('notifications').updateOne(
            { 
                _id: new ObjectId(id), 
                companyId
            },
            { $set: { isRead: true } }
        );
    } catch (error) {
        console.error('Database Error:', error);
        throw new Error('Failed to mark notification as read.');
    }
}

// Action Log Operations
export async function logAction(action: Partial<ActionLog>): Promise<void> {
    noStore();
    const db = await getDb();
    const companyId = await getCurrentUserCompanyId();
    
    if (!companyId) {
        return;
    }
    
    try {
        const actionData = {
            ...action,
            companyId,
            timestamp: new Date().toISOString(),
        };
        
        await db.collection('action_logs').insertOne(actionData);
    } catch (error) {
        console.error('Database Error:', error);
    }
}

export async function fetchRecentActions(userId: string, limit: number = 10): Promise<ActionLog[]> {
    noStore();
    const db = await getDb();
    const companyId = await getCurrentUserCompanyId();
    
    if (!companyId) {
        return [];
    }
    
    try {
        const actions = await db
            .collection('action_logs')
            .find({ 
                userId, 
                companyId
            })
            .sort({ timestamp: -1 })
            .limit(limit)
            .toArray();

        return JSON.parse(JSON.stringify(actions));
    } catch (error) {
        console.error('Database Error:', error);
        throw new Error('Failed to fetch recent actions.');
    }
}

// Enhanced Analytics Operations
export async function fetchAnalyticsData() {
    noStore();
    const db = await getDb();
    const companyId = await getCurrentUserCompanyId();
    
    if (!companyId) {
       return {
            activeContracts: 0,
            expiringContracts: 0,
            vendorsByStatus: [],
            invoicesByMonth: []
        };
    }

    try {
        const invoicesCollection = db.collection('invoices');
        const vendorsCollection = db.collection('vendors');
        const contractsCollection = db.collection('contracts');

        const activeContractsPromise = contractsCollection.countDocuments({ 
            status: 'Active',
            companyId
        });
        const expiringContractsPromise = contractsCollection.countDocuments({ 
            endDate: { $lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() },
            status: 'Active',
            companyId
        });
        
        const vendorsByStatusPromise = vendorsCollection.aggregate([
            { $match: { companyId } },
            { $group: { _id: '$status', count: { $sum: 1 } } }
        ]).toArray();
        
        const invoicesByMonthPromise = invoicesCollection.aggregate([
            { $match: { companyId } },
            {
                $group: {
                    _id: {
                        year: { $year: { $dateFromString: { dateString: '$invoiceDate' } } },
                        month: { $month: { $dateFromString: { dateString: '$invoiceDate' } } }
                    },
                    total: { $sum: '$totalAmount' },
                    count: { $sum: 1 }
                }
            },
            { $sort: { '_id.year': 1, '_id.month': 1 } }
        ]).toArray();

        const data = await Promise.all([
            activeContractsPromise,
            expiringContractsPromise,
            vendorsByStatusPromise,
            invoicesByMonthPromise
        ]);

        return {
            activeContracts: data[0],
            expiringContracts: data[1],
            vendorsByStatus: data[2],
            invoicesByMonth: data[3]
        };
    } catch (error) {
        console.error('Database Error:', error);
        throw new Error('Failed to fetch analytics data.');
    }
}
