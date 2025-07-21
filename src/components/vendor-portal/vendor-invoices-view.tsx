'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Invoice } from '@/lib/types';
import { VendorInvitation } from '@/lib/vendor-auth';
import { 
  Receipt, 
  Calendar, 
  DollarSign, 
  AlertTriangle, 
  CheckCircle, 
  Clock,
  Search,
  Filter,
  Download,
  Eye
} from 'lucide-react';
import { format } from 'date-fns';

interface VendorInvoicesViewProps {
  invoices: Invoice[];
  canView: boolean;
  canEdit: boolean;
  invitation: VendorInvitation;
}

export function VendorInvoicesView({ invoices, canView, canEdit, invitation }: VendorInvoicesViewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

  if (!canView) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="text-center text-gray-500">
            <Receipt className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-medium mb-2">Access Restricted</h3>
            <p>You don&apos;t have permission to view invoices.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Filter invoices based on search and status
  const filteredInvoices = invoices.filter(invoice => {
    const matchesSearch = invoice.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         invoice.vendorName?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || invoice.status.toLowerCase() === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Calculate summary statistics
  const stats = {
    total: filteredInvoices.length,
    totalAmount: filteredInvoices.reduce((sum, inv) => sum + (inv.totalAmount || 0), 0),
    paid: filteredInvoices.filter(inv => inv.status === 'Paid').length,
    pending: filteredInvoices.filter(inv => ['Pending', 'Unpaid'].includes(inv.status)).length,
    overdue: filteredInvoices.filter(inv => inv.status === 'Overdue').length,
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'paid':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'overdue':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'pending':
      case 'unpaid':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      default:
        return <Receipt className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'paid':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'overdue':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'pending':
      case 'unpaid':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'cancelled':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  };

  const isInvoiceOverdue = (dueDate: string, status: string) => {
    if (status.toLowerCase() === 'paid') return false;
    const due = new Date(dueDate);
    const now = new Date();
    return due < now;
  };

  const getDaysOverdue = (dueDate: string) => {
    const due = new Date(dueDate);
    const now = new Date();
    return Math.ceil((now.getTime() - due.getTime()) / (1000 * 60 * 60 * 24));
  };

  return (
    <div className="space-y-6">
      {/* Header with Summary Stats */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Receipt className="h-5 w-5" />
              <div>
                <CardTitle>Invoices</CardTitle>
                <CardDescription>Track and manage your invoice payments</CardDescription>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
              <div className="text-sm text-gray-600">Total Invoices</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{stats.paid}</div>
              <div className="text-sm text-gray-600">Paid</div>
            </div>
            <div className="text-center p-4 bg-yellow-50 rounded-lg">
              <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
              <div className="text-sm text-gray-600">Pending</div>
            </div>
            <div className="text-center p-4 bg-red-50 rounded-lg">
              <div className="text-2xl font-bold text-red-600">{stats.overdue}</div>
              <div className="text-sm text-gray-600">Overdue</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search invoices..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="unpaid">Unpaid</SelectItem>
                <SelectItem value="overdue">Overdue</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Invoices List */}
      {filteredInvoices.length === 0 ? (
        <Card>
          <CardContent className="py-8">
            <div className="text-center text-gray-500">
              <Receipt className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-medium mb-2">
                {invoices.length === 0 ? 'No Invoices Found' : 'No Matching Invoices'}
              </h3>
              <p>
                {invoices.length === 0 
                  ? "You don't have any invoices yet."
                  : "Try adjusting your search or filter criteria."
                }
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredInvoices.map((invoice) => (
            <Card key={invoice.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      {getStatusIcon(invoice.status)}
                      <h3 className="text-lg font-semibold text-gray-900">
                        Invoice #{invoice.invoiceNumber}
                      </h3>
                      <Badge className={getStatusColor(invoice.status)}>
                        {invoice.status}
                      </Badge>
                      {isInvoiceOverdue(invoice.invoiceDueDate, invoice.status) && (
                        <Badge variant="outline" className="text-red-600 border-red-600">
                          <AlertTriangle className="h-3 w-3 mr-1" />
                          {getDaysOverdue(invoice.invoiceDueDate)} days overdue
                        </Badge>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                      <div className="flex items-center space-x-2">
                        <Calendar className="h-4 w-4 text-gray-400" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">Invoice Date</p>
                          <p className="text-sm text-gray-600">
                            {format(new Date(invoice.invoiceDate), 'MMM dd, yyyy')}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Calendar className="h-4 w-4 text-gray-400" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">Due Date</p>
                          <p className="text-sm text-gray-600">
                            {format(new Date(invoice.invoiceDueDate), 'MMM dd, yyyy')}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <DollarSign className="h-4 w-4 text-gray-400" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">Amount</p>
                          <p className="text-sm text-gray-600">
                            ${invoice.totalAmount?.toLocaleString() || invoice.invoiceAmount?.toLocaleString() || 'N/A'}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Receipt className="h-4 w-4 text-gray-400" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">Payment Terms</p>
                          <p className="text-sm text-gray-600">
                            {invoice.paymentTerms || 'Standard'}
                          </p>
                        </div>
                      </div>
                    </div>

                    {invoice.notes && (
                      <div className="mb-4">
                        <p className="text-sm text-gray-700 bg-gray-50 p-2 rounded">
                          <strong>Notes:</strong> {invoice.notes}
                        </p>
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                      <div className="flex items-center space-x-4 text-sm text-gray-600">
                        <span>Payment: {invoice.paymentMethod || 'Not specified'}</span>
                        {invoice.purchaseOrderNumber && (
                          <span>PO: {invoice.purchaseOrderNumber}</span>
                        )}
                      </div>
                      
                      <div className="flex space-x-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => setSelectedInvoice(invoice)}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          View Details
                        </Button>
                        <Button variant="outline" size="sm">
                          <Download className="h-4 w-4 mr-2" />
                          Download PDF
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Invoice Details Modal/Expanded View */}
      {selectedInvoice && (
        <Card className="border-2 border-blue-200 bg-blue-50/30">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center">
                <Receipt className="h-5 w-5 mr-2" />
                Invoice #{selectedInvoice.invoiceNumber} Details
              </CardTitle>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setSelectedInvoice(null)}
              >
                ×
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold mb-3">Invoice Information</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Status:</span>
                    <Badge className={getStatusColor(selectedInvoice.status)}>
                      {selectedInvoice.status}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Invoice Date:</span>
                    <span>{format(new Date(selectedInvoice.invoiceDate), 'MMM dd, yyyy')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Due Date:</span>
                    <span>{format(new Date(selectedInvoice.invoiceDueDate), 'MMM dd, yyyy')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Payment Terms:</span>
                    <span>{selectedInvoice.paymentTerms}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Payment Method:</span>
                    <span>{selectedInvoice.paymentMethod || 'Not specified'}</span>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-3">Amount Breakdown</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Subtotal:</span>
                    <span>${selectedInvoice.subtotal?.toLocaleString() || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Tax:</span>
                    <span>${selectedInvoice.taxes?.toLocaleString() || '0'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Discounts:</span>
                    <span>-${selectedInvoice.discounts?.toLocaleString() || '0'}</span>
                  </div>
                  <div className="flex justify-between font-semibold pt-2 border-t">
                    <span>Total:</span>
                    <span>${selectedInvoice.totalAmount?.toLocaleString() || selectedInvoice.invoiceAmount?.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>

            {selectedInvoice.items && selectedInvoice.items.length > 0 && (
              <div>
                <h4 className="font-semibold mb-3">Line Items</h4>
                <div className="bg-white rounded-lg border overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="text-left p-3">Description</th>
                        <th className="text-right p-3">Qty</th>
                        <th className="text-right p-3">Unit Price</th>
                        <th className="text-right p-3">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedInvoice.items.map((item, index) => (
                        <tr key={index} className="border-t">
                          <td className="p-3">{item.description}</td>
                          <td className="p-3 text-right">{item.quantity}</td>
                          <td className="p-3 text-right">${item.unitPrice.toLocaleString()}</td>
                          <td className="p-3 text-right">${item.total.toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {selectedInvoice.notes && (
              <div>
                <h4 className="font-semibold mb-2">Notes</h4>
                <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg">
                  {selectedInvoice.notes}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
