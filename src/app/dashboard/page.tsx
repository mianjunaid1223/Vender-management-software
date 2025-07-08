import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { DollarSign, Receipt, Users, CreditCard } from "lucide-react";
import { SpendingInsights } from "@/components/dashboard/spending-insights";
import { fetchCardData, fetchInvoices, fetchVendors } from "@/lib/data";

export default async function DashboardPage() {
    const { invoices, vendors, cardData } = await (async () => {
        const invoicesPromise = fetchInvoices();
        const vendorsPromise = fetchVendors();
        const cardDataPromise = fetchCardData();
        const [invoices, vendors, cardData] = await Promise.all([invoicesPromise, vendorsPromise, cardDataPromise]);
        return { invoices, vendors, cardData };
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
    const dueDate = new Date(nextPaymentDue.invoiceDueDate);
    const today = new Date();
    today.setHours(0,0,0,0); // Set to start of day for accurate comparison
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
      change: "All-time paid invoices",
    },
    {
      title: "Active Vendors",
      value: `+${activeVendors}`,
      icon: <Users className="h-4 w-4 text-muted-foreground" />,
      change: "Total vendors in system",
    },
    {
      title: "Unpaid Invoices",
      value: `${unpaidInvoices}`,
      icon: <Receipt className="h-4 w-4 text-muted-foreground" />,
      change: `${cardData.unpaidInvoices > 0 ? 'Pending payments' : 'All caught up!'}`,
    },
    {
      title: "Next Payment Due",
      value: nextPaymentDue ? formatCurrency(nextPaymentDue.invoiceAmount) : "N/A",
      icon: <CreditCard className="h-4 w-4 text-muted-foreground" />,
      change: getNextPaymentDueText(),
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-4 md:grid-cols-2 md:gap-8 lg:grid-cols-4">
        {summaryCards.map((card) => (
          <Card key={card.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
              {card.icon}
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{card.value}</div>
              <p className="text-xs text-muted-foreground">{card.change}</p>
            </CardContent>
          </Card>
        ))}
      </div>
      <div>
        <SpendingInsights invoices={invoices} vendors={vendors} />
      </div>
    </div>
  );
}
