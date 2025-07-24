
"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Plus, Trash2, Info, Building, MapPin, Globe, Phone, Mail, Sparkles, User as UserIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { registerCompany } from "@/app/actions";

const formSchema = z.object({
  companyName: z.string().min(2, { message: "Company name must be at least 2 characters." }),
  industry: z.string().min(1, { message: "Please select an industry." }),
  businessType: z.string().min(1, { message: "Please select a business type." }),
  taxId: z.string().min(1, { message: "Tax ID is required." }),
  legalId: z.string().min(1, { message: "Legal ID is required." }),
  primaryAddress: z.object({
    street: z.string().min(1, { message: "Street address is required." }),
    city: z.string().min(1, { message: "City is required." }),
    state: z.string().min(1, { message: "State is required." }),
    zipCode: z.string().min(1, { message: "ZIP code is required." }),
    country: z.string().min(1, { message: "Country is required." }),
  }),
  additionalAddresses: z.array(z.object({
    label: z.string().min(1, { message: "Address label is required." }),
    street: z.string().min(1, { message: "Street address is required." }),
    city: z.string().min(1, { message: "City is required." }),
    state: z.string().min(1, { message: "State is required." }),
    zipCode: z.string().min(1, { message: "ZIP code is required." }),
    country: z.string().min(1, { message: "Country is required." }),
  })).optional(),
  websiteUrl: z.string().url({ message: "Please enter a valid URL." }).optional().or(z.literal("")),
  primaryContactEmail: z.string().email({ message: "Please enter a valid email." }),
  primaryContactPhone: z.string().min(1, { message: "Phone number is required." }),
  aiOptIn: z.boolean().default(false),
  userFullName: z.string().min(2, { message: "Full name must be at least 2 characters." }),
  userPassword: z.string().min(6, { message: "Password must be at least 6 characters." }),
});

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
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      companyName: "",
      industry: "",
      businessType: "",
      taxId: "",
      legalId: "",
      primaryAddress: {
        street: "",
        city: "",
        state: "",
        zipCode: "",
        country: "",
      },
      additionalAddresses: [],
      websiteUrl: "",
      primaryContactEmail: "",
      primaryContactPhone: "",
      aiOptIn: false,
      userFullName: "",
      userPassword: "",
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "additionalAddresses",
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    const result = await registerCompany(values);
    
    if (result?.success === false) {
      toast({
        variant: "destructive",
        title: "Registration failed",
        description: result.message,
      });
    }
    setIsLoading(false);
  }

  const addAdditionalAddress = () => {
    append({
      label: "",
      street: "",
      city: "",
      state: "",
      zipCode: "",
      country: "",
    });
  };

  return (
    <TooltipProvider>
      <div className="min-h-screen w-full bg-background dark:bg-background py-16 px-4 flex justify-center items-center">
        <div className="mx-auto max-w-6xl w-full relative group">
          <div className="absolute -inset-1 bg-gradient-to-r from-purple-500 via-blue-500 to-pink-500 rounded-lg blur-3xl opacity-60 group-hover:opacity-85 transition duration-300"></div>
          <Card className="relative z-10 shadow-2xl border-1  bg-background dark:bg-background">
            <CardHeader className="space-y-6 pb-8">
              <div className="text-center space-y-2">
                <CardTitle className="text-4xl font-bold tracking-tight text-foreground">
                  Company Registration
                </CardTitle>
                <CardDescription className="text-xl text-muted-foreground max-w-3xl mx-auto">
                  Create your company profile to get started with our vendor management platform
                </CardDescription>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-8">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-12">
                  
                  {/* Company Information Section */}
                  <div className="space-y-6">
                    <div className="flex items-center gap-3 pb-4 border-b border-border/70">
                      <Building className="h-6 w-6 text-foreground" />
                      <h3 className="text-2xl font-semibold text-foreground">Company Information</h3>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={form.control}
                        name="companyName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm font-medium text-foreground">Company Name</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="Acme Corporation" 
                                className="h-11 border-border/70 focus:border-primary focus:ring-primary bg-background text-foreground placeholder:text-muted-foreground"
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="industry"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm font-medium text-foreground">Industry</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger className="h-11 border-border/70 focus:border-primary focus:ring-primary bg-background text-foreground">
                                  <SelectValue placeholder="Select industry" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {industries.map((industry) => (
                                  <SelectItem key={industry} value={industry}>
                                    {industry}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="businessType"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm font-medium text-foreground">Business Type</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger className="h-11 border-border/70 focus:border-primary focus:ring-primary bg-background text-foreground">
                                  <SelectValue placeholder="Select business type" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {businessTypes.map((type) => (
                                  <SelectItem key={type} value={type}>
                                    {type}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="websiteUrl"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm font-medium text-foreground">Website URL</FormLabel>
                            <div className="relative">
                               <Globe className="absolute left-3 top-3.5 h-4 w-4 text-gray-400" />
                                <Input 
                                  placeholder="https://www.example.com" 
                                  className="h-11 pl-10 border-border/70 focus:border-primary focus:ring-primary bg-background text-foreground placeholder:text-muted-foreground"
                                  {...field} 
                                />
                            </div>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={form.control}
                        name="taxId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm font-medium text-foreground flex items-center gap-2">Tax ID
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <span tabIndex={0}><Info className="h-4 w-4 text-gray-400" /></span>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Your business tax identification number (EIN, SSN, etc.)</p>
                                </TooltipContent>
                              </Tooltip>
                            </FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="XX-XXXXXXX" 
                                className="h-11 border-border/70 focus:border-primary focus:ring-primary bg-background text-foreground placeholder:text-muted-foreground"
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="legalId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm font-medium text-foreground flex items-center gap-2">Legal ID
                              <Tooltip>
                                <TooltipTrigger asChild>
                                   <span tabIndex={0}><Info className="h-4 w-4 text-gray-400" /></span>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Your business registration number or legal entity identifier</p>
                                </TooltipContent>
                              </Tooltip>
                            </FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="Business registration number" 
                                className="h-11 border-border/70 focus:border-primary focus:ring-primary bg-background text-foreground placeholder:text-muted-foreground"
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  <Separator className="bg-border/50" />

                  {/* Primary Address Section */}
                  <div className="space-y-6">
                    <div className="flex items-center gap-3 pb-4 border-b border-border/70">
                      <MapPin className="h-6 w-6 text-foreground" />
                      <h3 className="text-2xl font-semibold text-foreground">Primary Address</h3>
                    </div>
                    
                    <div className="grid grid-cols-1 gap-6">
                      <FormField
                        control={form.control}
                        name="primaryAddress.street"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm font-medium text-foreground">Street Address</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="123 Main Street" 
                                className="h-11 border-border/70 focus:border-primary focus:ring-primary bg-background text-foreground placeholder:text-muted-foreground"
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <FormField
                          control={form.control}
                          name="primaryAddress.city"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-sm font-medium text-foreground">City</FormLabel>
                              <FormControl>
                                <Input 
                                  placeholder="New York" 
                                  className="h-11 border-border/70 focus:border-primary focus:ring-primary bg-background text-foreground placeholder:text-muted-foreground"
                                  {...field} 
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="primaryAddress.state"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-sm font-medium text-foreground">State/Province</FormLabel>
                              <FormControl>
                                <Input 
                                  placeholder="NY" 
                                  className="h-11 border-border/70 focus:border-primary focus:ring-primary bg-background text-foreground placeholder:text-muted-foreground"
                                  {...field} 
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="primaryAddress.zipCode"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-sm font-medium text-foreground">ZIP/Postal Code</FormLabel>
                              <FormControl>
                                <Input 
                                  placeholder="10001" 
                                  className="h-11 border-border/70 focus:border-primary focus:ring-primary bg-background text-foreground placeholder:text-muted-foreground"
                                  {...field} 
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      <FormField
                        control={form.control}
                        name="primaryAddress.country"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm font-medium text-foreground">Country</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger className="h-11 border-border/70 focus:border-primary focus:ring-primary bg-background text-foreground">
                                  <SelectValue placeholder="Select country" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {countries.map((country) => (
                                  <SelectItem key={country} value={country}>
                                    {country}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  {/* Additional Addresses Section */}
                  <div className="space-y-6">
                    <div className="flex items-center justify-between pb-4 border-b border-border/70">
                      <h3 className="text-lg font-semibold text-foreground">Additional Addresses</h3>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={addAdditionalAddress}
                        className="h-9 border-border/70 hover:bg-muted"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Address
                      </Button>
                    </div>
                    
                    {fields.map((field, index) => (
                      <Card key={field.id} className="p-6 border border-border/70 bg-background/50">
                        <div className="flex items-center justify-between mb-4">
                          <h4 className="text-md font-medium ">Additional Address {index + 1}</h4>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => remove(index)}
                            className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                        
                        <div className="grid grid-cols-1 gap-4">
                          <FormField
                            control={form.control}
                            name={`additionalAddresses.${index}.label`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-sm font-medium text-foreground">Address Label</FormLabel>
                                <FormControl>
                                  <Input 
                                    placeholder="e.g., Warehouse, Branch Office" 
                                    className="h-11 border-border/70 focus:border-primary focus:ring-primary bg-background text-foreground placeholder:text-muted-foreground"
                                    {...field} 
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={form.control}
                            name={`additionalAddresses.${index}.street`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-sm font-medium text-foreground">Street Address</FormLabel>
                                <FormControl>
                                  <Input 
                                    placeholder="456 Oak Avenue" 
                                    className="h-11 border-border/70 focus:border-primary focus:ring-primary bg-background text-foreground placeholder:text-muted-foreground"
                                    {...field} 
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <FormField
                              control={form.control}
                              name={`additionalAddresses.${index}.city`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="text-sm font-medium text-foreground">City</FormLabel>
                                  <FormControl>
                                    <Input 
                                      placeholder="Chicago" 
                                      className="h-11 border-border/70 focus:border-primary focus:ring-primary bg-background text-foreground placeholder:text-muted-foreground"
                                      {...field} 
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            
                            <FormField
                              control={form.control}
                              name={`additionalAddresses.${index}.state`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="text-sm font-medium text-foreground">State/Province</FormLabel>
                                  <FormControl>
                                    <Input 
                                      placeholder="IL" 
                                      className="h-11 border-border/70 focus:border-primary focus:ring-primary bg-background text-foreground placeholder:text-muted-foreground"
                                      {...field} 
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            
                            <FormField
                              control={form.control}
                              name={`additionalAddresses.${index}.zipCode`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="text-sm font-medium text-foreground">ZIP/Postal Code</FormLabel>
                                  <FormControl>
                                    <Input 
                                      placeholder="60601" 
                                      className="h-11 border-border/70 focus:border-primary focus:ring-primary bg-background text-foreground placeholder:text-muted-foreground"
                                      {...field} 
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                          
                          <FormField
                            control={form.control}
                            name={`additionalAddresses.${index}.country`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-sm font-medium text-foreground">Country</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                  <FormControl>
                                    <SelectTrigger className="h-11 border-border/70 focus:border-primary focus:ring-primary bg-background text-foreground">
                                      <SelectValue placeholder="Select country" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    {countries.map((country) => (
                                      <SelectItem key={country} value={country}>
                                        {country}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </Card>
                    ))}
                  </div>

                  <Separator className="bg-border/50" />

                  {/* Administrator Account Section */}
                  <div className="space-y-6">
                    <div className="flex items-center gap-3 pb-4 border-b border-border/70">
                      <UserIcon className="h-6 w-6 text-foreground" />
                      <h3 className="text-2xl font-semibold text-foreground">Administrator Account</h3>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={form.control}
                        name="userFullName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm font-medium text-foreground">Full Name</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="John Doe" 
                                className="h-11 border-border/70 focus:border-primary focus:ring-primary bg-background text-foreground placeholder:text-muted-foreground"
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                       <FormField
                        control={form.control}
                        name="primaryContactEmail"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm font-medium text-foreground">Email (for Login)</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Mail className="absolute left-3 top-3.5 h-4 w-4 text-gray-400" />
                                <Input 
                                  type="email" 
                                  placeholder="contact@company.com" 
                                  className="h-11 pl-10 border-border/70 focus:border-primary focus:ring-primary bg-background text-foreground placeholder:text-muted-foreground"
                                  {...field} 
                                />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="userPassword"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm font-medium text-foreground">Password</FormLabel>
                            <FormControl>
                              <Input 
                                type="password" 
                                placeholder="Create a secure password"
                                className="h-11 border-border/70 focus:border-primary focus:ring-primary bg-background text-foreground placeholder:text-muted-foreground"
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                       <FormField
                        control={form.control}
                        name="primaryContactPhone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm font-medium text-foreground">Contact Phone</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Phone className="absolute left-3 top-3.5 h-4 w-4 text-gray-400" />
                                <Input 
                                  placeholder="+1 (555) 123-4567" 
                                  className="h-11 pl-10 border-border/70 focus:border-primary focus:ring-primary bg-background text-foreground placeholder:text-muted-foreground"
                                  {...field} 
                                />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  <Separator className="bg-border/50" />
                  
                  {/* Submit Button */}
                  <div className="pt-6">
                    <Button 
                      type="submit" 
                      className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-lg transition-all duration-300 transform hover:scale-105" 
                      disabled={isLoading}
                    >
                      {isLoading && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
                      Complete Registration
                    </Button>
                  </div>
                </form>
              </Form>
              
              <div className="mt-8 pt-6 border-t border-border/50 text-center text-sm text-muted-foreground">
                Already have an account?{" "}
                <Link href="/login" className="font-medium text-primary hover:underline transition-colors duration-200">
                  Sign in here
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </TooltipProvider>
  );
}

    