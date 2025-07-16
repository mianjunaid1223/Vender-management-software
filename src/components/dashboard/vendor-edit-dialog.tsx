"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Edit, 
  X,
  Loader2,
  FileText,
  Receipt
} from "lucide-react";
import { Vendor, Contract, Invoice } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { updateVendor, fetchContractsByVendor, fetchInvoicesByVendor } from "@/lib/data";
import { ScrollArea } from "../ui/scroll-area";

interface VendorEditDialogProps {
  vendor: Vendor;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onVendorUpdated: (vendor: Vendor) => void;
}

export function VendorEditDialog({ vendor, open, onOpenChange, onVendorUpdated }: VendorEditDialogProps) {
  const [formData, setFormData] = useState<Partial<Vendor>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newTag, setNewTag] = useState("");
  const [showImpactDialog, setShowImpactDialog] = useState(false);
  const [impactData, setImpactData] = useState<{ contracts: Contract[], invoices: Invoice[] }>({ contracts: [], invoices: [] });
  const { toast } = useToast();

  useEffect(() => {
    if (vendor) {
      setFormData(vendor);
    }
  }, [vendor]);

  const handleInputChange = (field: string, value: any) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...(prev[parent as keyof Vendor] as any),
          [child]: value
        }
      }));
    } else {
      setFormData(prev => ({ ...prev, [field]: value }));
    }
  };
  
  const handleAddTag = () => {
    const currentTags = formData.tags || [];
    if (newTag.trim() && !currentTags.includes(newTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...currentTags, newTag.trim()]
      }));
      setNewTag("");
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: (prev.tags || []).filter(tag => tag !== tagToRemove)
    }));
  };

  const checkForImpact = async () => {
    // Only check for impact if the name is changing
    if (formData.name && formData.name !== vendor.name) {
      try {
        setIsSubmitting(true);
        const [contracts, invoices] = await Promise.all([
          fetchContractsByVendor(vendor.id),
          fetchInvoicesByVendor(vendor.id)
        ]);

        const impactedContracts = contracts.filter(c => c.vendorName !== formData.name);
        const impactedInvoices = invoices.filter(i => i.vendorName !== formData.name);

        if (impactedContracts.length > 0 || impactedInvoices.length > 0) {
          setImpactData({ contracts: impactedContracts, invoices: impactedInvoices });
          setShowImpactDialog(true);
        } else {
          await saveChanges();
        }
      } catch (error) {
        toast({
          title: "Error",
          description: "Could not fetch associated data to check for impact.",
          variant: "destructive",
        });
      } finally {
        setIsSubmitting(false);
      }
    } else {
      await saveChanges();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await checkForImpact();
  };

  const saveChanges = async () => {
    setIsSubmitting(true);
    
    try {
      const updatedVendor = await updateVendor(vendor.id, formData);
      
      toast({
        title: "Success",
        description: "Vendor updated successfully!",
      });
      
      onVendorUpdated(updatedVendor);
      onOpenChange(false);

    } catch (error) {
      console.error('Error updating vendor:', error);
      toast({
        title: "Error",
        description: "Failed to update vendor. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
      setShowImpactDialog(false);
    }
  };

  return (
    <>
      <Dialog open={open && !showImpactDialog} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Vendor</DialogTitle>
            <DialogDescription>
              Update the details for "{vendor.name}"
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto p-2">
            <div>
              <Label htmlFor="name">Company Name *</Label>
              <Input
                id="name"
                value={formData.name || ''}
                onChange={(e) => handleInputChange("name", e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="email">Email Address *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email || ''}
                onChange={(e) => handleInputChange("email", e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="phone">Phone Number *</Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone || ''}
                onChange={(e) => handleInputChange("phone", e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="service">Service/Industry *</Label>
              <Input
                id="service"
                value={formData.service || ''}
                onChange={(e) => handleInputChange("service", e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="contactPerson">Primary Contact Person</Label>
              <Input
                id="contactPerson"
                value={formData.contactPerson || ''}
                onChange={(e) => handleInputChange("contactPerson", e.target.value)}
              />
            </div>
            
            <div>
                <Label htmlFor="street">Street Address</Label>
                <Input
                  id="street"
                  value={formData.address?.street || ''}
                  onChange={(e) => handleInputChange("address.street", e.target.value)}
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    value={formData.address?.city || ''}
                    onChange={(e) => handleInputChange("address.city", e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="state">State/Province</Label>
                  <Input
                    id="state"
                    value={formData.address?.state || ''}
                    onChange={(e) => handleInputChange("address.state", e.target.value)}
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="zipCode">ZIP/Postal Code</Label>
                  <Input
                    id="zipCode"
                    value={formData.address?.zipCode || ''}
                    onChange={(e) => handleInputChange("address.zipCode", e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="country">Country</Label>
                  <Input
                    id="country"
                    value={formData.address?.country || ''}
                    onChange={(e) => handleInputChange("address.country", e.target.value)}
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="taxId">Tax ID</Label>
                <Input
                  id="taxId"
                  value={formData.taxId || ''}
                  onChange={(e) => handleInputChange("taxId", e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="paymentTerms">Payment Terms *</Label>
                <Select value={formData.paymentTerms} onValueChange={(value) => handleInputChange("paymentTerms", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select payment terms" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Net 15">Net 15</SelectItem>
                    <SelectItem value="Net 30">Net 30</SelectItem>
                    <SelectItem value="Net 45">Net 45</SelectItem>
                    <SelectItem value="Net 60">Net 60</SelectItem>
                    <SelectItem value="Advance">Advance</SelectItem>
                    <SelectItem value="COD">COD</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="status">Status *</Label>
                <Select value={formData.status} onValueChange={(value) => handleInputChange("status", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select vendor status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Active">Active</SelectItem>
                    <SelectItem value="Pending">Pending</SelectItem>
                    <SelectItem value="Inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes || ''}
                  onChange={(e) => handleInputChange("notes", e.target.value)}
                  rows={3}
                />
              </div>
              <div>
                <Label htmlFor="tags">Tags</Label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {(formData.tags || []).map(tag => (
                    <Badge key={tag} variant="secondary" className="px-2 py-1">
                      {tag}
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(tag)}
                        className="ml-1 text-xs"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    placeholder="Enter tag and press Add"
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                  />
                  <Button type="button" onClick={handleAddTag} variant="outline">
                    Add
                  </Button>
                </div>
              </div>

            <div className="flex justify-end space-x-2 pt-4 border-t">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Edit className="mr-2 h-4 w-4" />
                )}
                Save Changes
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
      
      {/* Impact Confirmation Dialog */}
      <AlertDialog open={showImpactDialog} onOpenChange={setShowImpactDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Vendor Name Change</AlertDialogTitle>
            <AlertDialogDescription>
              Changing the vendor's name will also update the name on all associated records listed below. This action cannot be easily undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {(impactData.contracts.length > 0 || impactData.invoices.length > 0) && (
            <div className="mt-4 space-y-4">
              {impactData.contracts.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-2">Affected Contracts:</h4>
                  <ScrollArea className="h-24 w-full rounded-md border p-2">
                    <ul className="space-y-1">
                      {impactData.contracts.map(contract => (
                        <li key={contract.id} className="text-sm flex items-center gap-2">
                          <FileText className="h-4 w-4 text-muted-foreground"/>
                          <span>{contract.title}</span>
                        </li>
                      ))}
                    </ul>
                  </ScrollArea>
                </div>
              )}
              {impactData.invoices.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-2">Affected Invoices:</h4>
                  <ScrollArea className="h-24 w-full rounded-md border p-2">
                    <ul className="space-y-1">
                      {impactData.invoices.map(invoice => (
                        <li key={invoice.id} className="text-sm flex items-center gap-2">
                           <Receipt className="h-4 w-4 text-muted-foreground"/>
                          <span>{invoice.invoiceNumber} - ${invoice.invoiceAmount}</span>
                        </li>
                      ))}
                    </ul>
                  </ScrollArea>
                </div>
              )}
            </div>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setShowImpactDialog(false)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={saveChanges} disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Confirm and Save"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
