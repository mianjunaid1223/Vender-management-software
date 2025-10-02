"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/shared/components/ui/dialog";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Separator } from "@/shared/components/ui/separator";
import { Badge } from "@/shared/components/ui/badge";
import { FileText, Download, Send, Printer } from "lucide-react";
import { cn } from "@/core/utils/utils";
import type { Invoice } from "@/shared/types/types";

interface InvoicePreviewProps {
  invoice: Invoice;
  open: boolean;
  onClose: () => void;
}

export function InvoicePreview({ invoice, open, onClose }: InvoicePreviewProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
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

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Invoice Preview
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Header */}
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-bold">INVOICE</h1>
              <p className="text-muted-foreground">#{invoice.invoiceNumber}</p>
            </div>
            <div className="text-right">
              <Badge className={getStatusColor(invoice.status)}>
                {invoice.status}
              </Badge>
              <p className="text-sm text-muted-foreground mt-2">
                Created: {formatDate(invoice.invoiceDate)}
              </p>
            </div>
          </div>

          {/* Parties */}
          <div className="grid grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">From</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-1">
                  <p className="font-semibold">{invoice.seller?.name}</p>
                  {invoice.seller?.address && (
                    <div className="text-sm text-muted-foreground">
                      <p>{invoice.seller.address.street}</p>
                      <p>{invoice.seller.address.city}, {invoice.seller.address.state} {invoice.seller.address.zipCode}</p>
                      <p>{invoice.seller.address.country}</p>
                    </div>
                  )}
                  {invoice.seller?.email && (
                    <p className="text-sm text-muted-foreground">{invoice.seller.email}</p>
                  )}
                  {invoice.seller?.phone && (
                    <p className="text-sm text-muted-foreground">{invoice.seller.phone}</p>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">To</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-1">
                  <p className="font-semibold">{invoice.buyer?.name || invoice.vendorName}</p>
                  {invoice.buyer?.address && (
                    <div className="text-sm text-muted-foreground">
                      <p>{invoice.buyer.address.street}</p>
                      <p>{invoice.buyer.address.city}, {invoice.buyer.address.state} {invoice.buyer.address.zipCode}</p>
                      <p>{invoice.buyer.address.country}</p>
                    </div>
                  )}
                  {invoice.buyer?.email && (
                    <p className="text-sm text-muted-foreground">{invoice.buyer.email}</p>
                  )}
                  {invoice.buyer?.phone && (
                    <p className="text-sm text-muted-foreground">{invoice.buyer.phone}</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Invoice Details */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Invoice Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium">Invoice Date</p>
                  <p className="text-sm text-muted-foreground">{formatDate(invoice.invoiceDate)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Due Date</p>
                  <p className="text-sm text-muted-foreground">{formatDate(invoice.invoiceDueDate)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Payment Terms</p>
                  <p className="text-sm text-muted-foreground">{invoice.paymentTerms}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Payment Method</p>
                  <p className="text-sm text-muted-foreground">{invoice.paymentMethod}</p>
                </div>
                {invoice.purchaseOrderNumber && (
                  <div>
                    <p className="text-sm font-medium">PO Number</p>
                    <p className="text-sm text-muted-foreground">{invoice.purchaseOrderNumber}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Items */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Items</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {invoice.items && invoice.items.length > 0 ? (
                  <>
                    <div className="grid grid-cols-12 gap-2 text-sm font-medium border-b pb-2">
                      <div className="col-span-6">Description</div>
                      <div className="col-span-2 text-center">Quantity</div>
                      <div className="col-span-2 text-right">Unit Price</div>
                      <div className="col-span-2 text-right">Total</div>
                    </div>
                    {invoice.items.map((item, index) => (
                      <div key={item.id || index} className="grid grid-cols-12 gap-2 text-sm">
                        <div className="col-span-6">{item.description}</div>
                        <div className="col-span-2 text-center">{item.quantity}</div>
                        <div className="col-span-2 text-right">{formatCurrency(item.unitPrice)}</div>
                        <div className="col-span-2 text-right">{formatCurrency(item.total)}</div>
                      </div>
                    ))}
                  </>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>No items listed</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Totals */}
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Subtotal:</span>
                  <span>{formatCurrency(invoice.subtotal || 0)}</span>
                </div>
                {invoice.taxes > 0 && (
                  <div className="flex justify-between text-sm">
                    <span>Taxes:</span>
                    <span>{formatCurrency(invoice.taxes)}</span>
                  </div>
                )}
                {invoice.discounts > 0 && (
                  <div className="flex justify-between text-sm">
                    <span>Discounts:</span>
                    <span>-{formatCurrency(invoice.discounts)}</span>
                  </div>
                )}
                <Separator />
                <div className="flex justify-between text-lg font-semibold">
                  <span>Total:</span>
                  <span>{formatCurrency(invoice.totalAmount || invoice.invoiceAmount || 0)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Notes */}
          {invoice.notes && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{invoice.notes}</p>
              </CardContent>
            </Card>
          )}

          {/* Terms & Conditions */}
          {invoice.termsAndConditions && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Terms & Conditions</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{invoice.termsAndConditions}</p>
              </CardContent>
            </Card>
          )}

          {/* Custom Fields */}
          {invoice.customFields && invoice.customFields.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Additional Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  {invoice.customFields.map((field) => (
                    <div key={field.id}>
                      <p className="text-sm font-medium">{field.name}</p>
                      <p className="text-sm text-muted-foreground">{field.value}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Actions */}
          <div className="flex justify-between pt-4">
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                <Download className="mr-2 h-4 w-4" />
                Download PDF
              </Button>
              <Button variant="outline" size="sm">
                <Printer className="mr-2 h-4 w-4" />
                Print
              </Button>
              {invoice.status !== 'Sent' && invoice.status !== 'Paid' && (
                <Button variant="outline" size="sm">
                  <Send className="mr-2 h-4 w-4" />
                  Send Invoice
                </Button>
              )}
            </div>
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
