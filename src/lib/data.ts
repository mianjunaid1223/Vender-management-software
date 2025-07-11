'use server';

import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import type { Invoice, Vendor, User, Contract } from '@/lib/types';
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
        
        return invoices.map(invoice => {
            const { _id, ...rest } = invoice;
            return {
                ...rest,
                id: _id.toString(),
            };
        }) as Invoice[];

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

        return vendors.map(vendor => {
            const { _id, ...rest } = vendor;
            return {
                ...rest,
                id: _id.toString(),
            };
        }) as Vendor[];
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

        let nextPaymentDueFormatted = null;
        if (nextPaymentDue) {
            const { _id, ...rest } = nextPaymentDue;
            nextPaymentDueFormatted = {
                ...rest,
                id: _id.toString(),
            };
        }

        return {
            totalSpend,
            activeVendors,
            unpaidInvoices,
            nextPaymentDue: nextPaymentDueFormatted,
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
        id: 'default-user',
        name: 'Alicia Cook',
        email: 'alicia@example.com',
        image: 'https://placehold.co/100x100.png'
    };

    try {
        const usersCollection = db.collection('users');
        // In a real app, you'd find a user based on session/token
        const user = await usersCollection.findOne({});

        if (!user) {
            // Seed a user if none exists for demonstration
            await usersCollection.insertOne(defaultUser);
            return { ...defaultUser, id: defaultUser.id };
        }

        return {
            id: user._id.toString(),
            name: user.name,
            email: user.email,
            image: user.image || 'https://placehold.co/100x100.png',
        } as User;

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

        return contracts.map(contract => {
            const { _id, ...rest } = contract;
            return {
                ...rest,
                id: _id.toString(),
            };
        }) as Contract[];
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
        
        return {
            ...invoiceData,
            id: result.insertedId.toString(),
        } as Invoice;
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
        const updateData = {
            ...updates,
            updatedAt: new Date().toISOString(),
        };
        
        const result = await db.collection('invoices').findOneAndUpdate(
            { _id: new ObjectId(id) },
            { $set: updateData },
            { returnDocument: 'after' }
        );
        
        if (!result || !result.value) {
            throw new Error('Invoice not found');
        }
        
        const { _id, ...rest } = result.value;
        return {
            ...rest,
            id: _id.toString(),
        } as Invoice;
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
