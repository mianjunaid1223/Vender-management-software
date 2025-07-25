
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
  DialogTrigger,
} from "@/components/ui/dialog";
import { Datalist } from "@/components/ui/datalist";
import { 
  Plus, 
  User, 
  MapPin, 
  CreditCard, 
  CheckCircle,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  Upload,
  X
} from "lucide-react";
import { Vendor } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { createVendor } from "@/lib/data";
import { cn } from "@/lib/utils";

interface VendorFormData {
  name: string;
  email: string;
  phone: string;
  service: string;
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  taxId: string;
  contactPerson: string;
  paymentTerms: string;
  notes: string;
  tags: string[];
  status: 'Active' | 'Inactive' | 'Pending';
}

const initialFormData: VendorFormData = {
  name: "",
  email: "",
  phone: "",
  service: "",
  address: {
    street: "",
    city: "",
    state: "",
    zipCode: "",
    country: "United States"
  },
  taxId: "",
  contactPerson: "",
  paymentTerms: "Net 30",
  notes: "",
  tags: [],
  status: "Active"
};

const onboardingSteps = [
  {
    id: 1,
    title: "Basic Information",
    description: "Essential vendor details and contact information",
    icon: User,
    fields: ["name", "email", "phone", "service", "contactPerson"]
  },
  {
    id: 2,
    title: "Address & Location",
    description: "Vendor's business address and location details",
    icon: MapPin,
    fields: ["address.street", "address.city", "address.state", "address.zipCode", "address.country"]
  },
  {
    id: 3,
    title: "Business Details",
    description: "Tax information and payment preferences",
    icon: CreditCard,
    fields: ["taxId", "paymentTerms", "status"]
  },
  {
    id: 4,
    title: "Additional Information",
    description: "Notes, tags, and final review",
    icon: CheckCircle,
    fields: ["notes", "tags"]
  }
];

const commonServices = [
  "Software Development",
  "Web Design",
  "Marketing",
  "Consulting",
  "Legal Services",
  "Accounting",
  "IT Support",
  "Graphic Design",
  "Content Writing",
  "Photography",
  "Video Production",
  "Other"
];

const countries = [
    "United States", "Canada", "United Kingdom", "Australia", "Germany", "France", "Japan", "Other"
]

export function VendorOnboardingDialog() {
  const [open, setOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<VendorFormData>(initialFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newTag, setNewTag] = useState("");
  const { toast } = useToast();

  const handleInputChange = (field: string, value: any) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent as keyof VendorFormData] as any,
          [child]: value
        }
      }));
    } else {
      setFormData(prev => ({ ...prev, [field]: value }));
    }
  };

  const validateStep = (step: number): boolean => {
    const stepConfig = onboardingSteps[step - 1];
    const requiredFields = stepConfig.fields;
    
    for (const field of requiredFields) {
      if (field.includes('.')) {
        const [parent, child] = field.split('.');
        const parentData = formData[parent as keyof VendorFormData] as any;
        if (!parentData || !parentData[child]) {
          return false;
        }
      } else {
        if (!formData[field as keyof VendorFormData]) {
          return false;
        }
      }
    }
    
    // Email validation
    if (step === 1 && formData.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        return false;
      }
    }
    
    return true;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, onboardingSteps.length));
    } else {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields correctly.",
        variant: "destructive",
      });
    }
  };

  const handlePrevious = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleAddTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()]
      }));
      setNewTag("");
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const vendorData: Partial<Vendor> = {
        ...formData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await createVendor(vendorData);
      
      toast({
        title: "Success",
        description: "Vendor onboarded successfully!",
      });
      
      setOpen(false);
      setCurrentStep(1);
      setFormData(initialFormData);
      
      // Refresh the page to show the new vendor
      window.location.reload();
    } catch (error) {
      console.error('Error creating vendor:', error);
      toast({
        title: "Error",
        description: "Failed to onboard vendor. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Company Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                placeholder="Enter vendor company name"
              />
            </div>
            <div>
              <Label htmlFor="email">Email Address *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange("email", e.target.value)}
                placeholder="Enter vendor email"
              />
            </div>
            <div>
              <Label htmlFor="phone">Phone Number *</Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => handleInputChange("phone", e.target.value)}
                placeholder="Enter vendor phone number"
              />
            </div>
            <div>
              <Label htmlFor="service">Service/Industry *</Label>
              <Datalist 
                id="service"
                options={commonServices}
                value={formData.service}
                onChange={(e) => handleInputChange("service", e.target.value)}
                placeholder="Select or type service type"
              />
            </div>
            <div>
              <Label htmlFor="contactPerson">Primary Contact Person *</Label>
              <Input
                id="contactPerson"
                value={formData.contactPerson}
                onChange={(e) => handleInputChange("contactPerson", e.target.value)}
                placeholder="Enter primary contact name"
              />
            </div>
          </div>
        );
      
      case 2:
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="street">Street Address *</Label>
              <Input
                id="street"
                value={formData.address.street}
                onChange={(e) => handleInputChange("address.street", e.target.value)}
                placeholder="Enter street address"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="city">City *</Label>
                <Input
                  id="city"
                  value={formData.address.city}
                  onChange={(e) => handleInputChange("address.city", e.target.value)}
                  placeholder="Enter city"
                />
              </div>
              <div>
                <Label htmlFor="state">State/Province *</Label>
                <Input
                  id="state"
                  value={formData.address.state}
                  onChange={(e) => handleInputChange("address.state", e.target.value)}
                  placeholder="Enter state/province"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="zipCode">ZIP/Postal Code *</Label>
                <Input
                  id="zipCode"
                  value={formData.address.zipCode}
                  onChange={(e) => handleInputChange("address.zipCode", e.target.value)}
                  placeholder="Enter ZIP code"
                />
              </div>
              <div>
                <Label htmlFor="country">Country *</Label>
                <Datalist 
                  id="country"
                  options={countries}
                  value={formData.address.country}
                  onChange={(e) => handleInputChange("address.country", e.target.value)}
                  placeholder="Select or type country"
                />
              </div>
            </div>
          </div>
        );
      
      case 3:
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="taxId">Tax ID (Optional)</Label>
              <Input
                id="taxId"
                value={formData.taxId}
                onChange={(e) => handleInputChange("taxId", e.target.value)}
                placeholder="Enter tax ID or registration number"
              />
            </div>
            <div>
              <Label htmlFor="paymentTerms">Payment Terms *</Label>
              <Datalist 
                id="paymentTerms"
                options={["Net 15", "Net 30", "Net 45", "Net 60", "Advance", "COD"]}
                value={formData.paymentTerms}
                onChange={(e) => handleInputChange("paymentTerms", e.target.value)}
                placeholder="Select or type payment terms"
              />
            </div>
            <div>
              <Label htmlFor="status">Status *</Label>
              <Datalist 
                id="status"
                options={["Active", "Pending", "Inactive"]}
                value={formData.status}
                onChange={(e) => handleInputChange("status", e.target.value)}
                placeholder="Select or type vendor status"
              />
            </div>
          </div>
        );
      
      case 4:
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => handleInputChange("notes", e.target.value)}
                placeholder="Add any additional notes about this vendor"
                rows={4}
              />
            </div>
            <div>
              <Label htmlFor="tags">Tags</Label>
              <div className="flex flex-wrap gap-2 mb-2">
                {formData.tags.map(tag => (
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
            
            {/* Summary */}
            <div className="bg-muted/50 p-4 rounded-lg">
              <h4 className="font-medium mb-2">Vendor Summary</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">Company:</span> {formData.name}
                </div>
                <div>
                  <span className="font-medium">Email:</span> {formData.email}
                </div>
                <div>
                  <span className="font-medium">Phone:</span> {formData.phone}
                </div>
                <div>
                  <span className="font-medium">Service:</span> {formData.service}
                </div>
                <div>
                  <span className="font-medium">Contact:</span> {formData.contactPerson}
                </div>
                <div>
                  <span className="font-medium">Payment Terms:</span> {formData.paymentTerms}
                </div>
                <div>
                  <span className="font-medium">Status:</span> {formData.status}
                </div>
                <div>
                  <span className="font-medium">Location:</span> {formData.address.city}, {formData.address.state}
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-2 p-3 bg-blue-50 rounded-lg">
              <AlertCircle className="h-5 w-5 text-blue-600" />
              <p className="text-sm text-blue-800">
                Review all information before submitting. You can edit vendor details later if needed.
              </p>
            </div>
          </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Add Vendor
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto w-[95vw] sm:w-full">
        <DialogHeader>
          <DialogTitle>Vendor Onboarding</DialogTitle>
          <DialogDescription>
            Add a new vendor to your system with comprehensive information
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6 pb-4">
          {/* Progress Steps */}
          <div className="flex items-center justify-between overflow-x-auto">
            {onboardingSteps.map((step, index) => {
              const Icon = step.icon;
              const isCompleted = currentStep > step.id;
              const isCurrent = currentStep === step.id;
              
              return (
                <div key={step.id} className="flex flex-col items-center space-y-2">
                  <div className={cn(
                    "flex items-center justify-center w-10 h-10 rounded-full border-2 transition-colors",
                    isCompleted && "bg-green-100 border-green-500 text-green-600",
                    isCurrent && "bg-blue-100 border-blue-500 text-blue-600",
                    !isCompleted && !isCurrent && "bg-gray-100 border-gray-300 text-gray-400"
                  )}>
                    {isCompleted ? (
                      <CheckCircle className="h-5 w-5" />
                    ) : (
                      <Icon className="h-5 w-5" />
                    )}
                  </div>
                  <div className="text-center">
                    <div className={cn(
                      "text-xs font-medium",
                      isCurrent && "text-blue-600",
                      isCompleted && "text-green-600"
                    )}>
                      {step.title}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          
          {/* Current Step Content */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                {onboardingSteps[currentStep - 1].title}
              </CardTitle>
              <CardDescription>
                {onboardingSteps[currentStep - 1].description}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {renderStepContent()}
            </CardContent>
          </Card>
          
          {/* Navigation */}
          <div className="flex flex-col sm:flex-row justify-between items-center gap-3 pt-4 border-t">
            <Button 
              variant="outline" 
              onClick={handlePrevious}
              disabled={currentStep === 1}
              className="w-full sm:w-auto order-2 sm:order-1"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Previous
            </Button>
            
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto order-1 sm:order-2">
              {currentStep < onboardingSteps.length ? (
                <Button onClick={handleNext} className="w-full sm:w-auto">
                  Next
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              ) : (
                <Button onClick={handleSubmit} disabled={isSubmitting} className="w-full sm:w-auto">
                  {isSubmitting ? "Creating..." : "Complete Onboarding"}
                </Button>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
