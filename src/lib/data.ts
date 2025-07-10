'use server';

import clientPromise from '@/lib/mongodb';
import type { Invoice, Vendor, User } from '@/lib/types';
import { unstable_noStore as noStore } from 'next/cache';

export const getDb = async () => {
    if (!clientPromise) {
        return null;
    }
    try {
        const client = await clientPromise;
        return client.db('vendorverse');
    } catch (error) {
        console.error('Database connection failed:', error);
        return null;
    }
}

export async function fetchInvoices(): Promise<Invoice[]> {
    noStore();
    const db = await getDb();
    if (!db) return [];

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
        if (error instanceof Error) {
            throw new Error(error.message);
        }
        throw new Error('Failed to fetch invoices.');
    }
}

export async function fetchVendors(): Promise<Vendor[]> {
    noStore();
    const db = await getDb();
    if (!db) return [];
    
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
        if (error instanceof Error) {
            throw new Error(error.message);
        }
        throw new Error('Failed to fetch vendors.');
    }
}

export async function fetchCardData() {
    noStore();
    const db = await getDb();
    if (!db) {
        return {
            totalSpend: 0,
            activeVendors: 0,
            unpaidInvoices: 0,
            nextPaymentDue: null,
        }
    }

    try {
        const invoicesCollection = db.collection('invoices');
        const vendorsCollection = db.collection('vendors');

        const totalSpendPromise = invoicesCollection.aggregate([
            { $match: { status: 'Paid' } },
            { $group: { _id: null, total: { $sum: '$invoiceAmount' } } }
        ]).toArray();
        
        const activeVendorsPromise = vendorsCollection.countDocuments();
        
        const unpaidInvoicesPromise = invoicesCollection.countDocuments({ status: { $in: ['Unpaid', 'Overdue'] } });
        
        const nextPaymentDuePromise = invoicesCollection.find({ status: { $in: ['Unpaid', 'Overdue'] } })
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

    if (!db) {
        return defaultUser;
    }

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
        // Return default user on error to allow UI to render
        return defaultUser;
    }
}
