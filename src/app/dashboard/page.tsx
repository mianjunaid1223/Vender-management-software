import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { DollarSign, Receipt, Users, CreditCard, AlertTriangle, Shield, FileText, TrendingUp } from "lucide-react";
import { fetchCardData, fetchInvoices, fetchExpiringContracts } from "@/lib/data";
import clientPromise from "@/lib/mongodb";
import { DbConfigWarning } from "@/components/db-config-warning";
import { RecentInvoices } from "@/components/dashboard/recent-invoices";

export default async function DashboardPage() {
    const isDbConfigured = clientPromise !== null;

    const { invoices, cardData, expiringContracts } = await (async () => {
        if (!isDbConfigured) {
          return { 
            invoices: [], 
            cardData: { 
              totalSpend: 0, 
              activeVendors: 0, 
              unpaidInvoices: 0, 
              nextPaymentDue: null,
              contractsExpiring: 0,
              complianceIssues: 0,
              highRiskVendors: 0,
              avgPaymentDays: 0,
            },
            expiringContracts: []
          };
        }
        const invoicesPromise = fetchInvoices();
        const cardDataPromise = fetchCardData();
        const expiringContractsPromise = fetchExpiringContracts();
        const [invoices, cardData, expiringContracts] = await Promise.all([
          invoicesPromise, 
          cardDataPromise, 
          expiringContractsPromise
        ]);
        return { invoices, cardData, expiringContracts };
    })();

  const { 
    totalSpend, 
    activeVendors, 
    unpaidInvoices, 
    nextPaymentDue, 
    contractsExpiring, 
    complianceIssues, 
    highRiskVendors, 
    avgPaymentDays 
  } = cardData;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const getNextPaymentDueText = () => {
    if (!nextPaymentDue) return "All caught up!";
    const dueDate = new Date(nextPaymentDue.invoiceDueDate || '');
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
      value: `${activeVendors}`,
      icon: <Users className="h-4 w-4 text-muted-foreground" />,
      description: "Total vendors in system",
    },
    {
      title: "Unpaid Invoices",
      value: `${unpaidInvoices}`,
      icon: <Receipt className="h-4 w-4 text-muted-foreground" />,
      description: `${unpaidInvoices > 0 ? 'Pending payments' : 'All caught up!'}`,
    },
    {
      title: "Next Payment Due",
      value: nextPaymentDue ? formatCurrency((nextPaymentDue as any).invoiceAmount || 0) : "N/A",
      icon: <CreditCard className="h-4 w-4 text-muted-foreground" />,
      description: getNextPaymentDueText(),
    },
    {
      title: "Contracts Expiring",
      value: `${contractsExpiring}`,
      icon: <FileText className="h-4 w-4 text-blue-600" />,
      description: "Next 30 days",
    },
    {
      title: "Compliance Issues",
      value: `${complianceIssues}`,
      icon: <Shield className="h-4 w-4 text-yellow-600" />,
      description: complianceIssues > 0 ? "Need attention" : "All compliant",
    },
    {
      title: "High Risk Vendors",
      value: `${highRiskVendors}`,
      icon: <AlertTriangle className="h-4 w-4 text-red-600" />,
      description: highRiskVendors > 0 ? "Review required" : "Risk under control",
    },
    {
      title: "Avg Payment Days",
      value: `${avgPaymentDays}`,
      icon: <TrendingUp className="h-4 w-4 text-muted-foreground" />,
      description: avgPaymentDays > 0 ? "Days to pay" : "No data",
    },
  ];

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      {!isDbConfigured && <DbConfigWarning />}
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
        
        {/* Critical Alerts Section */}
        {(contractsExpiring > 0 || complianceIssues > 0 || highRiskVendors > 0) && (
          <Card className="border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-950">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-yellow-600" />
                Action Required
              </CardTitle>
              <CardDescription>
                Important items that need your attention
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {contractsExpiring > 0 && (
                  <div className="flex items-center justify-between p-3 bg-white dark:bg-gray-900 rounded-lg">
                    <div className="flex items-center gap-3">
                      <FileText className="h-4 w-4 text-blue-600" />
                      <div>
                        <div className="font-medium">Contracts Expiring Soon</div>
                        <div className="text-sm text-muted-foreground">
                          {contractsExpiring} contract{contractsExpiring > 1 ? 's' : ''} expire within 30 days
                        </div>
                      </div>
                    </div>
                    <a href="/dashboard/contracts" className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                      Review →
                    </a>
                  </div>
                )}
                {complianceIssues > 0 && (
                  <div className="flex items-center justify-between p-3 bg-white dark:bg-gray-900 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Shield className="h-4 w-4 text-yellow-600" />
                      <div>
                        <div className="font-medium">Compliance Issues</div>
                        <div className="text-sm text-muted-foreground">
                          {complianceIssues} vendor{complianceIssues > 1 ? 's' : ''} require compliance review
                        </div>
                      </div>
                    </div>
                    <a href="/dashboard/compliance" className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                      Review →
                    </a>
                  </div>
                )}
                {highRiskVendors > 0 && (
                  <div className="flex items-center justify-between p-3 bg-white dark:bg-gray-900 rounded-lg">
                    <div className="flex items-center gap-3">
                      <AlertTriangle className="h-4 w-4 text-red-600" />
                      <div>
                        <div className="font-medium">High Risk Vendors</div>
                        <div className="text-sm text-muted-foreground">
                          {highRiskVendors} vendor{highRiskVendors > 1 ? 's' : ''} marked as high risk
                        </div>
                      </div>
                    </div>
                    <a href="/dashboard/vendors" className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                      Review →
                    </a>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}
        
        <RecentInvoices data={invoices} />
      </div>
    </div>
  );
}
