"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { PlusCircle, CheckCircle, Clock, AlertCircle, FileText, Building2, Users, Shield } from "lucide-react";

export function VendorOnboardingDialog() {
  const [open, setOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    // Basic Information
    name: '',
    email: '',
    phone: '',
    service: '',
    website: '',
    primaryContact: '',
    
    // Business Details
    address: '',
    taxId: '',
    businessType: '',
    yearsInBusiness: '',
    
    // Banking Information
    bankDetails: {
      accountNumber: '',
      routingNumber: '',
      bankName: '',
    },
    
    // Compliance Requirements
    complianceDocuments: [] as string[],
    certifications: [] as string[],
    
    // Contract Terms
    paymentTerms: '',
    contractValue: '',
    serviceLevel: '',
    
    // Risk Assessment
    riskLevel: 'Medium' as 'Low' | 'Medium' | 'High',
    riskFactors: [] as string[],
  });

  const onboardingSteps = [
    {
      title: 'Basic Information',
      description: 'Essential vendor details',
      icon: <Building2 className="h-5 w-5" />,
      status: 'current' as 'completed' | 'current' | 'upcoming',
    },
    {
      title: 'Business Details',
      description: 'Company information and credentials',
      icon: <Users className="h-5 w-5" />,
      status: 'upcoming' as 'completed' | 'current' | 'upcoming',
    },
    {
      title: 'Compliance & Documentation',
      description: 'Required certifications and documents',
      icon: <Shield className="h-5 w-5" />,
      status: 'upcoming' as 'completed' | 'current' | 'upcoming',
    },
    {
      title: 'Risk Assessment',
      description: 'Evaluate vendor risk profile',
      icon: <AlertCircle className="h-5 w-5" />,
      status: 'upcoming' as 'completed' | 'current' | 'upcoming',
    },
  ];

  const handleNext = () => {
    if (currentStep < onboardingSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    
    try {
      // Here you would typically call your API to create the vendor
      console.log('Creating vendor with data:', formData);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast({
        title: "Vendor onboarding initiated",
        description: "The vendor has been added and onboarding process started.",
      });
      
      setOpen(false);
      setCurrentStep(0);
      setFormData({
        name: '',
        email: '',
        phone: '',
        service: '',
        website: '',
        primaryContact: '',
        address: '',
        taxId: '',
        businessType: '',
        yearsInBusiness: '',
        bankDetails: {
          accountNumber: '',
          routingNumber: '',
          bankName: '',
        },
        complianceDocuments: [],
        certifications: [],
        paymentTerms: '',
        contractValue: '',
        serviceLevel: '',
        riskLevel: 'Medium',
        riskFactors: [],
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to create vendor. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Company Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter company name"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="service">Service Category *</Label>
                <Select value={formData.service} onValueChange={(value) => setFormData(prev => ({ ...prev, service: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="IT Services">IT Services</SelectItem>
                    <SelectItem value="Consulting">Consulting</SelectItem>
                    <SelectItem value="Marketing">Marketing</SelectItem>
                    <SelectItem value="Legal">Legal</SelectItem>
                    <SelectItem value="Finance">Finance</SelectItem>
                    <SelectItem value="Manufacturing">Manufacturing</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="vendor@company.com"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="+1 (555) 123-4567"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="website">Website</Label>
                <Input
                  id="website"
                  value={formData.website}
                  onChange={(e) => setFormData(prev => ({ ...prev, website: e.target.value }))}
                  placeholder="https://vendor.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="primaryContact">Primary Contact</Label>
                <Input
                  id="primaryContact"
                  value={formData.primaryContact}
                  onChange={(e) => setFormData(prev => ({ ...prev, primaryContact: e.target.value }))}
                  placeholder="John Doe"
                />
              </div>
            </div>
          </div>
        );
        
      case 1:
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="address">Business Address</Label>
              <Textarea
                id="address"
                value={formData.address}
                onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                placeholder="Enter full business address"
                rows={3}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="taxId">Tax ID / EIN</Label>
                <Input
                  id="taxId"
                  value={formData.taxId}
                  onChange={(e) => setFormData(prev => ({ ...prev, taxId: e.target.value }))}
                  placeholder="XX-XXXXXXX"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="businessType">Business Type</Label>
                <Select value={formData.businessType} onValueChange={(value) => setFormData(prev => ({ ...prev, businessType: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Corporation">Corporation</SelectItem>
                    <SelectItem value="LLC">LLC</SelectItem>
                    <SelectItem value="Partnership">Partnership</SelectItem>
                    <SelectItem value="Sole Proprietorship">Sole Proprietorship</SelectItem>
                    <SelectItem value="Non-profit">Non-profit</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="yearsInBusiness">Years in Business</Label>
              <Input
                id="yearsInBusiness"
                type="number"
                value={formData.yearsInBusiness}
                onChange={(e) => setFormData(prev => ({ ...prev, yearsInBusiness: e.target.value }))}
                placeholder="5"
              />
            </div>
            
            <Separator />
            
            <div className="space-y-4">
              <h4 className="font-semibold">Banking Information</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="bankName">Bank Name</Label>
                  <Input
                    id="bankName"
                    value={formData.bankDetails.bankName}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      bankDetails: { ...prev.bankDetails, bankName: e.target.value }
                    }))}
                    placeholder="Bank of America"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="routingNumber">Routing Number</Label>
                  <Input
                    id="routingNumber"
                    value={formData.bankDetails.routingNumber}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      bankDetails: { ...prev.bankDetails, routingNumber: e.target.value }
                    }))}
                    placeholder="123456789"
                  />
                </div>
              </div>
            </div>
          </div>
        );
        
      case 2:
        return (
          <div className="space-y-4">
            <div className="space-y-3">
              <h4 className="font-semibold">Required Compliance Documents</h4>
              <div className="space-y-2">
                {[
                  'Business License',
                  'Insurance Certificate',
                  'W-9 Form',
                  'Safety Certification',
                  'Quality Certification',
                  'Environmental Compliance',
                ].map((doc) => (
                  <div key={doc} className="flex items-center space-x-2">
                    <Checkbox
                      id={doc}
                      checked={formData.complianceDocuments.includes(doc)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setFormData(prev => ({
                            ...prev,
                            complianceDocuments: [...prev.complianceDocuments, doc]
                          }));
                        } else {
                          setFormData(prev => ({
                            ...prev,
                            complianceDocuments: prev.complianceDocuments.filter(d => d !== doc)
                          }));
                        }
                      }}
                    />
                    <Label htmlFor={doc}>{doc}</Label>
                  </div>
                ))}
              </div>
            </div>
            
            <Separator />
            
            <div className="space-y-3">
              <h4 className="font-semibold">Industry Certifications</h4>
              <div className="space-y-2">
                {[
                  'ISO 9001',
                  'ISO 27001',
                  'SOC 2',
                  'GDPR Compliance',
                  'HIPAA Compliance',
                  'Industry-specific certifications',
                ].map((cert) => (
                  <div key={cert} className="flex items-center space-x-2">
                    <Checkbox
                      id={cert}
                      checked={formData.certifications.includes(cert)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setFormData(prev => ({
                            ...prev,
                            certifications: [...prev.certifications, cert]
                          }));
                        } else {
                          setFormData(prev => ({
                            ...prev,
                            certifications: prev.certifications.filter(c => c !== cert)
                          }));
                        }
                      }}
                    />
                    <Label htmlFor={cert}>{cert}</Label>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
        
      case 3:
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="riskLevel">Risk Level Assessment</Label>
              <Select 
                value={formData.riskLevel} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, riskLevel: value as 'Low' | 'Medium' | 'High' }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Low">Low Risk</SelectItem>
                  <SelectItem value="Medium">Medium Risk</SelectItem>
                  <SelectItem value="High">High Risk</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-3">
              <h4 className="font-semibold">Risk Factors</h4>
              <div className="space-y-2">
                {[
                  'New vendor relationship',
                  'Critical service provider',
                  'High contract value',
                  'Regulatory compliance required',
                  'Limited financial information',
                  'International operations',
                  'Single source dependency',
                ].map((factor) => (
                  <div key={factor} className="flex items-center space-x-2">
                    <Checkbox
                      id={factor}
                      checked={formData.riskFactors.includes(factor)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setFormData(prev => ({
                            ...prev,
                            riskFactors: [...prev.riskFactors, factor]
                          }));
                        } else {
                          setFormData(prev => ({
                            ...prev,
                            riskFactors: prev.riskFactors.filter(f => f !== factor)
                          }));
                        }
                      }}
                    />
                    <Label htmlFor={factor}>{factor}</Label>
                  </div>
                ))}
              </div>
            </div>
            
            <Separator />
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="paymentTerms">Payment Terms</Label>
                <Select value={formData.paymentTerms} onValueChange={(value) => setFormData(prev => ({ ...prev, paymentTerms: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select terms" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Net 15">Net 15</SelectItem>
                    <SelectItem value="Net 30">Net 30</SelectItem>
                    <SelectItem value="Net 60">Net 60</SelectItem>
                    <SelectItem value="Net 90">Net 90</SelectItem>
                    <SelectItem value="Due on Receipt">Due on Receipt</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="contractValue">Estimated Annual Contract Value</Label>
                <Input
                  id="contractValue"
                  type="number"
                  value={formData.contractValue}
                  onChange={(e) => setFormData(prev => ({ ...prev, contractValue: e.target.value }))}
                  placeholder="50000"
                />
              </div>
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
          <PlusCircle className="mr-2 h-4 w-4" />
          Add Vendor
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Vendor Onboarding</DialogTitle>
          <DialogDescription>
            Complete the vendor onboarding process to ensure compliance and risk management.
          </DialogDescription>
        </DialogHeader>
        
        {/* Progress Steps */}
        <div className="flex justify-between mb-6">
          {onboardingSteps.map((step, index) => (
            <div key={index} className="flex flex-col items-center space-y-2">
              <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                index === currentStep 
                  ? 'border-blue-500 bg-blue-50 text-blue-600' 
                  : index < currentStep 
                    ? 'border-green-500 bg-green-50 text-green-600'
                    : 'border-gray-300 bg-gray-50 text-gray-400'
              }`}>
                {index < currentStep ? (
                  <CheckCircle className="h-5 w-5" />
                ) : (
                  step.icon
                )}
              </div>
              <div className="text-center">
                <div className="text-sm font-medium">{step.title}</div>
                <div className="text-xs text-muted-foreground">{step.description}</div>
              </div>
            </div>
          ))}
        </div>
        
        {/* Step Content */}
        <div className="min-h-[400px]">
          {renderStepContent()}
        </div>
        
        {/* Navigation Buttons */}
        <div className="flex justify-between pt-6">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={currentStep === 0}
          >
            Previous
          </Button>
          
          <div className="flex gap-2">
            {currentStep === onboardingSteps.length - 1 ? (
              <Button onClick={handleSubmit} disabled={isLoading}>
                {isLoading ? "Creating..." : "Complete Onboarding"}
              </Button>
            ) : (
              <Button onClick={handleNext}>
                Next
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
