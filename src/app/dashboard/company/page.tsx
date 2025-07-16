import { Suspense } from "react";
import { PageHeader } from "@/components/page-header";
import { CompanyRegistrationForm } from "@/components/dashboard/company-registration-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Building, MapPin, Phone, Mail, Globe, Users } from "lucide-react";
import { fetchCompany } from "@/lib/data";
import { Skeleton } from "@/components/ui/skeleton";

export default async function CompanyPage() {
  return (
    <div className="space-y-6">
      <PageHeader 
        title="Company Profile" 
        description="Manage your company information and business details"
      />

      <Suspense fallback={<CompanyPageSkeleton />}>
        <CompanyContent />
      </Suspense>
    </div>
  );
}

async function CompanyContent() {
  const company = await fetchCompany();

  if (!company) {
    return (
      <div className="grid gap-6">
        <Card className="border-dashed border-2">
          <CardHeader className="text-center">
            <Building className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <CardTitle>Set Up Your Company Profile</CardTitle>
            <CardDescription>
              Complete your company registration to get started with vendor management
            </CardDescription>
          </CardHeader>
          <CardContent>
            <CompanyRegistrationForm />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="grid gap-6">
      {/* Company Overview */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Building className="h-5 w-5" />
                {company.name}
              </CardTitle>
              <CardDescription>
                {company.businessType} • {company.industry}
              </CardDescription>
            </div>
            <CompanyRegistrationForm isEditing company={company} />
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">Business Information</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <Building className="h-4 w-4 text-muted-foreground" />
                    <span>{company.businessType}</span>
                  </div>
                  {company.industry && (
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span>{company.industry}</span>
                    </div>
                  )}
                  {company.taxId && (
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">Tax ID:</span>
                      <span>{company.taxId}</span>
                    </div>
                  )}
                  {company.legalId && (
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">Legal ID:</span>
                      <span>{company.legalId}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Primary Contact */}
              {company.primaryContact && (
                <div>
                  <h4 className="font-medium mb-2">Primary Contact</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span>{company.primaryContact.name}</span>
                      {company.primaryContact.role && (
                        <Badge variant="outline" className="text-xs">
                          {company.primaryContact.role}
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span>{company.primaryContact.email}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span>{company.primaryContact.phone}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Address Information */}
            <div className="space-y-4">
              {company.primaryAddress && (
                <div>
                  <h4 className="font-medium mb-2">Primary Address</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-start gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground mt-1" />
                      <div>
                        <div>{company.primaryAddress.street}</div>
                        <div>
                          {company.primaryAddress.city}, {company.primaryAddress.state} {company.primaryAddress.zipCode}
                        </div>
                        <div>{company.primaryAddress.country}</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {company.website && (
                <div>
                  <h4 className="font-medium mb-2">Website</h4>
                  <div className="flex items-center gap-2 text-sm">
                    <Globe className="h-4 w-4 text-muted-foreground" />
                    <a 
                      href={company.website} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      {company.website}
                    </a>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Additional Information */}
          {company.description && (
            <div className="mt-6 pt-6 border-t">
              <h4 className="font-medium mb-2">Business Description</h4>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {company.description}
              </p>
            </div>
          )}

          {/* Additional Contacts */}
          {company.contacts && company.contacts.length > 1 && (
            <div className="mt-6 pt-6 border-t">
              <h4 className="font-medium mb-4">Additional Contacts</h4>
              <div className="grid sm:grid-cols-2 gap-4">
                {company.contacts
                  .filter(contact => !contact.isPrimary)
                  .map(contact => (
                    <div key={contact.id} className="p-3 border rounded-lg">
                      <div className="font-medium">{contact.name}</div>
                      {contact.role && (
                        <div className="text-xs text-muted-foreground mb-1">{contact.role}</div>
                      )}
                      <div className="text-sm space-y-1">
                        <div className="flex items-center gap-2">
                          <Mail className="h-3 w-3 text-muted-foreground" />
                          <span>{contact.email}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Phone className="h-3 w-3 text-muted-foreground" />
                          <span>{contact.phone}</span>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Business Preferences */}
      {company.preferences && (
        <Card>
          <CardHeader>
            <CardTitle>Business Preferences</CardTitle>
            <CardDescription>Default settings for your business operations</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-4">
              {company.preferences.defaultPaymentTerms && (
                <div>
                  <div className="text-sm font-medium">Default Payment Terms</div>
                  <div className="text-sm text-muted-foreground">{company.preferences.defaultPaymentTerms}</div>
                </div>
              )}
              {company.preferences.defaultCurrency && (
                <div>
                  <div className="text-sm font-medium">Default Currency</div>
                  <div className="text-sm text-muted-foreground">{company.preferences.defaultCurrency}</div>
                </div>
              )}
              {company.preferences.defaultTaxRate !== undefined && (
                <div>
                  <div className="text-sm font-medium">Default Tax Rate</div>
                  <div className="text-sm text-muted-foreground">{company.preferences.defaultTaxRate}%</div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function CompanyPageSkeleton() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-32" />
            </div>
            <Skeleton className="h-10 w-24" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-4 w-40" />
              </div>
            </div>
            <div className="space-y-4">
              <div className="space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-4 w-40" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
