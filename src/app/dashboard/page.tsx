import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { DollarSign, Receipt, Users, CreditCard } from "lucide-react";
import { SpendingInsights } from "@/components/dashboard/spending-insights";

export default function DashboardPage() {
  const summaryCards = [
    {
      title: "Total Spend (YTD)",
      value: "$45,231.89",
      icon: <DollarSign className="h-4 w-4 text-muted-foreground" />,
      change: "+20.1% from last month",
    },
    {
      title: "Active Vendors",
      value: "+12",
      icon: <Users className="h-4 w-4 text-muted-foreground" />,
      change: "+2 from last month",
    },
    {
      title: "Unpaid Invoices",
      value: "19",
      icon: <Receipt className="h-4 w-4 text-muted-foreground" />,
      change: "5 overdue",
    },
    {
      title: "Next Payment Due",
      value: "$1,200.00",
      icon: <CreditCard className="h-4 w-4 text-muted-foreground" />,
      change: "Due in 3 days",
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
        <SpendingInsights />
      </div>
    </div>
  );
}
