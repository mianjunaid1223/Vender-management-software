
"use client";

import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  MoreHorizontal, 
  Eye, 
  Edit, 
  Trash2, 
  DollarSign, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  Search,
  Filter,
  Download,
  Send,
  Copy,
  FileText
} from "lucide-react";
import { InvoiceDialog } from "./invoice-dialog";
import { cn } from "@/lib/utils";
import { downloadInvoicePDF, previewInvoicePDF } from "@/lib/pdf-utils";
import { formatCurrency } from "@/lib/currency-utils";
import type { Invoice, Vendor, Contract } from "@/lib/types";

interface InvoicesTableProps {
  data: Invoice[];
  vendors: Vendor[];
  contracts: Contract[];
  onInvoiceUpdate: (invoice: Partial<Invoice>) => void;
  onInvoiceDelete: (invoiceId: string) => void;
  onStatusChange: (invoiceId: string, status: Invoice['status']) => void;
  onInvoiceCreate: (invoice: Partial<Invoice>) => void;
}

export function InvoicesTable({ 
  data, 
  vendors, 
  contracts, 
  onInvoiceUpdate, 
  onInvoiceDelete, 
  onStatusChange,
  onInvoiceCreate
}: InvoicesTableProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedInvoices, setSelectedInvoices] = useState<string[]>([]);

  const formatCurrencyLocal = (amount: number, currency: string = 'USD') => {
    return formatCurrency(amount, currency);
  };
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      timeZone: 'UTC'
    });
  };

  const getStatusColor = (status: Invoice['status']) => {
    switch (status) {
      case 'Paid':
        return "bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300";
      case 'Sent':
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300";
      case 'Draft':
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/50 dark:text-gray-300";
      case 'Unpaid':
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300";
      case 'Overdue':
        return "bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300";
      case 'Cancelled':
        return "bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/50 dark:text-gray-300";
    }
  };

  const getStatusIcon = (status: Invoice['status']) => {
    switch (status) {
      case 'Paid':
        return <CheckCircle className="h-4 w-4" />;
      case 'Overdue':
        return <AlertCircle className="h-4 w-4" />;
      case 'Unpaid':
        return <Clock className="h-4 w-4" />;
      default:
        return <DollarSign className="h-4 w-4" />;
    }
  };

  const filteredData = data.filter(invoice => {
    const matchesSearch = 
      invoice.invoiceNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.vendorName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.buyer?.name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || invoice.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const handleQuickStatusChange = (invoiceId: string, newStatus: Invoice['status']) => {
    onStatusChange(invoiceId, newStatus);
  };
  
  const handleDuplicateInvoice = (invoice: Invoice) => {
    const { id, invoiceNumber, status, createdAt, updatedAt, ...rest } = invoice;
    const newInvoice: Partial<Invoice> = {
      ...rest,
      id: crypto.randomUUID(), // Ensure a new unique ID for the key prop
      invoiceNumber: `COPY-${invoiceNumber}`,
      status: 'Draft',
    };
    onInvoiceCreate(newInvoice);
  };

  const handleBulkAction = (action: string) => {
    switch (action) {
      case 'mark-paid':
        selectedInvoices.forEach(id => handleQuickStatusChange(id, 'Paid'));
        break;
      case 'mark-sent':
        selectedInvoices.forEach(id => handleQuickStatusChange(id, 'Sent'));
        break;
      case 'download-pdf':
        selectedInvoices.forEach(id => {
          const invoice = data.find(inv => inv.id === id);
          if (invoice) {
            downloadInvoicePDF(invoice);
          }
        });
        break;
      case 'delete':
        selectedInvoices.forEach(id => onInvoiceDelete(id));
        break;
    }
    setSelectedInvoices([]);
  };

  const getInvoiceStats = () => {
    const total = data.length;
    const paid = data.filter(inv => inv.status === 'Paid').length;
    const overdue = data.filter(inv => inv.status === 'Overdue').length;
    const totalAmount = data.reduce((sum, inv) => sum + (inv.totalAmount || inv.invoiceAmount || 0), 0);
    const paidAmount = data
      .filter(inv => inv.status === 'Paid')
      .reduce((sum, inv) => sum + (inv.totalAmount || inv.invoiceAmount || 0), 0);
    
    return { total, paid, overdue, totalAmount, paidAmount };
  };

  const stats = getInvoiceStats();

  return (
    <div className="space-y-4">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Invoices</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">
              {formatCurrency(stats.totalAmount, 'USD')} total value
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Paid</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.paid}</div>
            <p className="text-xs text-muted-foreground">
              {formatCurrency(stats.paidAmount, 'USD')} received
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overdue</CardTitle>
            <AlertCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.overdue}</div>
            <p className="text-xs text-muted-foreground">
              Require attention
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Outstanding</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(stats.totalAmount - stats.paidAmount, 'USD')}
            </div>
            <p className="text-xs text-muted-foreground">
              Pending payment
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Actions */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="flex flex-1 gap-2">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search invoices..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40">
              <Filter className="mr-2 h-4 w-4" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="Draft">Draft</SelectItem>
              <SelectItem value="Sent">Sent</SelectItem>
              <SelectItem value="Paid">Paid</SelectItem>
              <SelectItem value="Unpaid">Unpaid</SelectItem>
              <SelectItem value="Overdue">Overdue</SelectItem>
              <SelectItem value="Cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        {selectedInvoices.length > 0 && (
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => handleBulkAction('mark-paid')}
            >
              Mark as Paid
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => handleBulkAction('mark-sent')}
            >
              Mark as Sent
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => handleBulkAction('download-pdf')}
            >
              <Download className="mr-2 h-4 w-4" />
              Download PDFs
            </Button>
            <Button 
              variant="destructive" 
              size="sm"
              onClick={() => handleBulkAction('delete')}
            >
              Delete Selected
            </Button>
          </div>
        )}
      </div>

      {/* Invoice Table */}
      <div className="rounded-lg border shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <input
                  type="checkbox"
                  checked={selectedInvoices.length === filteredData.length && filteredData.length > 0}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedInvoices(filteredData.map(inv => inv.id));
                    } else {
                      setSelectedInvoices([]);
                    }
                  }}
                  className="rounded border-gray-300"
                />
              </TableHead>
              <TableHead>Invoice</TableHead>
              <TableHead>Vendor</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Due Date</TableHead>
              <TableHead>
                <span className="sr-only">Actions</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredData.map((invoice) => (
              <TableRow key={invoice.id}>
                <TableCell>
                  <input
                    type="checkbox"
                    checked={selectedInvoices.includes(invoice.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedInvoices([...selectedInvoices, invoice.id]);
                      } else {
                        setSelectedInvoices(selectedInvoices.filter(id => id !== invoice.id));
                      }
                    }}
                    className="rounded border-gray-300"
                  />
                </TableCell>
                <TableCell>
                  <div className="flex flex-col">
                    <span className="font-medium">{invoice.invoiceNumber}</span>
                    {invoice.purchaseOrderNumber && (
                      <span className="text-sm text-muted-foreground">
                        PO: {invoice.purchaseOrderNumber}
                      </span>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-col">
                    <span className="font-medium">{invoice.vendorName}</span>
                    <span className="text-sm text-muted-foreground">
                      {invoice.buyer?.name || 'N/A'}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge className={cn("flex items-center gap-1", getStatusColor(invoice.status))}>
                    {getStatusIcon(invoice.status)}
                    {invoice.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex flex-col items-end">
                    <span className="font-medium">
                      {formatCurrencyLocal(invoice.totalAmount || invoice.invoiceAmount || 0, invoice.currency || 'USD')}
                    </span>
                    {invoice.paymentStatus && invoice.paymentStatus !== 'Pending' && (
                      <span className="text-sm text-muted-foreground">
                        {invoice.paymentStatus}
                      </span>
                    )}
                  </div>
                </TableCell>
                <TableCell>{formatDate(invoice.invoiceDate)}</TableCell>
                <TableCell>
                  <div className={cn(
                    "flex items-center gap-1",
                    invoice.status === 'Overdue' && "text-red-600"
                  )}>
                    {invoice.status === 'Overdue' && <AlertCircle className="h-4 w-4" />}
                    {formatDate(invoice.invoiceDueDate)}
                  </div>
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button aria-haspopup="true" size="icon" variant="ghost">
                        <MoreHorizontal className="h-4 w-4" />
                        <span className="sr-only">Toggle menu</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      
                      <InvoiceDialog
                        invoice={invoice}
                        vendors={vendors}
                        contracts={contracts}
                        onSubmit={onInvoiceUpdate}
                        mode="view"
                        trigger={
                          <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                            <Eye className="mr-2 h-4 w-4" />
                            View Details
                          </DropdownMenuItem>
                        }
                      />
                      
                      <InvoiceDialog
                        invoice={invoice}
                        vendors={vendors}
                        contracts={contracts}
                        onSubmit={onInvoiceUpdate}
                        onDelete={onInvoiceDelete}
                        mode="edit"
                        trigger={
                          <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                        }
                      />
                      
                      <DropdownMenuSeparator />
                      
                      <DropdownMenuItem 
                        onClick={() => handleDuplicateInvoice(invoice)}
                      >
                        <Copy className="mr-2 h-4 w-4" />
                        Duplicate Invoice
                      </DropdownMenuItem>
                      
                      {invoice.status !== 'Paid' && (
                        <DropdownMenuItem 
                          onClick={() => handleQuickStatusChange(invoice.id, 'Paid')}
                        >
                          <CheckCircle className="mr-2 h-4 w-4" />
                          Mark as Paid
                        </DropdownMenuItem>
                      )}
                      
                      {invoice.status === 'Draft' && (
                        <DropdownMenuItem 
                          onClick={() => handleQuickStatusChange(invoice.id, 'Sent')}
                        >
                          <Send className="mr-2 h-4 w-4" />
                          Mark as Sent
                        </DropdownMenuItem>
                      )}
                      
                      <DropdownMenuItem
                        onClick={() => downloadInvoicePDF(invoice)}
                      >
                        <Download className="mr-2 h-4 w-4" />
                        Download PDF
                      </DropdownMenuItem>
                      
                      <DropdownMenuItem
                        onClick={() => previewInvoicePDF(invoice)}
                      >
                        <FileText className="mr-2 h-4 w-4" />
                        Preview PDF
                      </DropdownMenuItem>
                      
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        onClick={() => onInvoiceDelete(invoice.id)}
                        className="text-red-600"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        
        {filteredData.length === 0 && (
          <div className="text-center py-8">
            <p className="text-muted-foreground">No invoices found matching your criteria.</p>
          </div>
        )}
      </div>
    </div>
  );
}
