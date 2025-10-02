import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/components/ui/table";
import { Badge } from "@/shared/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/shared/components/ui/card";
import type { Invoice } from "@/shared/types/types";
import { cn } from "@/core/utils/utils";
import Link from 'next/link';
import { Button } from '@/shared/components/ui/button';
import { ArrowUpRight } from 'lucide-react';

type RecentInvoicesProps = {
  data: Invoice[];
};

export function RecentInvoices({ data }: RecentInvoicesProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };
  
  const formatDate = (dateString: string) => {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-US", {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
          timeZone: 'UTC'
      });
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center">
        <div className="grid gap-2">
            <CardTitle>Recent Invoices</CardTitle>
            <CardDescription>Your five most recently created invoices.</CardDescription>
        </div>
        <Button asChild size="sm" className="ml-auto gap-1">
            <Link href="/dashboard/invoices">
                View All
                <ArrowUpRight className="h-4 w-4" />
            </Link>
        </Button>
      </CardHeader>
      <CardContent>
        <Table>
            <TableHeader>
            <TableRow>
                <TableHead>Vendor</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead className="hidden sm:table-cell">Status</TableHead>
                <TableHead className="hidden md:table-cell">Due Date</TableHead>
            </TableRow>
            </TableHeader>
            <TableBody>
            {data.slice(0, 5).map((invoice) => (
                <TableRow key={invoice.id}>
                <TableCell>
                    <div className="font-medium">{invoice.vendorName}</div>
                    <div className="hidden text-sm text-muted-foreground md:inline">
                        #{invoice.invoiceNumber}
                    </div>
                </TableCell>
                <TableCell className="text-right">
                    {formatCurrency(invoice.invoiceAmount)}
                </TableCell>
                 <TableCell className="hidden sm:table-cell">
                    <Badge
                    className={cn("text-xs", {
                        "border-transparent bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300": invoice.status === "Paid",
                        "border-transparent bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300": invoice.status === "Unpaid",
                        "border-transparent bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300": invoice.status === "Overdue",
                    })}
                    >
                    {invoice.status}
                    </Badge>
                </TableCell>
                <TableCell className="hidden md:table-cell">{formatDate(invoice.invoiceDueDate)}</TableCell>
                </TableRow>
            ))}
            </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
