
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
  AlertCircle,
  FileText,
  Receipt
} from "lucide-react";
import { Company, ContactInfo, InvoiceAddress, CompanyPreferences, Contract, Invoice } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { createOrUpdateCompanyAction } from "@/app/actions";
import { fetchContracts, fetchInvoices } from "@/lib/data";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";


interface CompanyRegistrationFormProps {
  isEditing?: boolean;
  company?: Company;
}

export function CompanyRegistrationForm({ isEditing = false, company }: CompanyRegistrationFormProps) {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState<Partial<Company>>(company || {});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showImpactDialog, setShowImpactDialog] = useState(false);
  const [impactData, setImpactData] = useState<{ contracts: Contract[], invoices: Invoice[] }>({ contracts: [], invoices: [] });
  const { toast } = useToast();

  useEffect(() => {
    if (company) {
      setFormData(company);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const [contracts, invoices] = await Promise.all([
        fetchContracts(),
        fetchInvoices()
      ]);
      const companyId = company?.id || 'company';
      
      const affectedContracts = contracts.filter(c => c.partyA.id === companyId || c.partyB.id === companyId);
      const affectedInvoices = invoices.filter(i => i.seller.name === company?.name || i.buyer.name === company?.name);

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
    } finally {
        setIsSubmitting(false);
    }
  };

  const saveChanges = async () => {
    setIsSubmitting(true);
    try {
      await createOrUpdateCompanyAction(formData);
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
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{isEditing ? "Edit Company Profile" : "Company Registration"}</DialogTitle>
            <DialogDescription>{isEditing ? "Update your company information." : "Complete your registration."}</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-6">
            <Card>
              <CardHeader><CardTitle className="text-lg">Basic Information</CardTitle></CardHeader>
              <CardContent className="space-y-4">
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
                <div>
                  <Label htmlFor="description">Business Description</Label>
                  <Textarea id="description" value={formData.description || ''} onChange={(e) => handleInputChange("description", e.target.value)} rows={3} />
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-end space-x-2">
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
