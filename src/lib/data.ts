'use server';

import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import type { Invoice, Vendor, User, Contract, Company, Notification, ActionLog, SearchFilters } from '@/lib/types';
import { unstable_noStore as noStore } from 'next/cache';

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

export async function fetchInvoices(): Promise<Invoice[]> {
    noStore();
    const db = await getDb();

    try {
        const invoices = await db
            .collection('invoices')
            .find({})
            .sort({ invoiceDate: -1 })
            .toArray();
        
        return JSON.parse(JSON.stringify(invoices));

    } catch (error) {
        console.error('Database Error:', error);
        throw new Error('Failed to fetch invoices from database.');
    }
}

export async function fetchVendors(): Promise<Vendor[]> {
    noStore();
    const db = await getDb();
    
    try {
        const vendors = await db
            .collection('vendors')
            .find({})
            .sort({ name: 1 })
            .toArray();

        // Map _id to id and ensure proper serialization
        return vendors.map(vendor => ({
            ...vendor,
            id: vendor._id.toString(),
            _id: undefined, // remove _id to avoid confusion
        })) as Vendor[];

    } catch (error) {
        console.error('Database Error:', error);
        throw new Error('Failed to fetch vendors from database.');
    }
}

export async function fetchCardData() {
    noStore();
    const db = await getDb();

    try {
        const invoicesCollection = db.collection('invoices');
        const vendorsCollection = db.collection('vendors');

        const totalSpendPromise = invoicesCollection.aggregate([
            { $match: { status: 'Paid' } },
            { $group: { _id: null, total: { $sum: '$invoiceAmount' } } }
        ]).toArray();
        
        const activeVendorsPromise = vendorsCollection.countDocuments();
        
        const unpaidInvoicesPromise = invoicesCollection.countDocuments({ 
          status: { $in: ['Unpaid', 'Pending', 'Overdue'] } 
        });
        
        const nextPaymentDuePromise = invoicesCollection.find({ 
          status: { $in: ['Unpaid', 'Pending', 'Overdue'] } 
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


export async function getUser(): Promise<User> {
    noStore();
    const db = await getDb();

    const defaultUser = {
        _id: new ObjectId(),
        name: 'Alicia Cook',
        email: 'alicia@example.com',
        image: 'https://placehold.co/100x100.png'
    };

    try {
        const usersCollection = db.collection('users');
        const user = await usersCollection.findOne({});

        if (!user) {
            await usersCollection.insertOne(defaultUser);
            return JSON.parse(JSON.stringify({ ...defaultUser, id: defaultUser._id.toString() }));
        }

        return JSON.parse(JSON.stringify(user));

    } catch (error) {
        console.error('Database Error fetching user:', error);
        throw new Error('Failed to fetch user from database.');
    }
}

export async function fetchContracts(): Promise<Contract[]> {
    noStore();
    const db = await getDb();
    
    try {
        const contracts = await db
            .collection('contracts')
            .find({})
            .sort({ createdAt: -1 })
            .toArray();

        return JSON.parse(JSON.stringify(contracts));
    } catch (error) {
        console.error('Database Error:', error);
        throw new Error('Failed to fetch contracts from database.');
    }
}

export async function createInvoice(invoice: Partial<Invoice>): Promise<Invoice> {
    noStore();
    const db = await getDb();
    
    try {
        const invoiceData = {
            ...invoice,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };
        
        const result = await db.collection('invoices').insertOne(invoiceData);
        
        const newInvoice = await db.collection('invoices').findOne({ _id: result.insertedId });
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
    
    try {
        const { id: _, ...updateData } = updates;
        updateData.updatedAt = new Date().toISOString();
        
        const result = await db.collection('invoices').findOneAndUpdate(
            { _id: new ObjectId(id) },
            { $set: updateData },
            { returnDocument: 'after' }
        );
        
        if (!result) {
            throw new Error('Invoice not found');
        }
        
        return JSON.parse(JSON.stringify(result));
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
    
    try {
        const result = await db.collection('invoices').deleteOne({ _id: new ObjectId(id) });
        
        if (result.deletedCount === 0) {
            throw new Error('Invoice not found');
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
    
    try {
        const updateData = {
            status,
            paymentStatus: status === 'Paid' ? 'Paid' : status === 'Overdue' ? 'Overdue' : 'Pending',
            updatedAt: new Date().toISOString(),
        };
        
        const result = await db.collection('invoices').updateOne(
            { _id: new ObjectId(id) },
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
    
    try {
        const company = await db.collection('companies').findOne({});
        
        if (!company) {
            return null;
        }
        
        return JSON.parse(JSON.stringify(company));
    } catch (error) {
        console.error('Database Error:', error);
        throw new Error('Failed to fetch company from database.');
    }
}

export async function createCompany(company: Partial<Company>): Promise<Company> {
    noStore();
    const db = await getDb();
    
    try {
        const companyData = {
            ...company,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };
        
        const result = await db.collection('companies').insertOne(companyData);
        
        const newCompany = await db.collection('companies').findOne({ _id: result.insertedId });
        return JSON.parse(JSON.stringify(newCompany));
    } catch (error) {
        console.error('Database Error:', error);
        throw new Error('Failed to create company.');
    }
}

export async function updateCompany(id: string, updates: Partial<Company>): Promise<Company> {
    noStore();
    const db = await getDb();
    
    try {
        const { id: _, ...updateData } = updates;
        updateData.updatedAt = new Date().toISOString();

        const result = await db.collection('companies').findOneAndUpdate(
            { _id: new ObjectId(id) },
            { $set: updateData },
            { returnDocument: 'after' }
        );
        
        if (!result) {
            throw new Error('Company not found');
        }
        
        return JSON.parse(JSON.stringify(result));
    } catch (error) {
        console.error('Database Error:', error);
        throw new Error('Failed to update company.');
    }
}

// Enhanced Contract Operations
export async function createContract(contract: Partial<Contract>): Promise<Contract> {
    noStore();
    const db = await getDb();
    
    try {
        const contractData = {
            ...contract,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };
        
        const result = await db.collection('contracts').insertOne(contractData);
        
        const newContract = await db.collection('contracts').findOne({ _id: result.insertedId });
        return JSON.parse(JSON.stringify(newContract));
    } catch (error) {
        console.error('Database Error:', error);
        throw new Error('Failed to create contract.');
    }
}

export async function updateContract(id: string, updates: Partial<Contract>): Promise<Contract> {
    noStore();
    const db = await getDb();
    
    try {
        const { _id, ...updateData } = updates as any;
        updateData.updatedAt = new Date().toISOString();
        
        const result = await db.collection('contracts').findOneAndUpdate(
            { _id: new ObjectId(id) },
            { $set: updateData },
            { returnDocument: 'after' }
        );
        
        if (!result) {
            throw new Error('Contract not found');
        }
        
        return JSON.parse(JSON.stringify(result));
    } catch (error) {
        console.error('Database Error:', error);
        throw new Error('Failed to update contract.');
    }
}

export async function deleteContract(id: string): Promise<void> {
    noStore();
    const db = await getDb();
    const session = (await clientPromise)!.startSession();

    try {
        await session.withTransaction(async () => {
            const contractsCollection = db.collection('contracts');
            const invoicesCollection = db.collection('invoices');

            // Delete invoices associated with the contract
            await invoicesCollection.deleteMany({ contractId: id }, { session });

            // Delete the contract itself
            const result = await contractsCollection.deleteOne({ _id: new ObjectId(id) }, { session });
            
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
    
    try {
        const contracts = await db
            .collection('contracts')
            .find({ vendorId })
            .sort({ createdAt: -1 })
            .toArray();

        return JSON.parse(JSON.stringify(contracts));
    } catch (error) {
        console.error('Database Error:', error);
        throw new Error('Failed to fetch contracts by vendor.');
    }
}

export async function fetchInvoicesByContract(contractId: string): Promise<Invoice[]> {
    noStore();
    const db = await getDb();
    
    try {
        const invoices = await db
            .collection('invoices')
            .find({ contractId })
            .sort({ createdAt: -1 })
            .toArray();

        return JSON.parse(JSON.stringify(invoices));
    } catch (error) {
        console.error('Database Error:', error);
        throw new Error('Failed to fetch invoices by contract.');
    }
}


export async function fetchExpiringContracts(daysAhead: number = 30): Promise<Contract[]> {
    noStore();
    const db = await getDb();
    
    try {
        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + daysAhead);
        
        const contracts = await db
            .collection('contracts')
            .find({ 
                endDate: { $lte: futureDate.toISOString() },
                status: { $in: ['Active', 'Pending'] }
            })
            .sort({ endDate: 1 })
            .toArray();

        return JSON.parse(JSON.stringify(contracts));
    } catch (error) {
        console.error('Database Error:', error);
        throw new Error('Failed to fetch expiring contracts.');
    }
}

// Enhanced Vendor Operations
export async function createVendor(vendor: Partial<Vendor>): Promise<Vendor> {
    noStore();
    const db = await getDb();
    
    try {
        const vendorData = {
            ...vendor,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };
        
        const result = await db.collection('vendors').insertOne(vendorData);
        
        const newVendor = await db.collection('vendors').findOne({ _id: result.insertedId });
        return JSON.parse(JSON.stringify(newVendor));
    } catch (error) {
        console.error('Database Error:', error);
        throw new Error('Failed to create vendor.');
    }
}

export async function updateVendor(id: string, updates: Partial<Vendor>): Promise<Vendor> {
    noStore();
    const db = await getDb();
    const session = (await clientPromise)!.startSession();

    try {
        let updatedVendor: Vendor | null = null;
        await session.withTransaction(async () => {
            const vendorsCollection = db.collection('vendors');
            const contractsCollection = db.collection('contracts');
            const invoicesCollection = db.collection('invoices');

            const { id: _, ...updateData } = updates;
            updateData.updatedAt = new Date().toISOString();
            
            const result = await vendorsCollection.findOneAndUpdate(
                { _id: new ObjectId(id) },
                { $set: updateData },
                { returnDocument: 'after', session }
            );
            
            if (!result) {
                throw new Error('Vendor not found');
            }
            
            const serializedResult = JSON.parse(JSON.stringify(result));
            updatedVendor = { ...serializedResult, id: serializedResult._id.toString() } as Vendor;
            
            // Propagate vendor name change to associated contracts and invoices
            if (updates.name) {
                await contractsCollection.updateMany(
                    { vendorId: id },
                    { $set: { vendorName: updates.name } },
                    { session }
                );
                await invoicesCollection.updateMany(
                    { vendorId: id },
                    { $set: { vendorName: updates.name } },
                    { session }
                );
            }
        });
        
        if (!updatedVendor) {
            throw new Error("Vendor update failed within transaction.");
        }
        
        return updatedVendor;
        
    } catch (error) {
        console.error('Database Error:', error);
        throw new Error('Failed to update vendor and associated data.');
    } finally {
        await session.endSession();
    }
}

export async function deleteVendor(id: string): Promise<void> {
    noStore();
    const db = await getDb();
    const session = (await clientPromise)!.startSession();

    try {
        await session.withTransaction(async () => {
            const vendorsCollection = db.collection('vendors');
            const contractsCollection = db.collection('contracts');
            const invoicesCollection = db.collection('invoices');

            // Find all contracts associated with the vendor
            const contractsToDelete = await contractsCollection.find({ vendorId: id }, { session }).project({ _id: 1 }).toArray();
            const contractIdsToDelete = contractsToDelete.map(c => c._id.toString());
            
            // Delete all invoices associated with the vendor's contracts OR directly to the vendor
            await invoicesCollection.deleteMany({ $or: [{ contractId: { $in: contractIdsToDelete } }, { vendorId: id }] }, { session });
            
            // Delete all contracts associated with the vendor
            await contractsCollection.deleteMany({ vendorId: id }, { session });
            
            // Delete the vendor itself
            const result = await vendorsCollection.deleteOne({ _id: new ObjectId(id) }, { session });

            if (result.deletedCount === 0) {
                throw new Error('Vendor not found during transaction.');
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
    try {
        const invoices = await db.collection('invoices').find({ vendorId }).toArray();
        return JSON.parse(JSON.stringify(invoices));
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

        return JSON.parse(JSON.stringify(vendors));
    } catch (error) {
        console.error('Database Error:', error);
        throw new Error('Failed to search vendors.');
    }
}

// Notification Operations
export async function createNotification(notification: Partial<Notification>): Promise<Notification> {
    noStore();
    const db = await getDb();
    
    try {
        const notificationData = {
            ...notification,
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
    
    try {
        const notifications = await db
            .collection('notifications')
            .find({ userId })
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
    
    try {
        await db.collection('notifications').updateOne(
            { _id: new ObjectId(id) },
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
    
    try {
        const actionData = {
            ...action,
            timestamp: new Date().toISOString(),
        };
        
        await db.collection('action_logs').insertOne(actionData);
    } catch (error) {
        console.error('Database Error:', error);
        // Don't throw error for action logging to avoid disrupting main flow
    }
}

export async function fetchRecentActions(userId: string, limit: number = 10): Promise<ActionLog[]> {
    noStore();
    const db = await getDb();
    
    try {
        const actions = await db
            .collection('action_logs')
            .find({ userId })
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

    try {
        const invoicesCollection = db.collection('invoices');
        const vendorsCollection = db.collection('vendors');
        const contractsCollection = db.collection('contracts');

        // Contract analytics
        const activeContractsPromise = contractsCollection.countDocuments({ status: 'Active' });
        const expiringContractsPromise = contractsCollection.countDocuments({ 
            endDate: { $lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() },
            status: 'Active'
        });
        
        // Vendor analytics
        const vendorsByStatusPromise = vendorsCollection.aggregate([
            { $group: { _id: '$status', count: { $sum: 1 } } }
        ]).toArray();
        
        // Invoice analytics by month
        const invoicesByMonthPromise = invoicesCollection.aggregate([
            {
                $group: {
                    _id: {
                        year: { $year: { $dateFromString: { dateString: '$invoiceDate' } } },
                        month: { $month: { $dateFromString: { dateString: '$invoiceDate' } } }
                    },
                    total: { $sum: '$invoiceAmount' },
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
