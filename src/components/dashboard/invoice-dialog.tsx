"use client";

import { useState, useEffect, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Plus, Minus, Upload, FileText, Eye, Edit, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import type { Invoice, InvoiceItem, InvoiceEntity, Vendor, Contract, CustomField } from "@/lib/types";

interface InvoiceDialogProps {
  invoice?: Invoice;
  vendors: Vendor[];
  contracts: Contract[];
  trigger?: React.ReactNode;
  onSubmit: (invoice: Partial<Invoice>) => void;
  onDelete?: (invoiceId: string) => void;
  mode?: 'create' | 'edit' | 'view';
}

export function InvoiceDialog({ 
  invoice, 
  vendors, 
  contracts, 
  trigger, 
  onSubmit, 
  onDelete,
  mode = 'create'
}: InvoiceDialogProps) {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState<Partial<Invoice>>({});
  const [items, setItems] = useState<InvoiceItem[]>([]);
  const [customFields, setCustomFields] = useState<CustomField[]>([]);
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null);
  const [activeTab, setActiveTab] = useState("basic");

  useEffect(() => {
    if (invoice) {
      setFormData(invoice);
      setItems(invoice.items || []);
      setCustomFields(invoice.customFields || []);
      
      // Find and set selected vendor
      const vendor = vendors.find(v => v.id === invoice.vendorId);
      if (vendor) setSelectedVendor(vendor);
      
      // Find and set selected contract
      const contract = contracts.find(c => c.id === invoice.contractId);
      if (contract) setSelectedContract(contract);
    } else {
      // Initialize with default values
      setFormData({
        invoiceNumber: generateInvoiceNumber(),
        invoiceDate: new Date().toISOString().split('T')[0],
        invoiceDueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        status: 'Draft',
        paymentStatus: 'Pending',
        paymentTerms: 'Net 30',
        paymentMethod: 'Bank Transfer',
        taxes: 0,
        taxRate: 0,
        taxType: 'percentage',
        discounts: 0,
        discountRate: 0,
        discountType: 'percentage',
        subtotal: 0,
        totalAmount: 0,
        seller: {
          name: 'Your Company',
          address: {
            street: '',
            city: '',
            state: '',
            zipCode: '',
            country: 'US'
          }
        },
        buyer: {
          name: '',
          address: {
            street: '',
            city: '',
            state: '',
            zipCode: '',
            country: 'US'
          }
        }
      });
      setItems([createEmptyItem()]);
      setCustomFields([]);
    }
  }, [invoice, vendors, contracts]);

  const generateInvoiceNumber = () => {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `INV-${year}${month}-${random}`;
  };

  const createEmptyItem = (): InvoiceItem => ({
    id: crypto.randomUUID(),
    description: '',
    quantity: 1,
    unitPrice: 0,
    total: 0
  });

  const addItem = () => {
    setItems([...items, createEmptyItem()]);
  };

  const removeItem = (id: string) => {
    setItems(items.filter(item => item.id !== id));
  };

  const updateItem = (id: string, updates: Partial<InvoiceItem>) => {
    setItems(items.map(item => {
      if (item.id === id) {
        const updated = { ...item, ...updates };
        updated.total = updated.quantity * updated.unitPrice;
        return updated;
      }
      return item;
    }));
  };

  const calculateTotals = () => {
    const subtotal = items.reduce((sum, item) => sum + item.total, 0);
    
    // Calculate tax amount
    let taxAmount = 0;
    if (formData.taxType === 'percentage' && formData.taxRate) {
      taxAmount = (subtotal * formData.taxRate) / 100;
    } else {
      taxAmount = formData.taxes || 0;
    }
    
    // Calculate discount amount
    let discountAmount = 0;
    if (formData.discountType === 'percentage' && formData.discountRate) {
      discountAmount = (subtotal * formData.discountRate) / 100;
    } else {
      discountAmount = formData.discounts || 0;
    }
    
    const totalAmount = subtotal + taxAmount - discountAmount;
    
    return { subtotal, totalAmount, taxAmount, discountAmount };
  };

  // Use useMemo to calculate totals and update formData when dependencies change
  const totals = useMemo(() => {
    const calculated = calculateTotals();
    
    // Update formData with calculated amounts (only if values have changed)
    setFormData(prev => {
      if (
        prev.subtotal !== calculated.subtotal ||
        prev.taxes !== calculated.taxAmount ||
        prev.discounts !== calculated.discountAmount ||
        prev.totalAmount !== calculated.totalAmount
      ) {
        return {
          ...prev,
          subtotal: calculated.subtotal,
          taxes: calculated.taxAmount,
          discounts: calculated.discountAmount,
          totalAmount: calculated.totalAmount
        };
      }
      return prev;
    });
    
    return calculated;
  }, [items, formData.taxType, formData.taxRate, formData.taxes, formData.discountType, formData.discountRate, formData.discounts]);

  const handleVendorSelect = (vendorId: string) => {
    const vendor = vendors.find(v => v.id === vendorId);
    if (vendor) {
      setSelectedVendor(vendor);
      setFormData(prev => ({
        ...prev,
        vendorId: vendor.id,
        vendorName: vendor.name,
        buyer: {
          name: vendor.name,
          address: vendor.address || {
            street: '',
            city: '',
            state: '',
            zipCode: '',
            country: 'US'
          },
          email: vendor.email,
          phone: vendor.phone,
          taxId: vendor.taxId,
          contactPerson: vendor.contactPerson
        },
        paymentTerms: vendor.paymentTerms || 'Net 30'
      }));
    }
  };

  const handleContractSelect = (contractId: string) => {
    const contract = contracts.find(c => c.id === contractId);
    if (contract) {
      setSelectedContract(contract);
      setFormData(prev => ({
        ...prev,
        contractId: contract.id,
        paymentTerms: contract.paymentTerms,
        purchaseOrderNumber: contract.id
      }));
    }
  };

  const addCustomField = () => {
    const newField: CustomField = {
      id: crypto.randomUUID(),
      name: '',
      type: 'text',
      value: '',
      required: false
    };
    setCustomFields([...customFields, newField]);
  };

  const removeCustomField = (id: string) => {
    setCustomFields(customFields.filter(field => field.id !== id));
  };

  const updateCustomField = (id: string, updates: Partial<CustomField>) => {
    setCustomFields(customFields.map(field => 
      field.id === id ? { ...field, ...updates } : field
    ));
  };

  const handleSubmit = () => {
    const invoiceData: Partial<Invoice> = {
      ...formData,
      items,
      customFields,
      subtotal: totals.subtotal,
      totalAmount: totals.totalAmount,
      invoiceAmount: totals.totalAmount, // For backward compatibility
      updatedAt: new Date().toISOString(),
      createdAt: invoice?.createdAt || new Date().toISOString(),
      createdBy: invoice?.createdBy || 'current-user'
    };

    onSubmit(invoiceData);
    setOpen(false);
  };

  const handleDelete = () => {
    if (invoice?.id && onDelete) {
      onDelete(invoice.id);
      setOpen(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Create Invoice
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {mode === 'create' && <><FileText className="h-5 w-5" />Create Invoice</>}
            {mode === 'edit' && <><Edit className="h-5 w-5" />Edit Invoice</>}
            {mode === 'view' && <><Eye className="h-5 w-5" />View Invoice</>}
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="basic">Basic Info</TabsTrigger>
            <TabsTrigger value="parties">Parties</TabsTrigger>
            <TabsTrigger value="items">Items</TabsTrigger>
            <TabsTrigger value="payment">Payment</TabsTrigger>
            <TabsTrigger value="custom">Custom</TabsTrigger>
          </TabsList>

          <TabsContent value="basic" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="invoiceNumber">Invoice Number</Label>
                <Input
                  id="invoiceNumber"
                  value={formData.invoiceNumber || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, invoiceNumber: e.target.value }))}
                  disabled={mode === 'view'}
                />
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select 
                  value={formData.status} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, status: value as any }))}
                  disabled={mode === 'view'}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Draft">Draft</SelectItem>
                    <SelectItem value="Sent">Sent</SelectItem>
                    <SelectItem value="Paid">Paid</SelectItem>
                    <SelectItem value="Unpaid">Unpaid</SelectItem>
                    <SelectItem value="Overdue">Overdue</SelectItem>
                    <SelectItem value="Cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Invoice Date</Label>
                <Input
                  type="date"
                  value={formData.invoiceDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, invoiceDate: e.target.value }))}
                  disabled={mode === 'view'}
                />
              </div>
              <div className="space-y-2">
                <Label>Due Date</Label>
                <Input
                  type="date"
                  value={formData.invoiceDueDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, invoiceDueDate: e.target.value }))}
                  disabled={mode === 'view'}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Vendor</Label>
                <Select 
                  value={selectedVendor?.id || ''} 
                  onValueChange={handleVendorSelect}
                  disabled={mode === 'view'}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select vendor" />
                  </SelectTrigger>
                  <SelectContent>
                    {vendors.map(vendor => (
                      <SelectItem key={vendor.id} value={vendor.id}>
                        {vendor.name} - {vendor.service}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Contract (Optional)</Label>
                <Select 
                  value={selectedContract?.id || ''} 
                  onValueChange={handleContractSelect}
                  disabled={mode === 'view'}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select contract" />
                  </SelectTrigger>
                  <SelectContent>
                    {contracts.map(contract => (
                      <SelectItem key={contract.id} value={contract.id}>
                        {contract.title} - {contract.vendorName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Add any additional notes..."
                disabled={mode === 'view'}
              />
            </div>
          </TabsContent>

          <TabsContent value="parties" className="space-y-4">
            <div className="grid grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Seller Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Company Name</Label>
                    <Input
                      value={formData.seller?.name || ''}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        seller: { ...prev.seller!, name: e.target.value }
                      }))}
                      disabled={mode === 'view'}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Address</Label>
                    <Input
                      placeholder="Street"
                      value={formData.seller?.address?.street || ''}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        seller: { 
                          ...prev.seller!, 
                          address: { ...prev.seller!.address!, street: e.target.value }
                        }
                      }))}
                      disabled={mode === 'view'}
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <Input
                        placeholder="City"
                        value={formData.seller?.address?.city || ''}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          seller: { 
                            ...prev.seller!, 
                            address: { ...prev.seller!.address!, city: e.target.value }
                          }
                        }))}
                        disabled={mode === 'view'}
                      />
                      <Input
                        placeholder="State"
                        value={formData.seller?.address?.state || ''}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          seller: { 
                            ...prev.seller!, 
                            address: { ...prev.seller!.address!, state: e.target.value }
                          }
                        }))}
                        disabled={mode === 'view'}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <Input
                        placeholder="ZIP Code"
                        value={formData.seller?.address?.zipCode || ''}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          seller: { 
                            ...prev.seller!, 
                            address: { ...prev.seller!.address!, zipCode: e.target.value }
                          }
                        }))}
                        disabled={mode === 'view'}
                      />
                      <Input
                        placeholder="Country"
                        value={formData.seller?.address?.country || ''}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          seller: { 
                            ...prev.seller!, 
                            address: { ...prev.seller!.address!, country: e.target.value }
                          }
                        }))}
                        disabled={mode === 'view'}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Buyer Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Company Name</Label>
                    <Input
                      value={formData.buyer?.name || ''}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        buyer: { ...prev.buyer!, name: e.target.value }
                      }))}
                      disabled={mode === 'view'}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Email</Label>
                    <Input
                      type="email"
                      value={formData.buyer?.email || ''}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        buyer: { ...prev.buyer!, email: e.target.value }
                      }))}
                      disabled={mode === 'view'}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Phone</Label>
                    <Input
                      value={formData.buyer?.phone || ''}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        buyer: { ...prev.buyer!, phone: e.target.value }
                      }))}
                      disabled={mode === 'view'}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Tax ID</Label>
                    <Input
                      value={formData.buyer?.taxId || ''}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        buyer: { ...prev.buyer!, taxId: e.target.value }
                      }))}
                      disabled={mode === 'view'}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="items" className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Invoice Items</h3>
              {mode !== 'view' && (
                <Button onClick={addItem} size="sm">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Item
                </Button>
              )}
            </div>

            <div className="space-y-4">
              {items.map((item, index) => (
                <Card key={item.id}>
                  <CardContent className="pt-4">
                    <div className="grid grid-cols-12 gap-4 items-start">
                      <div className="col-span-5">
                        <Label>Description</Label>
                        <Textarea
                          value={item.description}
                          onChange={(e) => updateItem(item.id, { description: e.target.value })}
                          placeholder="Item description..."
                          disabled={mode === 'view'}
                        />
                      </div>
                      <div className="col-span-2">
                        <Label>Quantity</Label>
                        <Input
                          type="number"
                          value={item.quantity}
                          onChange={(e) => updateItem(item.id, { quantity: parseFloat(e.target.value) || 0 })}
                          disabled={mode === 'view'}
                        />
                      </div>
                      <div className="col-span-2">
                        <Label>Unit Price</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={item.unitPrice}
                          onChange={(e) => updateItem(item.id, { unitPrice: parseFloat(e.target.value) || 0 })}
                          disabled={mode === 'view'}
                        />
                      </div>
                      <div className="col-span-2">
                        <Label>Total</Label>
                        <Input
                          type="number"
                          value={item.total.toFixed(2)}
                          disabled
                        />
                      </div>
                      <div className="col-span-1">
                        {mode !== 'view' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeItem(item.id)}
                            disabled={items.length === 1}
                            className="mt-6"
                          >
                            <Minus className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Card>
              <CardContent className="pt-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span>${totals.subtotal.toFixed(2)}</span>
                  </div>
                  <div className="space-y-3">
                    {/* Tax Section */}
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <Label>Tax:</Label>
                        <Select 
                          value={formData.taxType || 'fixed'} 
                          onValueChange={(value: 'percentage' | 'fixed') => 
                            setFormData(prev => ({ 
                              ...prev, 
                              taxType: value,
                              taxes: 0,
                              taxRate: 0 
                            }))
                          }
                          disabled={mode === 'view'}
                        >
                          <SelectTrigger className="w-24">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="fixed">$</SelectItem>
                            <SelectItem value="percentage">%</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">
                          {formData.taxType === 'percentage' ? 'Tax Rate (%)' : 'Tax Amount ($)'}
                        </span>
                        <div className="flex items-center gap-1">
                          <Input
                            type="number"
                            step="0.01"
                            value={formData.taxType === 'percentage' ? (formData.taxRate || 0) : (formData.taxes || 0)}
                            onChange={(e) => {
                              const value = parseFloat(e.target.value) || 0;
                              if (formData.taxType === 'percentage') {
                                setFormData(prev => ({ ...prev, taxRate: value }));
                              } else {
                                setFormData(prev => ({ ...prev, taxes: value }));
                              }
                            }}
                            className="w-20"
                            disabled={mode === 'view'}
                          />
                          <span className="text-sm text-muted-foreground w-6">
                            {formData.taxType === 'percentage' ? '%' : '$'}
                          </span>
                        </div>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Tax Amount:</span>
                        <span className="text-blue-600 font-medium">
                          ${totals.taxAmount?.toFixed(2) || '0.00'}
                        </span>
                      </div>
                    </div>

                    <Separator />

                    {/* Discount Section */}
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <Label>Discount:</Label>
                        <Select 
                          value={formData.discountType || 'fixed'} 
                          onValueChange={(value: 'percentage' | 'fixed') => 
                            setFormData(prev => ({ 
                              ...prev, 
                              discountType: value,
                              discounts: 0,
                              discountRate: 0 
                            }))
                          }
                          disabled={mode === 'view'}
                        >
                          <SelectTrigger className="w-24">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="fixed">$</SelectItem>
                            <SelectItem value="percentage">%</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">
                          {formData.discountType === 'percentage' ? 'Discount Rate (%)' : 'Discount Amount ($)'}
                        </span>
                        <div className="flex items-center gap-1">
                          <Input
                            type="number"
                            step="0.01"
                            value={formData.discountType === 'percentage' ? (formData.discountRate || 0) : (formData.discounts || 0)}
                            onChange={(e) => {
                              const value = parseFloat(e.target.value) || 0;
                              if (formData.discountType === 'percentage') {
                                setFormData(prev => ({ ...prev, discountRate: value }));
                              } else {
                                setFormData(prev => ({ ...prev, discounts: value }));
                              }
                            }}
                            className="w-20"
                            disabled={mode === 'view'}
                          />
                          <span className="text-sm text-muted-foreground w-6">
                            {formData.discountType === 'percentage' ? '%' : '$'}
                          </span>
                        </div>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Discount Amount:</span>
                        <span className="text-red-600 font-medium">
                          -${totals.discountAmount?.toFixed(2) || '0.00'}
                        </span>
                      </div>
                    </div>
                  </div>
                  <Separator />
                  <div className="flex justify-between text-lg font-semibold">
                    <span>Total Amount:</span>
                    <span>${totals.totalAmount.toFixed(2)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="payment" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Payment Terms</Label>
                <Select 
                  value={formData.paymentTerms} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, paymentTerms: value }))}
                  disabled={mode === 'view'}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Net 15">Net 15</SelectItem>
                    <SelectItem value="Net 30">Net 30</SelectItem>
                    <SelectItem value="Net 45">Net 45</SelectItem>
                    <SelectItem value="Net 60">Net 60</SelectItem>
                    <SelectItem value="Due on Receipt">Due on Receipt</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Payment Method</Label>
                <Select 
                  value={formData.paymentMethod} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, paymentMethod: value }))}
                  disabled={mode === 'view'}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                    <SelectItem value="Credit Card">Credit Card</SelectItem>
                    <SelectItem value="Check">Check</SelectItem>
                    <SelectItem value="Cash">Cash</SelectItem>
                    <SelectItem value="PayPal">PayPal</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Purchase Order Number</Label>
              <Input
                value={formData.purchaseOrderNumber || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, purchaseOrderNumber: e.target.value }))}
                placeholder="PO-2024-001"
                disabled={mode === 'view'}
              />
            </div>

            <div className="space-y-2">
              <Label>Terms & Conditions</Label>
              <Textarea
                value={formData.termsAndConditions || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, termsAndConditions: e.target.value }))}
                placeholder="Payment terms and conditions..."
                disabled={mode === 'view'}
              />
            </div>
          </TabsContent>

          <TabsContent value="custom" className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Custom Fields</h3>
              {mode !== 'view' && (
                <Button onClick={addCustomField} size="sm">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Field
                </Button>
              )}
            </div>

            <div className="space-y-4">
              {customFields.map((field) => (
                <Card key={field.id}>
                  <CardContent className="pt-4">
                    <div className="grid grid-cols-12 gap-4 items-start">
                      <div className="col-span-3">
                        <Label>Field Name</Label>
                        <Input
                          value={field.name}
                          onChange={(e) => updateCustomField(field.id, { name: e.target.value })}
                          placeholder="Field name..."
                          disabled={mode === 'view'}
                        />
                      </div>
                      <div className="col-span-2">
                        <Label>Type</Label>
                        <Select 
                          value={field.type} 
                          onValueChange={(value) => updateCustomField(field.id, { type: value as any })}
                          disabled={mode === 'view'}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="text">Text</SelectItem>
                            <SelectItem value="number">Number</SelectItem>
                            <SelectItem value="date">Date</SelectItem>
                            <SelectItem value="select">Select</SelectItem>
                            <SelectItem value="textarea">Textarea</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="col-span-6">
                        <Label>Value</Label>
                        {field.type === 'textarea' ? (
                          <Textarea
                            value={field.value}
                            onChange={(e) => updateCustomField(field.id, { value: e.target.value })}
                            disabled={mode === 'view'}
                          />
                        ) : (
                          <Input
                            type={field.type === 'number' ? 'number' : field.type === 'date' ? 'date' : 'text'}
                            value={field.value}
                            onChange={(e) => updateCustomField(field.id, { value: e.target.value })}
                            disabled={mode === 'view'}
                          />
                        )}
                      </div>
                      <div className="col-span-1">
                        {mode !== 'view' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeCustomField(field.id)}
                            className="mt-6"
                          >
                            <Minus className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex justify-between pt-4">
          <div className="flex gap-2">
            {mode !== 'view' && (
              <Button onClick={handleSubmit}>
                {mode === 'create' ? 'Create Invoice' : 'Update Invoice'}
              </Button>
            )}
            {mode === 'edit' && onDelete && (
              <Button variant="destructive" onClick={handleDelete}>
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </Button>
            )}
          </div>
          <Button variant="outline" onClick={() => setOpen(false)}>
            {mode === 'view' ? 'Close' : 'Cancel'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
