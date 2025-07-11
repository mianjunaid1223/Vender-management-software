'use client';

import { useRouter } from 'next/navigation';
import { DashboardAlerts } from './dashboard-alerts';
import { InvoiceAlert } from '@/lib/invoice-status-manager';

interface DashboardAlertsWrapperProps {
  alerts: InvoiceAlert[];
}

export function DashboardAlertsWrapper({ alerts }: DashboardAlertsWrapperProps) {
  const router = useRouter();

  const handleViewInvoice = (invoiceId: string) => {
    router.push(`/dashboard/invoices?id=${invoiceId}`);
  };

  return (
    <DashboardAlerts 
      alerts={alerts}
      onViewInvoice={handleViewInvoice}
    />
  );
}
