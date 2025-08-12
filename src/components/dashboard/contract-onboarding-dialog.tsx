
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
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Plus, 
  FileText, 
  Calendar, 
  DollarSign, 
  User, 
  CheckCircle,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  Users,
  Briefcase
} from "lucide-react";
import { Contract, ContractType, ContractStatus, Vendor, Company, ContractParty } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { createContract } from "@/lib/database/queries";
import { cn } from "@/lib/utils/index";

interface ContractFormData {
  title: string;
  partyA: ContractParty;
  partyB: ContractParty;
  type: ContractType;
  value: number;
  currency: string;
  startDate: string;
  endDate: string;
  paymentTerms: string;
  description: string;
  autoRenew: boolean;
  renewalPeriod: number;
  termsAndConditions: string;
}

const initialFormData = (companyName: string): ContractFormData => ({
  title: "",
  partyA: { id: 'company', name: companyName, role: 'Client' },
  partyB: { id: '', name: '', role: 'Provider' },
  type: "Service",
  value: 0,
  currency: "USD",
  startDate: "",
  endDate: "",
  paymentTerms: "Net 30",
  description: "",
  autoRenew: false,
  renewalPeriod: 12,
  termsAndConditions: ""
});

const onboardingSteps = [
  {
    id: 1,
    title: "Basic Information",
    description: "Contract details and parties",
    icon: FileText,
    fields: ["title", "partyA", "partyB"]
  },
  {
    id: 2,
    title: "Financial Details",
    description: "Contract value and payment terms",
    icon: DollarSign,
    fields: ["value", "currency", "paymentTerms"]
  },
  {
    id: 3,
    title: "Duration & Terms",
    description: "Contract timeline and renewal settings",
    icon: Calendar,
    fields: ["startDate", "endDate"]
  },
  {
    id: 4,
    title: "Review & Submit",
    description: "Review all information before creating",
    icon: CheckCircle,
    fields: []
  }
];

interface ContractOnboardingDialogProps {
    vendors: Vendor[];
    company: Company | null;
    onContractAdded: (contract: Contract) => void;
}

export function ContractOnboardingDialog({ vendors, company, onContractAdded }: ContractOnboardingDialogProps) {
  const [open, setOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<ContractFormData>(initialFormData(company?.name || 'Your Company'));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handlePartyBSelect = (vendorId: string) => {
    const selectedVendor = vendors.find(v => v.id === vendorId);
    if(selectedVendor) {
        setFormData(prev => ({
            ...prev,
            partyB: { ...prev.partyB, id: selectedVendor.id, name: selectedVendor.name }
        }))
    }
  }

  const handleMyRoleChange = (myRole: 'Client' | 'Provider') => {
      const otherRole = myRole === 'Client' ? 'Provider' : 'Client';
      setFormData(prev => ({
          ...prev,
          partyA: { ...prev.partyA, role: myRole },
          partyB: { ...prev.partyB, role: otherRole }
      }));
  };

  const validateStep = (step: number): boolean => {
    if (step === 1) {
        if (!formData.title || !formData.partyA.id || !formData.partyB.id) return false;
        if (formData.partyA.id === formData.partyB.id) return false;
    }
    if (step === 2 && (formData.value <= 0 || !formData.paymentTerms)) return false;
    if (step === 3 && (!formData.startDate || !formData.endDate || new Date(formData.startDate) >= new Date(formData.endDate))) return false;
    
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

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const contractData: Partial<Contract> = {
        ...formData,
        status: "Draft" as ContractStatus,
        createdBy: "current-user", // This should come from auth context
      };

      const newContract = await createContract(contractData);
      
      toast({
        title: "Success",
        description: "Contract created successfully!",
      });
      
      setOpen(false);
      setCurrentStep(1);
      setFormData(initialFormData(company?.name || 'Your Company'));
      onContractAdded(newContract);
      
    } catch (error) {
      console.error('Error creating contract:', error);
      toast({
        title: "Error",
        description: "Failed to create contract. Please try again.",
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
              <Label htmlFor="title">Contract Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData(p => ({...p, title: e.target.value}))}
                placeholder="e.g., Annual Marketing Retainer"
              />
            </div>
             <div className="space-y-2">
                <Label>Vendor (Party B) *</Label>
                <Select value={formData.partyB.id} onValueChange={handlePartyBSelect}>
                    <SelectTrigger><SelectValue placeholder="Select Vendor" /></SelectTrigger>
                    <SelectContent>
                        {vendors.map(vendor => <SelectItem key={vendor.id} value={vendor.id}>{vendor.name}</SelectItem>)}
                    </SelectContent>
                </Select>
            </div>
             <div className="space-y-2">
                <Label>My Role in this Contract *</Label>
                 <Select value={formData.partyA.role} onValueChange={(role: 'Client' | 'Provider') => handleMyRoleChange(role)}>
                    <SelectTrigger><SelectValue placeholder="Select your role" /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="Client">I am the Client</SelectItem>
                        <SelectItem value="Provider">I am the Provider/Vendor</SelectItem>
                    </SelectContent>
                </Select>
            </div>
            <div>
              <Label htmlFor="type">Contract Type *</Label>
              <Select value={formData.type} onValueChange={(value) => setFormData(p => ({...p, type: value as ContractType}))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select contract type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Service">Service</SelectItem>
                  <SelectItem value="Product">Product</SelectItem>
                  <SelectItem value="Subscription">Subscription</SelectItem>
                  <SelectItem value="One-time">One-time</SelectItem>
                  <SelectItem value="Framework">Framework</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        );
      
      case 2:
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="value">Contract Value *</Label>
              <Input
                id="value"
                type="number"
                value={formData.value}
                onChange={(e) => setFormData(p => ({...p, value: Number(e.target.value)}))}
                placeholder="Enter contract value"
                min="0"
                step="0.01"
              />
            </div>
            <div>
              <Label htmlFor="currency">Currency</Label>
              <Select value={formData.currency} onValueChange={(value) => setFormData(p => ({...p, currency: value}))}>
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
              <Label htmlFor="paymentTerms">Payment Terms</Label>
              <Select value={formData.paymentTerms} onValueChange={(value) => setFormData(p => ({...p, paymentTerms: value}))}>
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
          </div>
        );
      
      case 3:
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="startDate">Start Date *</Label>
              <Input
                id="startDate"
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData(p => ({...p, startDate: e.target.value}))}
              />
            </div>
            <div>
              <Label htmlFor="endDate">End Date *</Label>
              <Input
                id="endDate"
                type="date"
                value={formData.endDate}
                onChange={(e) => setFormData(p => ({...p, endDate: e.target.value}))}
              />
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="autoRenew"
                checked={formData.autoRenew}
                onChange={(e) => setFormData(p => ({...p, autoRenew: e.target.checked}))}
                className="rounded border-gray-300"
              />
              <Label htmlFor="autoRenew">Auto-renew this contract</Label>
            </div>
            {formData.autoRenew && (
              <div>
                <Label htmlFor="renewalPeriod">Renewal Period (months)</Label>
                <Input
                  id="renewalPeriod"
                  type="number"
                  value={formData.renewalPeriod}
                  onChange={(e) => setFormData(p => ({...p, renewalPeriod: Number(e.target.value)}))}
                  min="1"
                  max="60"
                />
              </div>
            )}
            <div>
              <Label htmlFor="termsAndConditions">Terms & Conditions</Label>
              <Textarea
                id="termsAndConditions"
                value={formData.termsAndConditions}
                onChange={(e) => setFormData(p => ({...p, termsAndConditions: e.target.value}))}
                placeholder="Enter terms and conditions"
                rows={4}
              />
            </div>
          </div>
        );
      
      case 4:
        return (
          <div className="space-y-4">
            <div className="bg-muted/50 p-4 rounded-lg">
              <h4 className="font-medium mb-2">Contract Summary</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><span className="font-medium">Title:</span> {formData.title}</div>
                <div><span className="font-medium">Type:</span> {formData.type}</div>
                <div><span className="font-medium">Party A ({formData.partyA.role}):</span> {formData.partyA.name}</div>
                <div><span className="font-medium">Party B ({formData.partyB.role}):</span> {formData.partyB.name}</div>
                <div><span className="font-medium">Value:</span> {formData.currency} {formData.value.toLocaleString()}</div>
                <div><span className="font-medium">Payment Terms:</span> {formData.paymentTerms}</div>
                <div><span className="font-medium">Start Date:</span> {formData.startDate}</div>
                <div><span className="font-medium">End Date:</span> {formData.endDate}</div>
                <div><span className="font-medium">Auto-renew:</span> {formData.autoRenew ? 'Yes' : 'No'}</div>
              </div>
            </div>
            <div className="flex items-center space-x-2 p-3 bg-blue-50 rounded-lg">
              <AlertCircle className="h-5 w-5 text-blue-600" />
              <p className="text-sm text-blue-800">
                This contract will be created with "Draft" status. You can edit it later if needed.
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
          New Contract
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Create New Contract</DialogTitle>
          <DialogDescription>
            Follow the steps to create a new vendor contract
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Progress Steps */}
          <div className="flex items-center justify-between">
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
          <div className="flex justify-between">
            <Button 
              variant="outline" 
              onClick={handlePrevious}
              disabled={currentStep === 1}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Previous
            </Button>
            
            <div className="flex space-x-2">
              {currentStep < onboardingSteps.length ? (
                <Button onClick={handleNext}>
                  Next
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              ) : (
                <Button onClick={handleSubmit} disabled={isSubmitting}>
                  {isSubmitting ? "Creating..." : "Create Contract"}
                </Button>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
