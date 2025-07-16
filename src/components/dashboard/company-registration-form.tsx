"use client";

import { useState } from "react";
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
  AlertCircle
} from "lucide-react";
import { Company, ContactInfo, InvoiceAddress, CompanyPreferences } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { createCompany, updateCompany } from "@/lib/data";
import { Badge } from "@/components/ui/badge";

interface CompanyFormData {
  name: string;
  businessType: string;
  industry: string;
  description: string;
  website: string;
  taxId: string;
  legalId: string;
  primaryAddress: InvoiceAddress;
  primaryContact: ContactInfo;
  additionalContacts: ContactInfo[];
  preferences: CompanyPreferences;
  otherIdentifiers: Record<string, string>;
}

const initialFormData: CompanyFormData = {
  name: "",
  businessType: "",
  industry: "",
  description: "",
  website: "",
  taxId: "",
  legalId: "",
  primaryAddress: {
    street: "",
    city: "",
    state: "",
    zipCode: "",
    country: "US"
  },
  primaryContact: {
    id: "primary",
    name: "",
    email: "",
    phone: "",
    role: "Owner",
    isPrimary: true
  },
  additionalContacts: [],
  preferences: {
    defaultPaymentTerms: "Net 30",
    defaultCurrency: "USD",
    defaultTaxRate: 0,
    emailNotifications: true,
    invoiceReminders: true,
    contractReminders: true,
    preferredLanguage: "en"
  },
  otherIdentifiers: {}
};

const businessTypes = [
  "Corporation",
  "LLC",
  "Partnership",
  "Sole Proprietorship",
  "Non-Profit",
  "Government Agency",
  "Other"
];

const industries = [
  "Technology",
  "Healthcare",
  "Finance",
  "Education",
  "Manufacturing",
  "Retail",
  "Real Estate",
  "Legal",
  "Marketing",
  "Consulting",
  "Construction",
  "Transportation",
  "Food & Beverage",
  "Entertainment",
  "Agriculture",
  "Energy",
  "Other"
];

interface CompanyRegistrationFormProps {
  isEditing?: boolean;
  company?: Company;
}

export function CompanyRegistrationForm({ isEditing = false, company }: CompanyRegistrationFormProps) {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState<CompanyFormData>(
    company ? {
      name: company.name,
      businessType: company.businessType,
      industry: company.industry || "",
      description: company.description || "",
      website: company.website || "",
      taxId: company.taxId || "",
      legalId: company.legalId || "",
      primaryAddress: company.primaryAddress || initialFormData.primaryAddress,
      primaryContact: company.primaryContact || initialFormData.primaryContact,
      additionalContacts: company.contacts?.filter(c => !c.isPrimary) || [],
      preferences: company.preferences || initialFormData.preferences,
      otherIdentifiers: company.otherIdentifiers || {}
    } : initialFormData
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newContactName, setNewContactName] = useState("");
  const [newContactEmail, setNewContactEmail] = useState("");
  const [newContactPhone, setNewContactPhone] = useState("");
  const [newContactRole, setNewContactRole] = useState("");
  const [newIdentifierKey, setNewIdentifierKey] = useState("");
  const [newIdentifierValue, setNewIdentifierValue] = useState("");
  const { toast } = useToast();

  const handleInputChange = (field: string, value: any) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent as keyof CompanyFormData] as any,
          [child]: value
        }
      }));
    } else {
      setFormData(prev => ({ ...prev, [field]: value }));
    }
  };

  const handleAddContact = () => {
    if (newContactName && newContactEmail && newContactPhone) {
      const newContact: ContactInfo = {
        id: Date.now().toString(),
        name: newContactName,
        email: newContactEmail,
        phone: newContactPhone,
        role: newContactRole || "Staff",
        isPrimary: false
      };
      setFormData(prev => ({
        ...prev,
        additionalContacts: [...prev.additionalContacts, newContact]
      }));
      setNewContactName("");
      setNewContactEmail("");
      setNewContactPhone("");
      setNewContactRole("");
    }
  };

  const handleRemoveContact = (contactId: string) => {
    setFormData(prev => ({
      ...prev,
      additionalContacts: prev.additionalContacts.filter(c => c.id !== contactId)
    }));
  };

  const handleAddIdentifier = () => {
    if (newIdentifierKey && newIdentifierValue) {
      setFormData(prev => ({
        ...prev,
        otherIdentifiers: {
          ...prev.otherIdentifiers,
          [newIdentifierKey]: newIdentifierValue
        }
      }));
      setNewIdentifierKey("");
      setNewIdentifierValue("");
    }
  };

  const handleRemoveIdentifier = (key: string) => {
    setFormData(prev => ({
      ...prev,
      otherIdentifiers: Object.fromEntries(
        Object.entries(prev.otherIdentifiers).filter(([k]) => k !== key)
      )
    }));
  };

  const validateForm = (): boolean => {
    if (!formData.name.trim()) return false;
    if (!formData.businessType) return false;
    if (!formData.primaryContact.name.trim()) return false;
    if (!formData.primaryContact.email.trim()) return false;
    if (!formData.primaryContact.phone.trim()) return false;
    if (!formData.primaryAddress.street.trim()) return false;
    if (!formData.primaryAddress.city.trim()) return false;
    if (!formData.primaryAddress.state.trim()) return false;
    if (!formData.primaryAddress.zipCode.trim()) return false;
    
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.primaryContact.email)) return false;
    
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields correctly.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const companyData: Partial<Company> = {
        name: formData.name,
        businessType: formData.businessType,
        industry: formData.industry,
        description: formData.description,
        website: formData.website,
        taxId: formData.taxId,
        legalId: formData.legalId,
        addresses: [formData.primaryAddress],
        primaryAddress: formData.primaryAddress,
        contacts: [formData.primaryContact, ...formData.additionalContacts],
        primaryContact: formData.primaryContact,
        preferences: formData.preferences,
        otherIdentifiers: formData.otherIdentifiers,
        createdBy: "current-user", // This should come from auth context
      };

      if (isEditing && company) {
        await updateCompany(company.id, companyData);
        toast({
          title: "Success",
          description: "Company profile updated successfully!",
        });
      } else {
        await createCompany(companyData);
        toast({
          title: "Success",
          description: "Company profile created successfully!",
        });
      }
      
      setOpen(false);
      window.location.reload();
    } catch (error) {
      console.error('Error saving company:', error);
      toast({
        title: "Error",
        description: "Failed to save company profile. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
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
          <DialogTitle>
            {isEditing ? "Edit Company Profile" : "Company Registration"}
          </DialogTitle>
          <DialogDescription>
            {isEditing 
              ? "Update your company information and business details"
              : "Complete your company registration to get started"
            }
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Company Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleInputChange("name", e.target.value)}
                    placeholder="Enter company name"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="businessType">Business Type *</Label>
                  <Select value={formData.businessType} onValueChange={(value) => handleInputChange("businessType", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select business type" />
                    </SelectTrigger>
                    <SelectContent>
                      {businessTypes.map(type => (
                        <SelectItem key={type} value={type}>{type}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="industry">Industry</Label>
                  <Select value={formData.industry} onValueChange={(value) => handleInputChange("industry", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select industry" />
                    </SelectTrigger>
                    <SelectContent>
                      {industries.map(industry => (
                        <SelectItem key={industry} value={industry}>{industry}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="website">Website</Label>
                  <Input
                    id="website"
                    value={formData.website}
                    onChange={(e) => handleInputChange("website", e.target.value)}
                    placeholder="https://example.com"
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="description">Business Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleInputChange("description", e.target.value)}
                  placeholder="Describe your business..."
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Primary Contact */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Primary Contact</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="contactName">Full Name *</Label>
                  <Input
                    id="contactName"
                    value={formData.primaryContact.name}
                    onChange={(e) => handleInputChange("primaryContact.name", e.target.value)}
                    placeholder="Enter contact name"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="contactRole">Role</Label>
                  <Input
                    id="contactRole"
                    value={formData.primaryContact.role}
                    onChange={(e) => handleInputChange("primaryContact.role", e.target.value)}
                    placeholder="e.g., Owner, Manager"
                  />
                </div>
              </div>
              
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="contactEmail">Email *</Label>
                  <Input
                    id="contactEmail"
                    type="email"
                    value={formData.primaryContact.email}
                    onChange={(e) => handleInputChange("primaryContact.email", e.target.value)}
                    placeholder="Enter email address"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="contactPhone">Phone *</Label>
                  <Input
                    id="contactPhone"
                    type="tel"
                    value={formData.primaryContact.phone}
                    onChange={(e) => handleInputChange("primaryContact.phone", e.target.value)}
                    placeholder="Enter phone number"
                    required
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Address */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Business Address</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="street">Street Address *</Label>
                <Input
                  id="street"
                  value={formData.primaryAddress.street}
                  onChange={(e) => handleInputChange("primaryAddress.street", e.target.value)}
                  placeholder="Enter street address"
                  required
                />
              </div>
              
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="city">City *</Label>
                  <Input
                    id="city"
                    value={formData.primaryAddress.city}
                    onChange={(e) => handleInputChange("primaryAddress.city", e.target.value)}
                    placeholder="Enter city"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="state">State/Province *</Label>
                  <Input
                    id="state"
                    value={formData.primaryAddress.state}
                    onChange={(e) => handleInputChange("primaryAddress.state", e.target.value)}
                    placeholder="Enter state/province"
                    required
                  />
                </div>
              </div>
              
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="zipCode">ZIP/Postal Code *</Label>
                  <Input
                    id="zipCode"
                    value={formData.primaryAddress.zipCode}
                    onChange={(e) => handleInputChange("primaryAddress.zipCode", e.target.value)}
                    placeholder="Enter ZIP code"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="country">Country *</Label>
                  <Select value={formData.primaryAddress.country} onValueChange={(value) => handleInputChange("primaryAddress.country", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select country" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="US">United States</SelectItem>
                      <SelectItem value="CA">Canada</SelectItem>
                      <SelectItem value="GB">United Kingdom</SelectItem>
                      <SelectItem value="AU">Australia</SelectItem>
                      <SelectItem value="DE">Germany</SelectItem>
                      <SelectItem value="FR">France</SelectItem>
                      <SelectItem value="OTHER">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Legal Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Legal Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="taxId">Tax ID</Label>
                  <Input
                    id="taxId"
                    value={formData.taxId}
                    onChange={(e) => handleInputChange("taxId", e.target.value)}
                    placeholder="Enter tax ID"
                  />
                </div>
                <div>
                  <Label htmlFor="legalId">Legal/Registration ID</Label>
                  <Input
                    id="legalId"
                    value={formData.legalId}
                    onChange={(e) => handleInputChange("legalId", e.target.value)}
                    placeholder="Enter legal ID"
                  />
                </div>
              </div>
              
              {/* Other Identifiers */}
              <div>
                <Label>Other Identifiers</Label>
                <div className="space-y-2">
                  {Object.entries(formData.otherIdentifiers).map(([key, value]) => (
                    <div key={key} className="flex items-center gap-2">
                      <Badge variant="outline" className="px-2 py-1">
                        {key}: {value}
                        <button
                          type="button"
                          onClick={() => handleRemoveIdentifier(key)}
                          className="ml-1 text-xs"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    </div>
                  ))}
                  <div className="flex gap-2">
                    <Input
                      placeholder="Identifier name"
                      value={newIdentifierKey}
                      onChange={(e) => setNewIdentifierKey(e.target.value)}
                    />
                    <Input
                      placeholder="Identifier value"
                      value={newIdentifierValue}
                      onChange={(e) => setNewIdentifierValue(e.target.value)}
                    />
                    <Button type="button" onClick={handleAddIdentifier} variant="outline">
                      Add
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Business Preferences */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Business Preferences</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="defaultPaymentTerms">Default Payment Terms</Label>
                  <Select value={formData.preferences.defaultPaymentTerms} onValueChange={(value) => handleInputChange("preferences.defaultPaymentTerms", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select terms" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Net 15">Net 15</SelectItem>
                      <SelectItem value="Net 30">Net 30</SelectItem>
                      <SelectItem value="Net 45">Net 45</SelectItem>
                      <SelectItem value="Net 60">Net 60</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="defaultCurrency">Default Currency</Label>
                  <Select value={formData.preferences.defaultCurrency} onValueChange={(value) => handleInputChange("preferences.defaultCurrency", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select currency" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USD">USD</SelectItem>
                      <SelectItem value="EUR">EUR</SelectItem>
                      <SelectItem value="GBP">GBP</SelectItem>
                      <SelectItem value="CAD">CAD</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="defaultTaxRate">Default Tax Rate (%)</Label>
                  <Input
                    id="defaultTaxRate"
                    type="number"
                    value={formData.preferences.defaultTaxRate}
                    onChange={(e) => handleInputChange("preferences.defaultTaxRate", Number(e.target.value))}
                    placeholder="0"
                    min="0"
                    max="100"
                    step="0.1"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Submit */}
          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : isEditing ? "Update Profile" : "Register Company"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
