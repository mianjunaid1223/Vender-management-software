
"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  Building, 
  Plus, 
  Edit, 
  MapPin, 
  User, 
  Phone, 
  Mail, 
  Globe,
  X,
  CheckCircle,
  FileText,
  Receipt,
  Trash2,
  Star
} from "lucide-react";
import { Company, ContactInfo, InvoiceAddress, CompanyPreferences, Contract, Invoice } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { createOrUpdateCompanyAction } from "@/app/actions";
import { fetchContracts, fetchInvoices } from "@/lib/data";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";


interface CompanyRegistrationFormProps {
  isEditing?: boolean;
  company?: Company;
}

const getInitialFormData = (company?: Company): Partial<Company> => {
    if (company) return company;

    return {
        name: "",
        businessType: "",
        addresses: [{ street: "", city: "", state: "", zipCode: "", country: "US" }],
        contacts: [{ id: crypto.randomUUID(), name: "", email: "", phone: "", isPrimary: true }],
        preferences: { defaultPaymentTerms: "Net 30", defaultCurrency: "USD" },
    };
};

export function CompanyRegistrationForm({ isEditing = false, company }: CompanyRegistrationFormProps) {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState<Partial<Company>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showImpactDialog, setShowImpactDialog] = useState(false);
  const [impactData, setImpactData] = useState<{ contracts: Contract[], invoices: Invoice[] }>({ contracts: [], invoices: [] });
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      setFormData(getInitialFormData(company));
    }
  }, [company, open]);

  const businessTypes = [
    "Corporation", "LLC", "Partnership", "Sole Proprietorship", "Non-Profit", "Government Agency", "Other"
  ];
  const industries = [
    "Technology", "Healthcare", "Finance", "Education", "Manufacturing", "Retail", "Real Estate", "Marketing", "Consulting", "Other"
  ];

  const handleInputChange = (field: string, value: any) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: { ...(prev[parent as keyof Company] as any), [child]: value }
      }));
    } else {
      setFormData(prev => ({ ...prev, [field]: value }));
    }
  };

    const handleListChange = (listName: 'addresses' | 'contacts', index: number, field: string, value: any) => {
        const list = formData[listName] || [];
        const updatedList = list.map((item, i) =>
            i === index ? { ...item, [field]: value } : item
        );
        setFormData(prev => ({ ...prev, [listName]: updatedList }));
    };
    
    const addListItem = (listName: 'addresses' | 'contacts') => {
        const list = formData[listName] || [];
        const newItem = listName === 'addresses'
            ? { street: "", city: "", state: "", zipCode: "", country: "US" }
            : { id: crypto.randomUUID(), name: "", email: "", phone: "" };
        setFormData(prev => ({ ...prev, [listName]: [...list, newItem] }));
    };

    const removeListItem = (listName: 'addresses' | 'contacts', index: number) => {
        const list = (formData[listName] || []).filter((_, i) => i !== index);
        setFormData(prev => ({ ...prev, [listName]: list }));
    };

    const setPrimary = (listName: 'addresses' | 'contacts', indexToSet: number) => {
        const list = (formData[listName] || []).map((item, index) => ({
            ...item,
            isPrimary: index === indexToSet
        }));
        
        if (listName === 'contacts') {
             setFormData(prev => ({ ...prev, contacts: list as ContactInfo[] }));
        } else {
            // Address logic can be simpler if we don't store `isPrimary` on it
            // For now, let's assume `primaryAddress` is derived.
        }
    };


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const [contracts, invoices] = await Promise.all([
        fetchContracts(),
        fetchInvoices()
      ]);
      const companyId = company?.id;
      
      const affectedContracts = companyId ? contracts.filter(c => c.partyA.id === companyId || c.partyB.id === companyId) : [];
      const affectedInvoices = company?.name ? invoices.filter(i => i.seller?.name === company.name || i.buyer?.name === company.name) : [];

      if (affectedContracts.length > 0 || affectedInvoices.length > 0) {
        setImpactData({ contracts: affectedContracts, invoices: affectedInvoices });
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
      setIsSubmitting(false);
    }
  };

  const saveChanges = async () => {
    setIsSubmitting(true);
    try {
      // Ensure the ID is passed for updates
      const dataToSave = company?.id ? { ...formData, id: company.id } : formData;
      await createOrUpdateCompanyAction(dataToSave);
      toast({
        title: "Success",
        description: "Company profile saved successfully!",
      });
      setOpen(false);
      window.location.reload();
    } catch (error) {
      console.error('Error saving company:', error);
      toast({
        title: "Error",
        description: "Failed to save company profile.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
      setShowImpactDialog(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          {isEditing ? (
            <Button variant="outline" size="sm">
              <Edit className="mr-2 h-4 w-4" />
              Edit Profile
            </Button>
          ) : (
            <Button>
              <Building className="mr-2 h-4 w-4" />
              Register Company
            </Button>
          )}
        </DialogTrigger>
        <DialogContent className="max-w-4xl max-h-[90vh]">
            <DialogHeader>
                <DialogTitle>{isEditing ? "Edit Company Profile" : "Company Registration"}</DialogTitle>
                <DialogDescription>{isEditing ? "Update your company information." : "Complete your registration."}</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="flex flex-col h-[80vh]">
                <ScrollArea className="flex-grow pr-6">
                    <Tabs defaultValue="basic" className="space-y-6">
                        <TabsList>
                            <TabsTrigger value="basic">Basic Info</TabsTrigger>
                            <TabsTrigger value="address">Address</TabsTrigger>
                            <TabsTrigger value="contacts">Contacts</TabsTrigger>
                            <TabsTrigger value="preferences">Preferences</TabsTrigger>
                        </TabsList>
                        
                        <TabsContent value="basic" className="space-y-4">
                             <div className="grid md:grid-cols-2 gap-4">
                                <div>
                                    <Label htmlFor="name">Company Name *</Label>
                                    <Input id="name" value={formData.name || ''} onChange={(e) => handleInputChange("name", e.target.value)} required />
                                </div>
                                <div>
                                    <Label htmlFor="businessType">Business Type *</Label>
                                    <Select value={formData.businessType || ''} onValueChange={(value) => handleInputChange("businessType", value)}>
                                    <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                                    <SelectContent>{businessTypes.map(type => <SelectItem key={type} value={type}>{type}</SelectItem>)}</SelectContent>
                                    </Select>
                                </div>
                                </div>
                                <div className="grid md:grid-cols-2 gap-4">
                                <div>
                                    <Label htmlFor="industry">Industry</Label>
                                    <Select value={formData.industry || ''} onValueChange={(value) => handleInputChange("industry", value)}>
                                    <SelectTrigger><SelectValue placeholder="Select industry" /></SelectTrigger>
                                    <SelectContent>{industries.map(i => <SelectItem key={i} value={i}>{i}</SelectItem>)}</SelectContent>
                                    </Select>
                                </div>
                                <div>
                                    <Label htmlFor="website">Website</Label>
                                    <Input id="website" value={formData.website || ''} onChange={(e) => handleInputChange("website", e.target.value)} />
                                </div>
                                </div>
                                <div className="grid md:grid-cols-2 gap-4">
                                    <div><Label htmlFor="taxId">Tax ID</Label><Input id="taxId" value={formData.taxId || ""} onChange={e => handleInputChange("taxId", e.target.value)} /></div>
                                    <div><Label htmlFor="legalId">Legal ID</Label><Input id="legalId" value={formData.legalId || ""} onChange={e => handleInputChange("legalId", e.target.value)} /></div>
                                </div>
                                <div>
                                <Label htmlFor="description">Business Description</Label>
                                <Textarea id="description" value={formData.description || ''} onChange={(e) => handleInputChange("description", e.target.value)} rows={4} />
                                </div>
                        </TabsContent>
                        
                        <TabsContent value="address" className="space-y-4">
                             {(formData.addresses || []).map((address, index) => (
                                <Card key={index} className="relative p-4">
                                    <CardContent className="space-y-4 pt-6">
                                        <div className="grid md:grid-cols-2 gap-4">
                                            <div><Label>Street</Label><Input value={address.street} onChange={e => handleListChange('addresses', index, 'street', e.target.value)} /></div>
                                            <div><Label>City</Label><Input value={address.city} onChange={e => handleListChange('addresses', index, 'city', e.target.value)} /></div>
                                        </div>
                                        <div className="grid md:grid-cols-3 gap-4">
                                            <div><Label>State</Label><Input value={address.state} onChange={e => handleListChange('addresses', index, 'state', e.target.value)} /></div>
                                            <div><Label>Zip Code</Label><Input value={address.zipCode} onChange={e => handleListChange('addresses', index, 'zipCode', e.target.value)} /></div>
                                            <div><Label>Country</Label><Input value={address.country} onChange={e => handleListChange('addresses', index, 'country', e.target.value)} /></div>
                                        </div>
                                         {(formData.addresses?.length ?? 0) > 1 && (
                                            <Button variant="destructive" size="icon" className="absolute top-2 right-2 h-7 w-7" onClick={() => removeListItem('addresses', index)}><Trash2 className="h-4 w-4" /></Button>
                                        )}
                                    </CardContent>
                                </Card>
                            ))}
                            <Button type="button" variant="outline" onClick={() => addListItem('addresses')}><Plus className="mr-2 h-4 w-4"/> Add Address</Button>
                        </TabsContent>
                        
                        <TabsContent value="contacts" className="space-y-4">
                             {(formData.contacts || []).map((contact, index) => (
                                <Card key={contact.id || index} className="relative p-4">
                                    <CardContent className="space-y-4 pt-6">
                                        <div className="grid md:grid-cols-2 gap-4">
                                            <div><Label>Name</Label><Input value={contact.name} onChange={e => handleListChange('contacts', index, 'name', e.target.value)} /></div>
                                            <div><Label>Role</Label><Input value={contact.role} onChange={e => handleListChange('contacts', index, 'role', e.target.value)} /></div>
                                        </div>
                                        <div className="grid md:grid-cols-2 gap-4">
                                            <div><Label>Email</Label><Input type="email" value={contact.email} onChange={e => handleListChange('contacts', index, 'email', e.target.value)} /></div>
                                            <div><Label>Phone</Label><Input type="tel" value={contact.phone} onChange={e => handleListChange('contacts', index, 'phone', e.target.value)} /></div>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <input type="radio" name="primaryContact" id={`primaryContact-${index}`} checked={contact.isPrimary} onChange={() => setPrimary('contacts', index)} />
                                                <Label htmlFor={`primaryContact-${index}`}>Set as Primary Contact</Label>
                                            </div>
                                            {(formData.contacts?.length ?? 0) > 1 && (
                                                <Button variant="destructive" size="icon" className="h-7 w-7" onClick={() => removeListItem('contacts', index)}><Trash2 className="h-4 w-4" /></Button>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                            <Button type="button" variant="outline" onClick={() => addListItem('contacts')}><Plus className="mr-2 h-4 w-4"/> Add Contact</Button>
                        </TabsContent>

                        <TabsContent value="preferences" className="space-y-4">
                            <Card>
                                <CardHeader><CardTitle>Business Preferences</CardTitle></CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="grid md:grid-cols-3 gap-4">
                                        <div><Label>Default Payment Terms</Label><Input value={formData.preferences?.defaultPaymentTerms} onChange={e => handleInputChange('preferences.defaultPaymentTerms', e.target.value)} /></div>
                                        <div><Label>Default Currency</Label><Input value={formData.preferences?.defaultCurrency} onChange={e => handleInputChange('preferences.defaultCurrency', e.target.value)} /></div>
                                        <div><Label>Default Tax Rate (%)</Label><Input type="number" value={formData.preferences?.defaultTaxRate} onChange={e => handleInputChange('preferences.defaultTaxRate', parseFloat(e.target.value))} /></div>
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>

                    </Tabs>
                </ScrollArea>
                <div className="flex-shrink-0 flex justify-end space-x-2 pt-4 border-t">
                    <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                    <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting ? "Saving..." : isEditing ? "Update Profile" : "Register Company"}
                    </Button>
                </div>
            </form>
        </DialogContent>
      </Dialog>
      
      <AlertDialog open={showImpactDialog} onOpenChange={setShowImpactDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Company Profile Update</AlertDialogTitle>
            <AlertDialogDescription>
               This action will update your company details. This will reflect in all associated contracts and invoices. Please review before saving.
            </AlertDialogDescription>
          </AlertDialogHeader>
           {(impactData.contracts.length > 0 || impactData.invoices.length > 0) && (
            <div className="mt-4 space-y-4 max-h-[300px] overflow-y-auto pr-2">
              {impactData.contracts.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-2">Affected Contracts ({impactData.contracts.length}):</h4>
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
                  <h4 className="font-semibold mb-2">Affected Invoices ({impactData.invoices.length}):</h4>
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
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={saveChanges} disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Confirm and Save"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
