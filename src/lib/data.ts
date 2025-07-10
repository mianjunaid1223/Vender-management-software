'use server';

import clientPromise from '@/lib/mongodb';
import type { 
  Invoice, 
  Vendor, 
  User, 
  Contract, 
  ComplianceDocument, 
  AuditLog, 
  Notification,
  VendorPerformanceReport,
  VendorOnboarding
} from '@/lib/types';
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

// Vendor Management Functions
export async function fetchVendors(): Promise<Vendor[]> {
    noStore();
    const db = await getDb();
    if (!db) return [];
    
    try {
        const vendors = await db
            .collection('vendors')
            .find({ isActive: true })
            .sort({ name: 1 })
            .toArray();

        return vendors.map(vendor => {
            const { _id, ...rest } = vendor;
            return {
                ...rest,
                id: _id.toString(),
                createdAt: new Date(rest.createdAt),
                updatedAt: new Date(rest.updatedAt),
                lastReviewDate: rest.lastReviewDate ? new Date(rest.lastReviewDate) : undefined,
            };
        }) as Vendor[];
    } catch (error) {
        console.error('Database Error:', error);
        throw new Error('Failed to fetch vendors.');
    }
}

export async function fetchVendorById(id: string): Promise<Vendor | null> {
    noStore();
    const db = await getDb();
    if (!db) return null;
    
    try {
        const vendor = await db.collection('vendors').findOne({ _id: id });
        if (!vendor) return null;
        
        const { _id, ...rest } = vendor;
        return {
            ...rest,
            id: _id.toString(),
            createdAt: new Date(rest.createdAt),
            updatedAt: new Date(rest.updatedAt),
            lastReviewDate: rest.lastReviewDate ? new Date(rest.lastReviewDate) : undefined,
        } as Vendor;
    } catch (error) {
        console.error('Database Error:', error);
        throw new Error('Failed to fetch vendor.');
    }
}

export async function createVendor(vendor: Omit<Vendor, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const db = await getDb();
    if (!db) throw new Error('Database not available');
    
    try {
        const now = new Date();
        const result = await db.collection('vendors').insertOne({
            ...vendor,
            createdAt: now,
            updatedAt: now,
        });
        
        await logAuditEvent('vendor_created', 'Vendor', result.insertedId.toString(), {
            vendorName: vendor.name,
            email: vendor.email,
        });
        
        return result.insertedId.toString();
    } catch (error) {
        console.error('Database Error:', error);
        throw new Error('Failed to create vendor.');
    }
}

export async function updateVendor(id: string, updates: Partial<Vendor>): Promise<void> {
    const db = await getDb();
    if (!db) throw new Error('Database not available');
    
    try {
        const result = await db.collection('vendors').updateOne(
            { _id: id },
            { 
                $set: { 
                    ...updates, 
                    updatedAt: new Date() 
                } 
            }
        );
        
        if (result.matchedCount === 0) {
            throw new Error('Vendor not found');
        }
        
        await logAuditEvent('vendor_updated', 'Vendor', id, updates);
    } catch (error) {
        console.error('Database Error:', error);
        throw new Error('Failed to update vendor.');
    }
}

// Invoice Management Functions
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
                createdAt: new Date(rest.createdAt),
                updatedAt: new Date(rest.updatedAt),
                paymentDate: rest.paymentDate ? new Date(rest.paymentDate) : undefined,
                approvedAt: rest.approvedAt ? new Date(rest.approvedAt) : undefined,
            };
        }) as Invoice[];
    } catch (error) {
        console.error('Database Error:', error);
        throw new Error('Failed to fetch invoices.');
    }
}

export async function fetchInvoicesByVendor(vendorId: string): Promise<Invoice[]> {
    noStore();
    const db = await getDb();
    if (!db) return [];

    try {
        const invoices = await db
            .collection('invoices')
            .find({ vendorId })
            .sort({ invoiceDate: -1 })
            .toArray();
        
        return invoices.map(invoice => {
            const { _id, ...rest } = invoice;
            return {
                ...rest,
                id: _id.toString(),
                createdAt: new Date(rest.createdAt),
                updatedAt: new Date(rest.updatedAt),
                paymentDate: rest.paymentDate ? new Date(rest.paymentDate) : undefined,
                approvedAt: rest.approvedAt ? new Date(rest.approvedAt) : undefined,
            };
        }) as Invoice[];
    } catch (error) {
        console.error('Database Error:', error);
        throw new Error('Failed to fetch invoices for vendor.');
    }
}

// Contract Management Functions
export async function fetchContracts(): Promise<Contract[]> {
    noStore();
    const db = await getDb();
    if (!db) return [];

    try {
        const contracts = await db
            .collection('contracts')
            .find({})
            .sort({ endDate: 1 })
            .toArray();
        
        return contracts.map(contract => {
            const { _id, ...rest } = contract;
            return {
                ...rest,
                id: _id.toString(),
                startDate: new Date(rest.startDate),
                endDate: new Date(rest.endDate),
                createdAt: new Date(rest.createdAt),
                updatedAt: new Date(rest.updatedAt),
            };
        }) as Contract[];
    } catch (error) {
        console.error('Database Error:', error);
        throw new Error('Failed to fetch contracts.');
    }
}

export async function fetchExpiringContracts(days: number = 30): Promise<Contract[]> {
    noStore();
    const db = await getDb();
    if (!db) return [];

    try {
        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + days);
        
        const contracts = await db
            .collection('contracts')
            .find({
                status: 'Active',
                endDate: { $lte: futureDate }
            })
            .sort({ endDate: 1 })
            .toArray();
        
        return contracts.map(contract => {
            const { _id, ...rest } = contract;
            return {
                ...rest,
                id: _id.toString(),
                startDate: new Date(rest.startDate),
                endDate: new Date(rest.endDate),
                createdAt: new Date(rest.createdAt),
                updatedAt: new Date(rest.updatedAt),
            };
        }) as Contract[];
    } catch (error) {
        console.error('Database Error:', error);
        throw new Error('Failed to fetch expiring contracts.');
    }
}

// Compliance Management Functions
export async function fetchComplianceDocuments(vendorId?: string): Promise<ComplianceDocument[]> {
    noStore();
    const db = await getDb();
    if (!db) return [];

    try {
        const query = vendorId ? { vendorId } : {};
        const documents = await db
            .collection('complianceDocuments')
            .find(query)
            .sort({ expiryDate: 1 })
            .toArray();
        
        return documents.map(doc => {
            const { _id, ...rest } = doc;
            return {
                ...rest,
                id: _id.toString(),
                expiryDate: rest.expiryDate ? new Date(rest.expiryDate) : undefined,
                uploadedAt: new Date(rest.uploadedAt),
            };
        }) as ComplianceDocument[];
    } catch (error) {
        console.error('Database Error:', error);
        throw new Error('Failed to fetch compliance documents.');
    }
}

// Notification Management
export async function fetchNotifications(userId: string): Promise<Notification[]> {
    noStore();
    const db = await getDb();
    if (!db) return [];

    try {
        const notifications = await db
            .collection('notifications')
            .find({ userId, expiresAt: { $gt: new Date() } })
            .sort({ createdAt: -1 })
            .toArray();
        
        return notifications.map(notification => {
            const { _id, ...rest } = notification;
            return {
                ...rest,
                id: _id.toString(),
                createdAt: new Date(rest.createdAt),
                expiresAt: rest.expiresAt ? new Date(rest.expiresAt) : undefined,
            };
        }) as Notification[];
    } catch (error) {
        console.error('Database Error:', error);
        throw new Error('Failed to fetch notifications.');
    }
}

export async function createNotification(notification: Omit<Notification, 'id'>): Promise<string> {
    const db = await getDb();
    if (!db) throw new Error('Database not available');
    
    try {
        const result = await db.collection('notifications').insertOne(notification);
        return result.insertedId.toString();
    } catch (error) {
        console.error('Database Error:', error);
        throw new Error('Failed to create notification.');
    }
}

// Performance Analytics
export async function generateVendorPerformanceReport(vendorId: string, months: number = 12): Promise<VendorPerformanceReport> {
    noStore();
    const db = await getDb();
    if (!db) throw new Error('Database not available');

    try {
        const endDate = new Date();
        const startDate = new Date();
        startDate.setMonth(startDate.getMonth() - months);

        const invoicesPromise = db.collection('invoices').find({
            vendorId,
            invoiceDate: { $gte: startDate.toISOString(), $lte: endDate.toISOString() }
        }).toArray();

        const vendorPromise = db.collection('vendors').findOne({ _id: vendorId });

        const [invoices, vendor] = await Promise.all([invoicesPromise, vendorPromise]);

        if (!vendor) {
            throw new Error('Vendor not found');
        }

        const totalSpend = invoices.reduce((sum, inv) => sum + (inv.totalAmount || inv.invoiceAmount), 0);
        const paidInvoices = invoices.filter(inv => inv.status === 'Paid');
        const onTimePayments = paidInvoices.filter(inv => 
            inv.paymentDate && new Date(inv.paymentDate) <= new Date(inv.invoiceDueDate)
        );

        const metrics = {
            totalSpend,
            invoiceCount: invoices.length,
            averageInvoiceValue: invoices.length > 0 ? totalSpend / invoices.length : 0,
            onTimePaymentRate: paidInvoices.length > 0 ? (onTimePayments.length / paidInvoices.length) * 100 : 0,
            onTimeDeliveryRate: vendor.performanceMetrics?.onTimeDeliveryRate || 0,
            qualityScore: vendor.performanceMetrics?.qualityScore || 0,
            responseTime: vendor.performanceMetrics?.responseTime || 0,
            complianceScore: vendor.complianceStatus === 'Compliant' ? 100 : 
                           vendor.complianceStatus === 'Needs Review' ? 50 : 0,
        };

        return {
            vendorId,
            period: { start: startDate, end: endDate },
            metrics,
            trends: {
                spendTrend: 'stable', // This would be calculated with historical data
                performanceTrend: 'stable', // This would be calculated with historical data
            },
            recommendations: generateRecommendations(metrics, vendor),
            riskFactors: generateRiskFactors(metrics, vendor),
        };
    } catch (error) {
        console.error('Database Error:', error);
        throw new Error('Failed to generate performance report.');
    }
}

function generateRecommendations(metrics: any, vendor: any): string[] {
    const recommendations: string[] = [];
    
    if (metrics.onTimePaymentRate < 80) {
        recommendations.push('Consider negotiating better payment terms or implementing automated payment reminders.');
    }
    
    if (metrics.qualityScore < 70) {
        recommendations.push('Schedule a quality review meeting to address performance issues.');
    }
    
    if (vendor.complianceStatus === 'Needs Review') {
        recommendations.push('Update compliance documentation and review vendor certifications.');
    }
    
    return recommendations;
}

function generateRiskFactors(metrics: any, vendor: any): string[] {
    const risks: string[] = [];
    
    if (vendor.riskLevel === 'High') {
        risks.push('High risk classification requires additional oversight.');
    }
    
    if (metrics.onTimePaymentRate < 50) {
        risks.push('Poor payment history may indicate financial instability.');
    }
    
    if (vendor.complianceStatus === 'Non-Compliant') {
        risks.push('Non-compliance status poses regulatory and operational risks.');
    }
    
    return risks;
}

// Audit Trail
export async function logAuditEvent(
    action: string,
    entityType: 'Vendor' | 'Invoice' | 'Contract' | 'User',
    entityId: string,
    changes?: Record<string, any>,
    userId: string = 'system'
): Promise<void> {
    const db = await getDb();
    if (!db) return;
    
    try {
        await db.collection('auditLogs').insertOne({
            userId,
            action,
            entityType,
            entityId,
            changes,
            timestamp: new Date(),
            ipAddress: undefined, // Would be passed from request context
            userAgent: undefined, // Would be passed from request context
        });
    } catch (error) {
        console.error('Failed to log audit event:', error);
    }
}

export async function fetchAuditLogs(entityType?: string, entityId?: string): Promise<AuditLog[]> {
    noStore();
    const db = await getDb();
    if (!db) return [];

    try {
        const query: any = {};
        if (entityType) query.entityType = entityType;
        if (entityId) query.entityId = entityId;
        
        const logs = await db
            .collection('auditLogs')
            .find(query)
            .sort({ timestamp: -1 })
            .limit(100)
            .toArray();
        
        return logs.map(log => {
            const { _id, ...rest } = log;
            return {
                ...rest,
                id: _id.toString(),
                timestamp: new Date(rest.timestamp),
            };
        }) as AuditLog[];
    } catch (error) {
        console.error('Database Error:', error);
        throw new Error('Failed to fetch audit logs.');
    }
}

// Enhanced dashboard card data
export async function fetchCardData() {
    noStore();
    const db = await getDb();
    if (!db) {
        return {
            totalSpend: 0,
            activeVendors: 0,
            unpaidInvoices: 0,
            nextPaymentDue: null,
            contractsExpiring: 0,
            complianceIssues: 0,
            highRiskVendors: 0,
            avgPaymentDays: 0,
        }
    }

    try {
        const invoicesCollection = db.collection('invoices');
        const vendorsCollection = db.collection('vendors');
        const contractsCollection = db.collection('contracts');

        const thirtyDaysFromNow = new Date();
        thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

        const [
            totalSpendResult,
            activeVendors,
            unpaidInvoices,
            nextPaymentDue,
            contractsExpiring,
            complianceIssues,
            highRiskVendors,
            avgPaymentResult
        ] = await Promise.all([
            invoicesCollection.aggregate([
                { $match: { status: 'Paid' } },
                { $group: { _id: null, total: { $sum: '$totalAmount' } } }
            ]).toArray(),
            vendorsCollection.countDocuments({ isActive: true }),
            invoicesCollection.countDocuments({ status: { $in: ['Unpaid', 'Overdue'] } }),
            invoicesCollection.find({ status: { $in: ['Unpaid', 'Overdue'] } })
                .sort({ invoiceDueDate: 1 })
                .limit(1)
                .toArray(),
            contractsCollection.countDocuments({ 
                status: 'Active',
                endDate: { $lte: thirtyDaysFromNow }
            }),
            vendorsCollection.countDocuments({ complianceStatus: { $ne: 'Compliant' } }),
            vendorsCollection.countDocuments({ riskLevel: 'High' }),
            invoicesCollection.aggregate([
                { $match: { status: 'Paid', paymentDate: { $exists: true } } },
                { $addFields: { 
                    paymentDays: { 
                        $divide: [
                            { $subtract: ['$paymentDate', '$invoiceDueDate'] },
                            1000 * 60 * 60 * 24
                        ]
                    }
                }},
                { $group: { _id: null, avgDays: { $avg: '$paymentDays' } } }
            ]).toArray()
        ]);

        const totalSpend = totalSpendResult[0]?.total || 0;
        const avgPaymentDays = avgPaymentResult[0]?.avgDays || 0;

        let nextPaymentDueFormatted = null;
        if (nextPaymentDue[0]) {
            const { _id, ...rest } = nextPaymentDue[0];
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
            contractsExpiring,
            complianceIssues,
            highRiskVendors,
            avgPaymentDays: Math.round(avgPaymentDays),
        };
    } catch (error) {
        console.error('Database Error:', error);
        throw new Error('Failed to fetch dashboard data.');
    }
}

// User Management
export async function getUser(): Promise<User> {
    noStore();
    const db = await getDb();

    const defaultUser: User = {
        id: 'default-user',
        name: 'Admin User',
        email: 'admin@company.com',
        role: 'Admin',
        permissions: ['read', 'write', 'delete', 'manage'],
        createdAt: new Date(),
        updatedAt: new Date(),
        isActive: true,
    };

    if (!db) {
        return defaultUser;
    }

    try {
        const usersCollection = db.collection('users');
        const user = await usersCollection.findOne({});

        if (!user) {
            await usersCollection.insertOne(defaultUser);
            return defaultUser;
        }

        return {
            id: user._id.toString(),
            name: user.name,
            email: user.email,
            image: user.image,
            createdAt: new Date(user.createdAt || new Date()),
            updatedAt: new Date(user.updatedAt || new Date()),
            lastLoginAt: user.lastLoginAt ? new Date(user.lastLoginAt) : undefined,
            role: user.role || 'Admin',
            permissions: user.permissions || ['read', 'write', 'delete', 'manage'],
            isActive: user.isActive !== undefined ? user.isActive : true,
            businessInfo: user.businessInfo,
            preferences: user.preferences,
        } as User;

    } catch (error) {
        console.error('Database Error fetching user:', error);
        return defaultUser;
    }
}

export async function updateUser(id: string, updates: Partial<User>): Promise<void> {
    const db = await getDb();
    if (!db) throw new Error('Database not available');
    
    try {
        const { ObjectId } = require('mongodb');
        await db.collection('users').updateOne(
            { _id: new ObjectId(id) },
            { 
                $set: { 
                    ...updates, 
                    updatedAt: new Date() 
                } 
            }
        );
        
        await logAuditEvent('user_updated', 'User', id, updates);
    } catch (error) {
        console.error('Database Error:', error);
        throw new Error('Failed to update user.');
    }
}
