'use client';

import { useRouter } from 'next/navigation';
import { DashboardAlerts } from './dashboard-alerts';
import { InvoiceAlert } from '@/lib/invoice-status-manager';
import type { Contract } from '@/lib/types';

interface DashboardAlertsWrapperProps {
  invoiceAlerts: InvoiceAlert[];
  contractAlerts: Contract[];
  vendorApplicationAlerts?: Array<{
    id: string;
    vendorName: string;
    submittedAt: Date;
    status: "pending" | "approved" | "rejected";
    service: string;
  }>;
}

export function DashboardAlertsWrapper({ invoiceAlerts, contractAlerts, vendorApplicationAlerts = [] }: DashboardAlertsWrapperProps) {
  const router = useRouter();

  const handleViewInvoice = (invoiceId: string) => {
    router.push(`/dashboard/invoices?id=${invoiceId}`);
  };
  
  const handleViewContracts = () => {
    router.push(`/dashboard/contracts`);
  };

  return (
    <DashboardAlerts 
      invoiceAlerts={invoiceAlerts}
      contractAlerts={contractAlerts}
      onViewInvoice={handleViewInvoice}
      onViewContracts={handleViewContracts}
    />
  );
}
