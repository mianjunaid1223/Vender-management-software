import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import { DollarSign, Receipt, Users, CreditCard, FileClock, AlertCircle } from "lucide-react";
import { fetchCardData, fetchInvoices, fetchExpiringContracts } from "@/shared/lib/data";
import { updateInvoiceStatuses } from "@/features/invoices/lib/invoice-status-manager";
import clientPromise from "@/core/database/mongodb";
import { RecentInvoices } from "@/features/dashboard/components/recent-invoices";
import { DashboardAlertsWrapper } from "@/features/dashboard/components/dashboard-alerts-wrapper";

import { calculateDaysDifference, formatDaysDifference } from "@/core/utils/date-utils";
import { getSession } from "@/core/auth/auth";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
    // Middleware ensures only authenticated users reach this page
    const user = await getSession();
    
    console.log('Dashboard Page - User session:', user);
    
    // If no user session, redirect to login
    if (!user) {
        redirect('/login');
    }
    
    const isDbConfigured = clientPromise !== null;

   

    const { invoices, cardData, alerts, expiringContracts } = await (async () => {
        try {
          // Update invoice statuses and get alerts
          const statusUpdate = await updateInvoiceStatuses();
          
          const invoicesPromise = fetchInvoices();
          const cardDataPromise = fetchCardData();
          const expiringContractsPromise = fetchExpiringContracts(30);

          const [invoices, cardData, expiringContracts] = await Promise.all([
              invoicesPromise, 
              cardDataPromise, 
              expiringContractsPromise
            ]);
          
          return { invoices, cardData, alerts: statusUpdate.alerts, expiringContracts };
        } catch (error) {
          console.error('Database error:', error);
          throw error;
        }
    })();

  const { totalSpend, activeVendors, unpaidInvoices, nextPaymentDue } = cardData;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const getNextPaymentDueText = () => {
    if (!nextPaymentDue) return "All caught up!";
    
    // Type assertion since we know the structure from fetchCardData
    const invoice = nextPaymentDue as any;
    const dueDate = new Date(invoice.invoiceDueDate);
    const diffDays = calculateDaysDifference(dueDate);
    
    return formatDaysDifference(diffDays);
  }

  const summaryCards = [
    {
      title: "Total Spend (Paid)",
      value: formatCurrency(totalSpend),
      icon: <DollarSign className="h-4 w-4 text-muted-foreground" />,
      description: "All-time paid invoices",
    },
    {
      title: "Active Vendors",
      value: `+${activeVendors}`,
      icon: <Users className="h-4 w-4 text-muted-foreground" />,
      description: "Total vendors in system",
    },
    {
      title: "Unpaid Invoices",
      value: `${unpaidInvoices}`,
      icon: <Receipt className="h-4 w-4 text-muted-foreground" />,
      description: `${cardData.unpaidInvoices > 0 ? 'Pending payments' : 'All caught up!'}`,
    },
    {
      title: "Next Payment Due",
      value: nextPaymentDue ? formatCurrency((nextPaymentDue as any).invoiceAmount) : "N/A",
      icon: <CreditCard className="h-4 w-4 text-muted-foreground" />,
      description: getNextPaymentDueText(),
    },
  ];

  const hasAlerts = alerts.length > 0 || expiringContracts.length > 0;

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      {!isDbConfigured && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
          <div className="flex">
            <AlertCircle className="h-5 w-5 text-yellow-400" />
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">Database Configuration Required</h3>
              <p className="mt-1 text-sm text-yellow-700">Please configure your MongoDB connection to continue.</p>
            </div>
          </div>
        </div>
      )}
      
      {/* Alerts Section */}
      {hasAlerts && (
        <DashboardAlertsWrapper 
          invoiceAlerts={alerts} 
          contractAlerts={expiringContracts}
        />
      )}
      
      <div className="grid gap-6">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {summaryCards.map((card) => (
            <Card key={card.title}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
                {card.icon}
                </CardHeader>
                <CardContent>
                <div className="text-2xl font-bold">{card.value}</div>
                <p className="text-xs text-muted-foreground">{card.description}</p>
                </CardContent>
            </Card>
            ))}
        </div>
        <RecentInvoices data={invoices} />
      </div>
    </div>
  );
}
