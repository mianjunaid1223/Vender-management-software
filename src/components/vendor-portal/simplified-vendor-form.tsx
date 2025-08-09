'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Building2, 
  CheckCircle, 
  Clock,
  ArrowRight,
  Shield,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface VendorFormData {
  name: string;           // Company name
  email: string;
  phone: string;
  service: string;        // Main service offered
  contactPerson: string;  // Contact person name
  taxId: string;
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  paymentTerms: string;
  notes: string;
  targetCompanyId: string;
}

const STEP_TITLES = [
  'Basic Information',
  'Address & Contact',
  'Service Details'
];

export function SimplifiedVendorForm() {
  const searchParams = useSearchParams();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [companyInfo, setCompanyInfo] = useState<{ name: string; id: string } | null>(null);
  const [tokenError, setTokenError] = useState<string | null>(null);
  const [isValidating, setIsValidating] = useState(true);
  const { toast } = useToast();

  const [formData, setFormData] = useState<VendorFormData>({
    name: '',
    email: '',
    phone: '',
    service: '',
    contactPerson: '',
    taxId: '',
    address: {
      street: '',
      city: '',
      state: '',
      zipCode: '',
      country: 'US'
    },
    paymentTerms: 'Net 30',
    notes: '',
    targetCompanyId: ''
  });

  useEffect(() => {
    const validateToken = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const token = urlParams.get('token');
      const companyId = urlParams.get('companyId');
      
      if (token) {
        try {
          const response = await fetch(`/api/vendor/status?token=${encodeURIComponent(token)}`);
          const data = await response.json();
          
          if (response.ok && data.status === 'pending_registration') {
            setCompanyInfo({
              id: data.companyId,
              name: data.companyName
            });
            setFormData(prev => ({ ...prev, targetCompanyId: data.companyId }));
          } else {
            setTokenError(data.error || 'Invalid or expired invite link');
          }
        } catch (error) {
          setTokenError('Failed to validate invite link');
        }
      } else if (companyId) {
        setCompanyInfo({
          id: companyId,
          name: 'Demo Company'
        });
        setFormData(prev => ({ ...prev, targetCompanyId: companyId }));
      } else {
        setTokenError('No valid invite token found');
      }
      
      setIsValidating(false);
    };
    
    validateToken();
  }, []);

  const updateFormData = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const updateNestedFormData = (parent: string, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [parent]: {
        ...(prev[parent as keyof VendorFormData] as Record<string, any>),
        [field]: value
      }
    }));
  };

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        return !!(formData.name && formData.contactPerson && formData.email && formData.phone);
      case 2:
        return !!(formData.address.street && formData.address.city);
      case 3:
        return !!(formData.service && formData.taxId);
      default:
        return false;
    }
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, 3));
    } else {
      toast({
        title: 'Incomplete Information',
        description: 'Please fill in all required fields before proceeding.',
        variant: 'destructive'
      });
    }
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const submitApplication = async () => {
    if (!validateStep(3)) {
      toast({
        title: 'Incomplete Application',
        description: 'Please complete all required fields.',
        variant: 'destructive'
      });
      return;
    }

    const finalFormData = {
      ...formData,
      targetCompanyId: formData.targetCompanyId || companyInfo?.id || ''
    };
    
    if (!finalFormData.targetCompanyId) {
      toast({
        title: 'Invalid Session',
        description: 'Company information is missing. Please use a valid invite link.',
        variant: 'destructive'
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/vendor-applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(finalFormData)
      });

      if (response.ok) {
        toast({
          title: 'Application Submitted!',
          description: 'Your vendor application has been submitted for review. You will receive an email confirmation shortly.'
        });
        setCurrentStep(4); // Success step
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to submit application');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'There was an error submitting your application. Please try again.';
      toast({
        title: 'Submission Failed',
        description: errorMessage,
        variant: 'destructive'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Loading state
  if (isValidating) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <Card className="text-center">
          <CardContent className="pt-6">
            <Loader2 className="h-16 w-16 text-blue-600 mx-auto mb-4 animate-spin" />
            <h1 className="text-xl font-medium mb-2">Validating Invite...</h1>
            <p className="text-muted-foreground">
              Please wait while we verify your invitation link.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Error state
  if (tokenError) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <Card className="text-center border-red-200">
          <CardContent className="pt-6">
            <AlertCircle className="h-16 w-16 text-red-600 mx-auto mb-4" />
            <h1 className="text-xl font-bold mb-2 text-red-600">Invalid Invitation</h1>
            <p className="text-muted-foreground mb-6">{tokenError}</p>
            <p className="text-sm text-muted-foreground">
              Please contact the company administrator for a new invitation link.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Success state
  if (currentStep === 4) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <Card className="text-center">
          <CardContent className="pt-6">
            <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
            <h1 className="text-2xl font-bold mb-2">Application Submitted Successfully!</h1>
            <p className="text-muted-foreground mb-6">
              Thank you for applying to join {companyInfo?.name || 'our'} vendor network. 
              Your application is now under review.
            </p>
            <div className="bg-blue-50 p-4 rounded-lg mb-6">
              <h3 className="font-medium mb-2">What happens next?</h3>
              <ul className="text-sm text-left space-y-1">
                <li>• You'll receive an email confirmation within 24 hours</li>
                <li>• Our team will review your application (typically 2-3 business days)</li>
                <li>• Once approved, you'll get access to the vendor dashboard</li>
                <li>• You can then start submitting invoices and accessing contracts</li>
              </ul>
            </div>
            <Badge variant="outline" className="text-green-600">
              <Clock className="h-3 w-3 mr-1" />
              Application ID: {Date.now().toString(36).toUpperCase()}
            </Badge>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="flex items-center justify-center gap-2 mb-4">
          <Building2 className="h-8 w-8 text-blue-600" />
          <h1 className="text-3xl font-bold">Vendor Registration</h1>
        </div>
        {companyInfo && (
          <div className="flex items-center justify-center gap-2 mb-4">
            <span className="text-muted-foreground">Applying to join</span>
            <Badge variant="outline" className="text-blue-600">
              <Shield className="h-3 w-3 mr-1" />
              {companyInfo.name}
            </Badge>
          </div>
        )}
        
        {/* Progress Steps */}
        <div className="flex items-center justify-center gap-4 mb-6">
          {STEP_TITLES.map((title, index) => (
            <div key={index} className="flex items-center">
              <div className={`
                flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium
                ${currentStep > index + 1 
                  ? 'bg-green-600 text-white' 
                  : currentStep === index + 1 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-200 text-gray-600'
                }
              `}>
                {currentStep > index + 1 ? <CheckCircle className="h-4 w-4" /> : index + 1}
              </div>
              {index < STEP_TITLES.length - 1 && (
                <ArrowRight className="h-4 w-4 mx-2 text-gray-400" />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Form Content */}
      <Card>
        <CardHeader>
          <CardTitle>Step {currentStep}: {STEP_TITLES[currentStep - 1]}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Step 1: Basic Information */}
          {currentStep === 1 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Company Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => updateFormData('name', e.target.value)}
                  placeholder="Your Company LLC"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contactPerson">Primary Contact Name *</Label>
                <Input
                  id="contactPerson"
                  value={formData.contactPerson}
                  onChange={(e) => updateFormData('contactPerson', e.target.value)}
                  placeholder="John Smith"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email Address *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => updateFormData('email', e.target.value)}
                  placeholder="john@company.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number *</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => updateFormData('phone', e.target.value)}
                  placeholder="+1 (555) 123-4567"
                />
              </div>
            </div>
          )}

          {/* Step 2: Address & Contact */}
          {currentStep === 2 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="street">Street Address *</Label>
                <Input
                  id="street"
                  value={formData.address.street}
                  onChange={(e) => updateNestedFormData('address', 'street', e.target.value)}
                  placeholder="123 Business St"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="city">City *</Label>
                  <Input
                    id="city"
                    value={formData.address.city}
                    onChange={(e) => updateNestedFormData('address', 'city', e.target.value)}
                    placeholder="New York"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="state">State</Label>
                  <Input
                    id="state"
                    value={formData.address.state}
                    onChange={(e) => updateNestedFormData('address', 'state', e.target.value)}
                    placeholder="NY"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="zipCode">ZIP Code</Label>
                  <Input
                    id="zipCode"
                    value={formData.address.zipCode}
                    onChange={(e) => updateNestedFormData('address', 'zipCode', e.target.value)}
                    placeholder="10001"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="country">Country</Label>
                  <Select value={formData.address.country} onValueChange={(value) => updateNestedFormData('address', 'country', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="US">United States</SelectItem>
                      <SelectItem value="CA">Canada</SelectItem>
                      <SelectItem value="UK">United Kingdom</SelectItem>
                      <SelectItem value="AU">Australia</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Service Details */}
          {currentStep === 3 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="service">Main Service Offered *</Label>
                <Input
                  id="service"
                  value={formData.service}
                  onChange={(e) => updateFormData('service', e.target.value)}
                  placeholder="Web Development, Consulting, etc."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="taxId">Tax ID *</Label>
                <Input
                  id="taxId"
                  value={formData.taxId}
                  onChange={(e) => updateFormData('taxId', e.target.value)}
                  placeholder="12-3456789"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="paymentTerms">Payment Terms</Label>
                <Select value={formData.paymentTerms} onValueChange={(value) => updateFormData('paymentTerms', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Net 15">Net 15</SelectItem>
                    <SelectItem value="Net 30">Net 30</SelectItem>
                    <SelectItem value="Net 45">Net 45</SelectItem>
                    <SelectItem value="Net 60">Net 60</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes">Additional Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => updateFormData('notes', e.target.value)}
                  placeholder="Any additional information about your services..."
                  rows={3}
                />
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between pt-6 border-t">
            <Button 
              variant="outline" 
              onClick={prevStep} 
              disabled={currentStep === 1}
            >
              Previous
            </Button>
            
            {currentStep < 3 ? (
              <Button onClick={nextStep}>
                Next
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            ) : (
              <Button 
                onClick={submitApplication} 
                disabled={isSubmitting}
                className="bg-green-600 hover:bg-green-700"
              >
                {isSubmitting ? 'Submitting...' : 'Submit Application'}
                <CheckCircle className="h-4 w-4 ml-2" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
