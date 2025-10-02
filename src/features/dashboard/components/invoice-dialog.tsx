
"use client";

import { useState, useEffect, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/shared/components/ui/dialog";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Textarea } from "@/shared/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/components/ui/tabs";
import { Separator } from "@/shared/components/ui/separator";
import { Plus, Trash2 } from "lucide-react";
import type { Invoice, InvoiceItem, Vendor, Contract, CustomField, Company, InvoiceEntity } from "@/shared/types/types";
import { fetchCompany } from "@/shared/lib/data";
import { useToast } from "@/shared/hooks/use-toast";

interface InvoiceDialogProps {
  invoice?: Invoice;
  vendors: Vendor[];
  contracts: Contract[];
  trigger?: React.ReactNode;
  onSubmit: (invoice: Partial<Invoice>) => void;
  onDelete?: (invoiceId: string) => void;
  mode?: 'create' | 'edit' | 'view';
}

const createEmptyItem = (): InvoiceItem => ({
  id: crypto.randomUUID(),
  description: '',
  quantity: 1,
  unitPrice: 0,
  total: 0
});

const generateInvoiceNumber = () => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `INV-${year}${month}-${random}`;
};

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
  const [activeTab, setActiveTab] = useState("basic");
  const [myRole, setMyRole] = useState<'seller' | 'buyer'>('seller');
  const [company, setCompany] = useState<Company | null>(null);
  const { toast } = useToast();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount || 0);
  };

  const initializeFormData = async () => {
    const companyData = await fetchCompany();
    setCompany(companyData);

    const companyEntity: InvoiceEntity = companyData ? {
      name: companyData.name,
      address: companyData.primaryAddress || { street: '', city: '', state: '', zipCode: '', country: 'US' },
      email: companyData.primaryContact?.email,
      phone: companyData.primaryContact?.phone,
      taxId: companyData.taxId
    } : {
        name: 'Your Company',
        address: { street: '', city: '', state: '', zipCode: '', country: 'US' }
    };
    
    if (mode === 'create') {
      setFormData({
        invoiceNumber: generateInvoiceNumber(),
        invoiceDate: new Date().toISOString().split('T')[0],
        invoiceDueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        status: 'Draft',
        paymentStatus: 'Pending',
        paymentTerms: companyData?.preferences?.defaultPaymentTerms || 'Net 30',
        paymentMethod: 'Bank Transfer',
        taxes: 0,
        taxRate: companyData?.preferences?.defaultTaxRate || 0,
        taxType: 'percentage',
        discounts: 0,
        discountRate: 0,
        discountType: 'percentage',
        seller: myRole === 'seller' ? companyEntity : { name: '', address: { street: '', city: '', state: '', zipCode: '', country: 'US' } },
        buyer: myRole === 'buyer' ? companyEntity : { name: '', address: { street: '', city: '', state: '', zipCode: '', country: 'US' } }
      });
      setItems([createEmptyItem()]);
      setCustomFields([]);
    } else if (invoice) {
      // Determine role from existing invoice
      const isSeller = invoice.seller?.name === companyData?.name;
      setMyRole(isSeller ? 'seller' : 'buyer');
      setFormData(invoice);
      setItems(invoice.items || []);
      setCustomFields(invoice.customFields || []);
    }
  };

  useEffect(() => {
    if (open) {
      initializeFormData();
    }
  }, [open, invoice, mode]);

  const handleRoleChange = (role: 'seller' | 'buyer') => {
    setMyRole(role);
    const companyEntity: InvoiceEntity = company ? {
        name: company.name,
        address: company.primaryAddress || { street: '', city: '', state: '', zipCode: '', country: 'US' },
        email: company.primaryContact?.email,
        phone: company.primaryContact?.phone,
        taxId: company.taxId,
    } : { name: '', address: { street: '', city: '', state: '', zipCode: '', country: 'US' } };

    const otherParty = role === 'seller' ? formData.seller : formData.buyer;

    setFormData(prev => ({
        ...prev,
        seller: role === 'seller' ? companyEntity : otherParty,
        buyer: role === 'buyer' ? companyEntity : otherParty
    }));
  };

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
        updated.total = (updated.quantity || 0) * (updated.unitPrice || 0);
        return updated;
      }
      return item;
    }));
  };

  const totals = useMemo(() => {
    const subtotal = items.reduce((sum, item) => sum + item.total, 0);
    
    let taxAmount = 0;
    if (formData.taxType === 'percentage') {
      taxAmount = (subtotal * (formData.taxRate || 0)) / 100;
    } else {
      taxAmount = formData.taxes || 0;
    }
    
    let discountAmount = 0;
    if (formData.discountType === 'percentage') {
      discountAmount = (subtotal * (formData.discountRate || 0)) / 100;
    } else {
      discountAmount = formData.discounts || 0;
    }
    
    const totalAmount = subtotal + taxAmount - discountAmount;
    
    return { subtotal, totalAmount, taxAmount, discountAmount };
  }, [items, formData.taxType, formData.taxRate, formData.taxes, formData.discountType, formData.discountRate, formData.discounts]);

  const handleVendorSelect = (vendorId: string) => {
    const vendor = vendors.find(v => v.id === vendorId);
    if (vendor) {
      const vendorEntity: InvoiceEntity = {
        name: vendor.name,
        address: vendor.address || { street: '', city: '', state: '', zipCode: '', country: 'US' },
        email: vendor.email,
        phone: vendor.phone,
        taxId: vendor.taxId,
        contactPerson: vendor.contactPerson,
      };

      setFormData(prev => ({
        ...prev,
        vendorId: vendor.id,
        vendorName: vendor.name,
        seller: myRole === 'buyer' ? vendorEntity : prev.seller,
        buyer: myRole === 'seller' ? vendorEntity : prev.buyer,
        paymentTerms: vendor.paymentTerms || prev.paymentTerms
      }));
    }
  };

  const handleContractSelect = (contractId: string) => {
    const contract = contracts.find(c => c.id === contractId);
    if (contract) {
      setFormData(prev => ({
        ...prev,
        contractId: contract.id,
        paymentTerms: contract.paymentTerms || prev.paymentTerms
      }));
    }
  };

  const addCustomField = () => {
    setCustomFields([...customFields, { id: crypto.randomUUID(), name: '', type: 'text', value: '' }]);
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
      taxes: totals.taxAmount,
      discounts: totals.discountAmount,
      totalAmount: totals.totalAmount,
      invoiceAmount: totals.totalAmount, 
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

  const otherPartyIsVendor = myRole === 'seller' || myRole === 'buyer';

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {mode === 'create' ? 'Create Invoice' : mode === 'edit' ? 'Edit Invoice' : 'View Invoice'}
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

          <TabsContent value="basic" className="space-y-4 pt-4">
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
                  <SelectTrigger><SelectValue /></SelectTrigger>
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
                <Input type="date" value={formData.invoiceDate || ''} onChange={(e) => setFormData(prev => ({ ...prev, invoiceDate: e.target.value }))} disabled={mode === 'view'}/>
              </div>
              <div className="space-y-2">
                <Label>Due Date</Label>
                <Input type="date" value={formData.invoiceDueDate || ''} onChange={(e) => setFormData(prev => ({ ...prev, invoiceDueDate: e.target.value }))} disabled={mode === 'view'}/>
              </div>
            </div>
             <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label>Vendor</Label>
                    <Select value={formData.vendorId || ''} onValueChange={handleVendorSelect} disabled={mode === 'view'}>
                        <SelectTrigger><SelectValue placeholder="Select vendor" /></SelectTrigger>
                        <SelectContent>
                            {vendors.map(vendor => (
                                <SelectItem key={vendor.id} value={vendor.id}>{vendor.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-2">
                    <Label>Contract (Optional)</Label>
                    <Select value={formData.contractId || ''} onValueChange={handleContractSelect} disabled={mode === 'view' || !formData.vendorId}>
                        <SelectTrigger><SelectValue placeholder="Select contract" /></SelectTrigger>
                        <SelectContent>
                            {contracts
                                .filter(c => c.partyA.id === formData.vendorId || c.partyB.id === formData.vendorId)
                                .map(contract => (
                                    <SelectItem key={contract.id} value={contract.id}>{contract.title}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>
          </TabsContent>

          <TabsContent value="parties" className="space-y-4 pt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                    <Label>My Role</Label>
                    <Select value={myRole} onValueChange={(v) => handleRoleChange(v as any)} disabled={mode === 'view'}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="seller">I am the Seller (sending invoice)</SelectItem>
                            <SelectItem value="buyer">I am the Buyer (receiving invoice)</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                    <CardHeader><CardTitle>{myRole === 'seller' ? 'Seller (Your Company)' : 'Seller (Vendor)'}</CardTitle></CardHeader>
                    <CardContent className="space-y-2">
                        <Label>Company Name</Label>
                        <Input value={formData.seller?.name || ''} onChange={(e) => setFormData(prev => ({...prev, seller: {...prev.seller!, name: e.target.value}}))} disabled={mode === 'view' || myRole === 'seller'} />
                        <Label>Email</Label>
                        <Input value={formData.seller?.email || ''} onChange={(e) => setFormData(prev => ({...prev, seller: {...prev.seller!, email: e.target.value}}))} disabled={mode === 'view' || myRole === 'seller'} />
                        <Label>Street</Label>
                        <Input value={formData.seller?.address?.street || ''} onChange={(e) => setFormData(prev => ({...prev, seller: {...prev.seller!, address: {...prev.seller!.address!, street: e.target.value}}}))} disabled={mode === 'view' || myRole === 'seller'} />
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader><CardTitle>{myRole === 'buyer' ? 'Buyer (Your Company)' : 'Buyer (Vendor)'}</CardTitle></CardHeader>
                    <CardContent className="space-y-2">
                        <Label>Company Name</Label>
                        <Input value={formData.buyer?.name || ''} onChange={(e) => setFormData(prev => ({...prev, buyer: {...prev.buyer!, name: e.target.value}}))} disabled={mode === 'view' || myRole === 'buyer'} />
                        <Label>Email</Label>
                        <Input value={formData.buyer?.email || ''} onChange={(e) => setFormData(prev => ({...prev, buyer: {...prev.buyer!, email: e.target.value}}))} disabled={mode === 'view' || myRole === 'buyer'} />
                        <Label>Street</Label>
                        <Input value={formData.buyer?.address?.street || ''} onChange={(e) => setFormData(prev => ({...prev, buyer: {...prev.buyer!, address: {...prev.buyer!.address!, street: e.target.value}}}))} disabled={mode === 'view' || myRole === 'buyer'} />
                    </CardContent>
                </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="items" className="space-y-4 pt-4">
            <div className="rounded-md border">
              <div className="grid grid-cols-12 gap-4 p-2 bg-muted/50 text-sm font-medium">
                  <div className="col-span-5">Description</div>
                  <div className="col-span-2">Quantity</div>
                  <div className="col-span-2">Unit Price</div>
                  <div className="col-span-2 text-right">Total</div>
                  <div className="col-span-1"></div>
              </div>
              <div className="p-2 space-y-2">
                {items.map((item, index) => (
                  <div key={item.id} className="grid grid-cols-12 gap-2 items-center">
                    <div className="col-span-5">
                      <Input value={item.description} placeholder="Item description" onChange={(e) => updateItem(item.id, { description: e.target.value })} disabled={mode === 'view'} />
                    </div>
                    <div className="col-span-2">
                      <Input type="number" value={item.quantity} onChange={(e) => updateItem(item.id, { quantity: parseFloat(e.target.value) || 0 })} disabled={mode === 'view'} />
                    </div>
                    <div className="col-span-2">
                      <Input type="number" value={item.unitPrice} placeholder="0.00" onChange={(e) => updateItem(item.id, { unitPrice: parseFloat(e.target.value) || 0 })} disabled={mode === 'view'} />
                    </div>
                    <div className="col-span-2 text-right font-medium">
                      {formatCurrency(item.total)}
                    </div>
                    <div className="col-span-1 text-right">
                      {mode !== 'view' && (
                        <Button variant="ghost" size="icon" onClick={() => removeItem(item.id)} className="text-muted-foreground hover:text-destructive">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {mode !== 'view' && <Button onClick={addItem} size="sm" variant="outline"><Plus className="mr-2 h-4 w-4" />Add Item</Button>}
            
            <div className="flex justify-end">
                <div className="w-full max-w-sm space-y-2">
                    <Separator />
                    <div className="flex justify-between"><span>Subtotal</span><span>{formatCurrency(totals.subtotal)}</span></div>
                    <div className="flex justify-between items-center">
                        <Label>Tax (%)</Label>
                        <Input type="number" className="w-24 h-8" value={formData.taxRate || 0} onChange={(e) => setFormData(prev => ({...prev, taxRate: parseFloat(e.target.value)}))} disabled={mode === 'view'} />
                    </div>
                    <div className="flex justify-between"><span>Tax Amount</span><span>{formatCurrency(totals.taxAmount)}</span></div>
                     <div className="flex justify-between items-center">
                        <Label>Discount (%)</Label>
                        <Input type="number" className="w-24 h-8" value={formData.discountRate || 0} onChange={(e) => setFormData(prev => ({...prev, discountRate: parseFloat(e.target.value)}))} disabled={mode === 'view'} />
                    </div>
                    <div className="flex justify-between"><span>Discount Amount</span><span className="text-destructive">-{formatCurrency(totals.discountAmount)}</span></div>
                    <Separator />
                    <div className="flex justify-between font-bold text-lg"><span>Total</span><span>{formatCurrency(totals.totalAmount)}</span></div>
                </div>
            </div>
          </TabsContent>
          
          <TabsContent value="payment" className="space-y-4 pt-4">
             <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label>Payment Terms</Label>
                    <Select value={formData.paymentTerms} onValueChange={(value) => setFormData(prev => ({ ...prev, paymentTerms: value }))} disabled={mode === 'view'}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
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
                    <Select value={formData.paymentMethod} onValueChange={(value) => setFormData(prev => ({ ...prev, paymentMethod: value }))} disabled={mode === 'view'}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                            <SelectItem value="Credit Card">Credit Card</SelectItem>
                            <SelectItem value="Check">Check</SelectItem>
                            <SelectItem value="PayPal">PayPal</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>
             <div className="space-y-2">
                <Label>Notes / Terms</Label>
                <Textarea value={formData.notes || ''} onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))} disabled={mode === 'view'} />
            </div>
          </TabsContent>

          <TabsContent value="custom" className="space-y-4 pt-4">
            {customFields.map(field => (
                <div key={field.id} className="grid grid-cols-3 gap-2 items-end">
                    <div className="space-y-1"><Label>Field Name</Label><Input value={field.name} onChange={(e) => updateCustomField(field.id, { name: e.target.value })} disabled={mode === 'view'}/></div>
                    <div className="space-y-1"><Label>Value</Label><Input value={field.value} onChange={(e) => updateCustomField(field.id, { value: e.target.value })} disabled={mode === 'view'}/></div>
                    <div>{mode !== 'view' && <Button variant="ghost" size="icon" onClick={() => removeCustomField(field.id)}><Trash2 className="h-4 w-4" /></Button>}</div>
                </div>
            ))}
            {mode !== 'view' && <Button onClick={addCustomField} size="sm" variant="outline"><Plus className="mr-2 h-4 w-4"/>Add Custom Field</Button>}
          </TabsContent>

        </Tabs>
        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          {mode !== 'view' && <Button onClick={handleSubmit}>{mode === 'create' ? 'Create' : 'Save'} Invoice</Button>}
          {mode === 'edit' && onDelete && (
              <Button variant="destructive" onClick={handleDelete}>
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </Button>
            )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
