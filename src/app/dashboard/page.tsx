import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { DollarSign, Receipt, Users, CreditCard, FileClock, AlertCircle, UserPlus } from "lucide-react";
import { fetchCardData, fetchInvoices, fetchExpiringContracts, fetchPendingVendorApplications } from "@/lib/database/queries";
import { updateInvoiceStatuses } from "@/lib/invoice-status-manager";
import clientPromise from "@/lib/database/mongodb";
import { DbConfigWarning } from "@/components/db-config-warning";
import { RecentInvoices } from "@/components/dashboard/recent-invoices";
import { DashboardAlertsWrapper } from "@/components/dashboard/dashboard-alerts-wrapper";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { format } from "date-fns";
import { Contract } from "@/lib/types";
import { DashboardAlerts } from "@/components/dashboard/dashboard-alerts";
import { calculateDaysDifference, formatDaysDifference } from "@/lib/utils/date";
import { getSession } from "@/lib/auth";
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

    if (!isDbConfigured) {
      return (
        <div className="flex flex-col gap-6 animate-fade-in">
          <DbConfigWarning />
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Database Connection Required</h2>
            <p className="text-gray-600 mb-6">
              Please configure your MongoDB connection string in the .env.local file to use the application.
            </p>
            <div className="bg-gray-100 p-4 rounded-lg text-left max-w-2xl mx-auto">
              <p className="text-sm font-medium mb-2">Add this to your .env.local file:</p>
              <code className="text-sm bg-gray-800 text-green-400 p-2 rounded block">
                MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/database?retryWrites=true&w=majority
              </code>
            </div>
          </div>
        </div>
      );
    }

    const { invoices, cardData, alerts, expiringContracts, pendingApplications } = await (async () => {
        try {
          // Update invoice statuses and get alerts
          const statusUpdate = await updateInvoiceStatuses();
          
          const invoicesPromise = fetchInvoices();
          const cardDataPromise = fetchCardData();
          const expiringContractsPromise = fetchExpiringContracts(30);

          const [invoices, cardData, expiringContracts, pendingApplications] = await Promise.all([
              invoicesPromise, 
              cardDataPromise, 
              expiringContractsPromise,
              fetchPendingVendorApplications()
            ]);
          
          return { 
            invoices, 
            cardData, 
            alerts: statusUpdate.alerts, 
            expiringContracts, 
            pendingApplications 
          };
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
      {!isDbConfigured && <DbConfigWarning />}
      
      {/* Alerts Section */}
      {hasAlerts && (
        <DashboardAlertsWrapper 
          invoiceAlerts={alerts} 
          contractAlerts={expiringContracts}
          vendorApplicationAlerts={pendingApplications}
        />
      )}
      
      <div className="grid gap-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {summaryCards.map((card, index) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {card.title}
              </CardTitle>
              {card.icon}
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{card.value}</div>
              <p className="text-xs text-muted-foreground">
                {card.description}
              </p>
            </CardContent>
          </Card>
        ))}
        <Card className="border-blue-200 bg-blue-50 dark:border-blue-800/50 dark:bg-blue-900/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-blue-800 dark:text-blue-200">
              Pending Vendor Applications
            </CardTitle>
            <UserPlus className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-800 dark:text-blue-200">
              {pendingApplications.length}
            </div>
            <p className="text-xs text-blue-600 dark:text-blue-400">
              {pendingApplications.length === 0 
                ? 'No pending applications' 
                : `${pendingApplications.length} application${pendingApplications.length > 1 ? 's' : ''} awaiting review`}
            </p>
            {pendingApplications.length > 0 && (
              <Button 
                variant="link" 
                className="h-auto p-0 text-xs text-blue-700 dark:text-blue-300 mt-2"
                asChild
              >
                <Link href="/dashboard/vendor-applications">
                  Review Applications
                </Link>
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
        <RecentInvoices data={invoices} />
      </div>
    </div>
  );
}
