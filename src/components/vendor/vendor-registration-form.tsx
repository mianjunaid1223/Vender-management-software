"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { 
  Building2, 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  FileText, 
  CreditCard, 
  CheckCircle,
  ArrowLeft,
  ArrowRight,
  Shield,
  Loader2
} from 'lucide-react';

interface VendorRegistrationFormProps {
  vendorName: string;
  companyId: string;
  companyName: string;
  email: string;
  inviteId: string;
}

interface FormData {
  contactPerson: string;
  email: string;
  phone: string;
  service: string;
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
}

const STEPS = [
  { id: 1, title: 'Contact Information', icon: User },
  { id: 2, title: 'Business Details', icon: Building2 },
  { id: 3, title: 'Address & Terms', icon: MapPin },
  { id: 4, title: 'Review & Submit', icon: CheckCircle }
];

const PAYMENT_TERMS = [
  'Net 15',
  'Net 30',
  'Net 45',
  'Net 60',
  'Due on Receipt',
  'Custom'
];

const US_STATES = [
  'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
  'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
  'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
  'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
  'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY'
];

export function VendorRegistrationForm({ 
  vendorName, 
  companyId, 
  companyName, 
  email: initialEmail, 
  inviteId 
}: VendorRegistrationFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState<FormData>({
    contactPerson: '',
    email: initialEmail,
    phone: '',
    service: '',
    taxId: '',
    address: {
      street: '',
      city: '',
      state: '',
      zipCode: '',
      country: 'US'
    },
    paymentTerms: 'Net 30',
    notes: ''
  });

  const updateFormData = (field: string, value: any) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...(prev as any)[parent],
          [child]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        return !!(formData.contactPerson && formData.email && formData.phone);
      case 2:
        return !!(formData.service && formData.taxId);
      case 3:
        return !!(formData.address.street && formData.address.city && 
                 formData.address.state && formData.address.zipCode);
      default:
        return true;
    }
  };

  const nextStep = () => {
    if (!validateStep(currentStep)) {
      toast({
        title: 'Incomplete Information',
        description: 'Please fill in all required fields before proceeding.',
        variant: 'destructive'
      });
      return;
    }
    setCurrentStep(prev => Math.min(prev + 1, 4));
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

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/vendor/applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vendorName,
          companyId,
          inviteId,
          ...formData
        })
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: 'Application Submitted!',
          description: 'Your vendor application has been submitted for review. You will receive an email confirmation shortly.'
        });
        setCurrentStep(4);
      } else {
        throw new Error(data.error || 'Failed to submit application');
      }
    } catch (error) {
      console.error('Submission error:', error);
      toast({
        title: 'Submission Failed',
        description: error instanceof Error ? error.message : 'There was an error submitting your application. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Success state
  if (currentStep === 4 && !isSubmitting) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <Card className="text-center">
          <CardContent className="pt-6">
            <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
            <h1 className="text-2xl font-bold mb-2">Application Submitted Successfully!</h1>
            <p className="text-muted-foreground mb-6">
              Thank you for applying to join {companyName} vendor network. 
              Your application is now under review.
            </p>
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg mb-6">
              <h3 className="font-medium mb-2">What happens next?</h3>
              <ul className="text-sm text-left space-y-1">
                <li>• You'll receive an email confirmation within 24 hours</li>
                <li>• Our team will review your application (typically 2-3 business days)</li>
                <li>• Once approved, you'll get access to the vendor dashboard</li>
                <li>• You can then start submitting invoices and accessing contracts</li>
              </ul>
            </div>
            <div className="flex items-center justify-center gap-2">
              <Badge variant="outline" className="text-green-600">
                <CheckCircle className="h-3 w-3 mr-1" />
                Application Complete
              </Badge>
            </div>
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
        <div className="flex items-center justify-center gap-2 mb-4">
          <span className="text-muted-foreground">Applying to join</span>
          <Badge variant="outline" className="text-blue-600">
            <Shield className="h-3 w-3 mr-1" />
            {companyName}
          </Badge>
        </div>
        <p className="text-muted-foreground">
          Vendor: <span className="font-medium">{vendorName}</span>
        </p>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center justify-center gap-4 mb-8">
        {STEPS.map((step, index) => (
          <div key={step.id} className="flex items-center">
            <div className={`
              flex items-center justify-center w-10 h-10 rounded-full text-sm font-medium
              ${currentStep > step.id 
                ? 'bg-green-600 text-white' 
                : currentStep === step.id 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-200 text-gray-600'
              }
            `}>
              {currentStep > step.id ? (
                <CheckCircle className="h-5 w-5" />
              ) : (
                <step.icon className="h-5 w-5" />
              )}
            </div>
            {index < STEPS.length - 1 && (
              <div className={`w-16 h-1 mx-2 ${
                currentStep > step.id ? 'bg-green-600' : 'bg-gray-200'
              }`} />
            )}
          </div>
        ))}
      </div>

      {/* Step Content */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {(() => {
              const CurrentStepIcon = STEPS[currentStep - 1].icon;
              return <CurrentStepIcon className="h-5 w-5" />;
            })()}
            {STEPS[currentStep - 1].title}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Step 1: Contact Information */}
          {currentStep === 1 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="contactPerson">Primary Contact Person *</Label>
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

          {/* Step 2: Business Details */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="service">Services/Products Offered *</Label>
                <Textarea
                  id="service"
                  value={formData.service}
                  onChange={(e) => updateFormData('service', e.target.value)}
                  placeholder="Describe the services or products your company provides..."
                  rows={4}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="taxId">Tax ID/EIN *</Label>
                  <Input
                    id="taxId"
                    value={formData.taxId}
                    onChange={(e) => updateFormData('taxId', e.target.value)}
                    placeholder="12-3456789"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="paymentTerms">Preferred Payment Terms</Label>
                  <Select
                    value={formData.paymentTerms}
                    onValueChange={(value) => updateFormData('paymentTerms', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PAYMENT_TERMS.map((term) => (
                        <SelectItem key={term} value={term}>
                          {term}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Address & Terms */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Business Address</h3>
                <div className="grid grid-cols-1 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="street">Street Address *</Label>
                    <Input
                      id="street"
                      value={formData.address.street}
                      onChange={(e) => updateFormData('address.street', e.target.value)}
                      placeholder="123 Business Ave"
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="city">City *</Label>
                      <Input
                        id="city"
                        value={formData.address.city}
                        onChange={(e) => updateFormData('address.city', e.target.value)}
                        placeholder="New York"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="state">State *</Label>
                      <Select
                        value={formData.address.state}
                        onValueChange={(value) => updateFormData('address.state', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select state" />
                        </SelectTrigger>
                        <SelectContent>
                          {US_STATES.map((state) => (
                            <SelectItem key={state} value={state}>
                              {state}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="zipCode">ZIP Code *</Label>
                      <Input
                        id="zipCode"
                        value={formData.address.zipCode}
                        onChange={(e) => updateFormData('address.zipCode', e.target.value)}
                        placeholder="10001"
                      />
                    </div>
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes">Additional Notes (Optional)</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => updateFormData('notes', e.target.value)}
                  placeholder="Any additional information you'd like to share..."
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
              <ArrowLeft className="h-4 w-4 mr-2" />
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
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Submit Application
                  </>
                )}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default VendorRegistrationForm;
