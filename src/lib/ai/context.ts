'use server';

import { AIContext, Company, ActionLog, User, Contract, Vendor, Invoice } from '@/lib/types';
import { fetchCompany, fetchRecentActions, fetchContracts, fetchVendors, fetchInvoices, getUser } from '@/lib/database/queries';

export class AIContextManager {
    private static instance: AIContextManager;
    private contextCache: Map<string, { context: AIContext; timestamp: number }> = new Map();
    private cacheTimeout = 5 * 60 * 1000; // 5 minutes

    public static getInstance(): AIContextManager {
        if (!AIContextManager.instance) {
            AIContextManager.instance = new AIContextManager();
        }
        return AIContextManager.instance;
    }

    async buildContext(userId: string, currentModule: string = 'dashboard'): Promise<AIContext> {
        const cacheKey = `${userId}-${currentModule}`;
        const cached = this.contextCache.get(cacheKey);
        
        if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
            return cached.context;
        }

        try {
            const [
                user,
                company,
                recentInvoices,
                activeVendors,
                activeContracts,
                lastActions
            ] = await Promise.all([
                getUser(),
                fetchCompany(),
                fetchInvoices(),
                fetchVendors(),
                fetchContracts(),
                fetchRecentActions(userId, 10)
            ]);

            const context: AIContext = {
                user: user!,
                company: company || await this.createDefaultCompany(userId),
                recentInvoices: recentInvoices.slice(0, 10),
                activeVendors: activeVendors.filter(v => v.status === 'Active'),
                activeContracts: activeContracts.filter(c => c.status === 'Active'),
                preferences: company?.preferences || {
                    baseCurrency: 'USD',
                    defaultPaymentTerms: 'Net 30',
                    defaultTaxRate: 0,
                    emailNotifications: true,
                    invoiceReminders: true,
                    contractReminders: true,
                    preferredLanguage: 'en'
                },
                currentModule,
                lastActions
            };

            this.contextCache.set(cacheKey, {
                context,
                timestamp: Date.now()
            });

            return context;
        } catch (error) {
            console.error('Failed to build AI context:', error);
            throw new Error('Failed to load business context');
        }
    }

    private async createDefaultCompany(userId: string): Promise<Company> {
        return {
            id: 'default',
            companyId: 'default',
            name: 'Your Company',
            businessType: 'Business',
            addresses: [],
            contacts: [],
            preferences: {
                defaultPaymentTerms: 'Net 30',
                baseCurrency: 'USD',
                defaultTaxRate: 0,
                emailNotifications: true,
                invoiceReminders: true,
                contractReminders: true,
                preferredLanguage: 'en'
            },
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            createdBy: userId
        };
    }

    clearCache(userId?: string): void {
        if (userId) {
            const keysToDelete = Array.from(this.contextCache.keys()).filter(key => key.startsWith(userId));
            keysToDelete.forEach(key => this.contextCache.delete(key));
        } else {
            this.contextCache.clear();
        }
    }

    async refreshContext(userId: string, currentModule: string): Promise<AIContext> {
        const cacheKey = `${userId}-${currentModule}`;
        this.contextCache.delete(cacheKey);
        return this.buildContext(userId, currentModule);
    }
}

export const aiContextManager = AIContextManager.getInstance();
