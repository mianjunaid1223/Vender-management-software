import { PageHeader } from "@/components/page-header";
import { PerformanceAnalytics } from "@/components/dashboard/performance-analytics";
import { fetchVendors, fetchInvoices, fetchCardData } from "@/lib/data";

export default async function AnalyticsPage() {
  const [vendors, invoices, cardData] = await Promise.all([
    fetchVendors(),
    fetchInvoices(),
    fetchCardData()
  ]);
  
  return (
    <div>
      <PageHeader 
        title="Analytics" 
        description="Comprehensive vendor performance analytics and insights."
      />
      <PerformanceAnalytics 
        vendors={vendors}
        invoices={invoices}
        cardData={cardData}
      />
    </div>
  );
}
