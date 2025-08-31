
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
import { Datalist } from "@/components/ui/datalist";
import { 
  Edit, 
  X,
  Loader2,
} from "lucide-react";
import { Vendor } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";

interface VendorEditDialogProps {
  vendor: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onVendorUpdated: (vendor: Vendor) => void;
}

export function VendorEditDialog({ vendor, open, onOpenChange, onVendorUpdated }: VendorEditDialogProps) {
  const [formData, setFormData] = useState<Partial<Vendor>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newTag, setNewTag] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    if (vendor) {
      setFormData(vendor);
    }
  }, [vendor, open]);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const response = await fetch(`/api/vendors/${vendor._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update vendor');
      }

      const updatedVendor = await response.json();
      
      toast({
        title: "Success",
        description: "Vendor updated successfully!",
      });
      
      onVendorUpdated(updatedVendor);
      onOpenChange(false);

    } catch (error: any) {
      console.error('Error updating vendor:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to update vendor. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
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
                <Datalist 
                  id="paymentTerms"
                  options={["Net 15", "Net 30", "Net 45", "Net 60", "Advance", "COD"]}
                  value={formData.paymentTerms || ''}
                  onChange={(e) => handleInputChange("paymentTerms", e.target.value)}
                  placeholder="Select or type payment terms"
                />
              </div>
              <div>
                <Label htmlFor="status">Status *</Label>
                <Datalist 
                  id="status"
                  options={["Active", "Pending", "Inactive"]}
                  value={formData.status || ''}
                  onChange={(e) => handleInputChange("status", e.target.value)}
                  placeholder="Select or type vendor status"
                />
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
    </>
  );
}
