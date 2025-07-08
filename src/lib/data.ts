'use server';

import clientPromise from '@/lib/mongodb';
import type { Invoice, Vendor } from '@/lib/types';
import { unstable_noStore as noStore } from 'next/cache';

const getDb = async () => {
    if (!clientPromise) {
        return null;
    }
    try {
        const client = await clientPromise;
        return client.db();
    } catch (error) {
        // This will catch the connection error and prevent the app from crashing.
        // The warning in mongodb.ts is sufficient to inform the user.
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
        
        return invoices.map(invoice => ({
            ...invoice,
            id: invoice._id.toString(),
            _id: undefined,
        })) as unknown as Invoice[];

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

        return vendors.map(vendor => ({
            ...vendor,
            id: vendor._id.toString(),
            _id: undefined,
        })) as unknown as Vendor[];
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

        if (nextPaymentDue) {
            nextPaymentDue = {
                ...nextPaymentDue,
                id: nextPaymentDue._id.toString(),
                _id: undefined,
            };
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
