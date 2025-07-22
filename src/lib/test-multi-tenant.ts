// Simple test script to verify multi-tenant data isolation
// Run this after the migration to verify the security fix works

import { fetchInvoices, fetchVendors, fetchContracts } from '@/lib/data';
import { getCurrentUserCompanyId } from '@/lib/auth';

export async function testMultiTenantIsolation() {
  console.log('🧪 Testing multi-tenant data isolation...');
  
  try {
    // Get current user's company
    const userCompanyId = await getCurrentUserCompanyId();
    console.log(`User company ID: ${userCompanyId}`);
    
    if (!userCompanyId) {
      throw new Error('No user company ID found - authentication required');
    }
    
    // Test invoice isolation
    const invoices = await fetchInvoices();
    const nonUserCompanyInvoices = invoices.filter(invoice => invoice.companyId !== userCompanyId);
    
    if (nonUserCompanyInvoices.length > 0) {
      throw new Error(`❌ SECURITY BREACH: Found ${nonUserCompanyInvoices.length} invoices from other companies!`);
    }
    console.log(`✅ Invoices: ${invoices.length} invoices, all belonging to user's company`);
    
    // Test vendor isolation
    const vendors = await fetchVendors();
    const nonUserCompanyVendors = vendors.filter(vendor => vendor.companyId !== userCompanyId);
    
    if (nonUserCompanyVendors.length > 0) {
      throw new Error(`❌ SECURITY BREACH: Found ${nonUserCompanyVendors.length} vendors from other companies!`);
    }
    console.log(`✅ Vendors: ${vendors.length} vendors, all belonging to user's company`);
    
    // Test contract isolation
    const contracts = await fetchContracts();
    const nonUserCompanyContracts = contracts.filter(contract => contract.companyId !== userCompanyId);
    
    if (nonUserCompanyContracts.length > 0) {
      throw new Error(`❌ SECURITY BREACH: Found ${nonUserCompanyContracts.length} contracts from other companies!`);
    }
    console.log(`✅ Contracts: ${contracts.length} contracts, all belonging to user's company`);
    
    console.log('🎉 Multi-tenant isolation test PASSED - No data leakage detected!');
    return { success: true, message: 'All tests passed' };
    
  } catch (error) {
    console.error('❌ Multi-tenant isolation test FAILED:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}
