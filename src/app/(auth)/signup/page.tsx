
"use client";

import Link from "next/link";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Loader2, Building, MapPin, User as UserIcon } from "lucide-react";

import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Input } from "@/shared/components/ui/input";
import { Datalist } from "@/shared/components/ui/datalist";
import { Separator } from "@/shared/components/ui/separator";
import { Textarea } from "@/shared/components/ui/textarea";
import { registerCompany } from "@/app/actions";
import { Label } from "@/shared/components/ui/label";



function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button 
      type="submit" 
      className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-lg" 
      aria-disabled={pending}
    >
      {pending && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
      Complete Registration
    </Button>
  );
}

const industries = [
  "Technology", "Healthcare", "Finance", "Manufacturing", "Retail", "Education", 
  "Real Estate", "Construction", "Transportation", "Food & Beverage", "Energy", 
  "Media & Entertainment", "Professional Services", "Non-profit", "Other"
];

const businessTypes = [
  "Corporation", "LLC", "Partnership", "Sole Proprietorship", "S-Corp", "Non-profit"
];

const countries = [
  "United States", "Canada", "United Kingdom", "Australia", "Germany", "France", 
  "India", "Japan", "Brazil", "Mexico", "Other"
];

export default function CompanyRegistrationPage() {
  const [state, formAction] = useActionState(registerCompany, { message: "", errors: {} });

  return (
    <div className="min-h-screen w-full bg-background py-16 px-4 flex justify-center items-center">
      <div className="mx-auto max-w-4xl w-full relative group">
        <div className="absolute -inset-1 bg-gradient-to-r from-purple-500 via-blue-500 to-pink-500 rounded-lg blur-2xl opacity-40 group-hover:opacity-60 transition duration-300"></div>
        <Card className="relative z-10 shadow-xl border-1 bg-background">
          <CardHeader className="text-center space-y-2 pb-8">
            <CardTitle className="text-4xl font-bold tracking-tight text-foreground">
              Company Registration
            </CardTitle>
            <CardDescription className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Create your company profile to get started with VendorVerse.
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-8">
            <form action={formAction} className="space-y-12">
              
              {/* Company Information Section */}
              <div className="space-y-6">
                <div className="flex items-center gap-3 pb-4 border-b">
                  <Building className="h-6 w-6 text-foreground" />
                  <h3 className="text-2xl font-semibold text-foreground">Company Information</h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="companyName">Company Name</Label>
                    <Input id="companyName" name="companyName" placeholder="Acme Corporation" required />
                  </div>
                  <div>
                    <Label htmlFor="industry">Industry</Label>
                    <Datalist 
                      id="industry" 
                      name="industry" 
                      options={industries} 
                      placeholder="Select or type industry" 
                      required 
                    />
                  </div>
                  <div>
                    <Label htmlFor="businessType">Business Type</Label>
                    <Datalist 
                      id="businessType" 
                      name="businessType" 
                      options={businessTypes} 
                      placeholder="Select or type business type" 
                      required 
                    />
                  </div>
                  <div>
                    <Label htmlFor="websiteUrl">Website URL</Label>
                    <Input id="websiteUrl" name="websiteUrl" placeholder="https://www.example.com" />
                  </div>
                  <div>
                    <Label htmlFor="taxId">Tax ID (Optional)</Label>
                    <Input id="taxId" name="taxId" placeholder="XX-XXXXXXX" />
                  </div>
                  <div>
                    <Label htmlFor="legalId">Legal ID (Optional)</Label>
                    <Input id="legalId" name="legalId" placeholder="Business registration number" />
                  </div>
                </div>
                
                {/* Business Description - Full Width */}
                <div className="space-y-2">
                  <Label htmlFor="businessDescription">Business Description</Label>
                  <Textarea 
                    id="businessDescription" 
                    name="businessDescription" 
                    placeholder="Describe your business, products, or services..."
                    className="min-h-[100px] resize-none"
                    required
                  />
                  <p className="text-sm text-muted-foreground">
                    This helps <b className="" style={{ backgroundSize: '200% 200%', color: 'transparent', background: 'linear-gradient(to top right, #3b82f6,rgb(255, 0, 251))', WebkitBackgroundClip: 'text', backgroundClip: 'text'}}>AI</b> get better context of your business for personalized recommendations.
                  </p>
                </div>
              </div>

              <Separator />

              {/* Primary Address Section */}
              <div className="space-y-6">
                <div className="flex items-center gap-3 pb-4 border-b">
                  <MapPin className="h-6 w-6 text-foreground" />
                  <h3 className="text-2xl font-semibold text-foreground">Primary Address</h3>
                </div>
                
                <div>
                  <Label htmlFor="primaryAddress.street">Street Address</Label>
                  <Input id="primaryAddress.street" name="primaryAddress.street" placeholder="123 Main Street" required />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <Label htmlFor="primaryAddress.city">City</Label>
                    <Input id="primaryAddress.city" name="primaryAddress.city" placeholder="New York" required />
                  </div>
                  <div>
                    <Label htmlFor="primaryAddress.state">State/Province</Label>
                    <Input id="primaryAddress.state" name="primaryAddress.state" placeholder="NY" required />
                  </div>
                  <div>
                    <Label htmlFor="primaryAddress.zipCode">ZIP/Postal Code</Label>
                    <Input id="primaryAddress.zipCode" name="primaryAddress.zipCode" placeholder="10001" required />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="primaryAddress.country">Country</Label>
                  <Datalist 
                    id="primaryAddress.country" 
                    name="primaryAddress.country" 
                    options={countries} 
                    placeholder="Select or type country" 
                    required 
                  />
                </div>
              </div>

              <Separator />

              {/* Administrator Account Section */}
              <div className="space-y-6">
                <div className="flex items-center gap-3 pb-4 border-b">
                  <UserIcon className="h-6 w-6 text-foreground" />
                  <h3 className="text-2xl font-semibold text-foreground">Administrator Account</h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="userFullName">Full Name</Label>
                    <Input id="userFullName" name="userFullName" placeholder="John Doe" required />
                  </div>
                   <div>
                    <Label htmlFor="primaryContactEmail">Email (for Login)</Label>
                    <Input id="primaryContactEmail" name="primaryContactEmail" type="email" placeholder="admin@company.com" required />
                  </div>
                  <div>
                    <Label htmlFor="userPassword">Password</Label>
                    <Input id="userPassword" name="userPassword" type="password" placeholder="Create a secure password" required />
                  </div>
                </div>
              </div>
              
              {state?.message && <p className="text-sm font-medium text-destructive">{state.message}</p>}

              <div className="pt-6">
                <SubmitButton />
              </div>
            </form>
            
            <div className="mt-8 pt-6 border-t text-center text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link href="/login" className="font-medium text-primary hover:underline">
                Sign in here
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
