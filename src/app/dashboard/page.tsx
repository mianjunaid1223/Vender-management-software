import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { DollarSign, Receipt, Users, CreditCard } from "lucide-react";
import { fetchCardData, fetchInvoices } from "@/lib/data";
import { updateInvoiceStatuses } from "@/lib/invoice-status-manager";
import clientPromise from "@/lib/mongodb";
import { DbConfigWarning } from "@/components/db-config-warning";
import { RecentInvoices } from "@/components/dashboard/recent-invoices";
import { DashboardAlertsWrapper } from "@/components/dashboard/dashboard-alerts-wrapper";

export default async function DashboardPage() {
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

    const { invoices, cardData, alerts } = await (async () => {
        try {
          // Update invoice statuses and get alerts
          const statusUpdate = await updateInvoiceStatuses();
          
          const invoicesPromise = fetchInvoices();
          const cardDataPromise = fetchCardData();
          const [invoices, cardData] = await Promise.all([invoicesPromise, cardDataPromise]);
          
          return { invoices, cardData, alerts: statusUpdate.alerts };
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
    const today = new Date();
    today.setHours(0,0,0,0);
    const diffTime = dueDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return `Overdue by ${Math.abs(diffDays)} days`;
    if (diffDays === 0) return "Due today";
    return `Due in ${diffDays} days`;
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

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      {!isDbConfigured && <DbConfigWarning />}
      
      {/* Payment Alerts Section */}
      {alerts.length > 0 && (
        <DashboardAlertsWrapper alerts={alerts} />
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
