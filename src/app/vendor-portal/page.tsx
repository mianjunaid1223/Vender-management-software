import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { VendorPortalLogin } from "@/components/vendor-portal-login";
import { Building2, Shield, FileText, DollarSign, CheckCircle, Clock } from "lucide-react";

export default function VendorPortalPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Vendor Self-Service Portal
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Access your vendor profile, upload compliance documents, track payments, and manage your relationship with us.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-6xl mx-auto">
          {/* Login Section */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  Vendor Access
                </CardTitle>
                <CardDescription>
                  Log in to access your vendor dashboard and manage your profile
                </CardDescription>
              </CardHeader>
              <CardContent>
                <VendorPortalLogin />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>New Vendor?</CardTitle>
                <CardDescription>
                  Request access to join our vendor network
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full" variant="outline">
                  Request Vendor Access
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Features Section */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>What You Can Do</CardTitle>
                <CardDescription>
                  Comprehensive self-service capabilities for vendors
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-3">
                  <Shield className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div>
                    <h4 className="font-semibold">Compliance Management</h4>
                    <p className="text-sm text-muted-foreground">
                      Upload and manage compliance documents, certifications, and renewals
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <FileText className="h-5 w-5 text-green-600 mt-0.5" />
                  <div>
                    <h4 className="font-semibold">Contract Status</h4>
                    <p className="text-sm text-muted-foreground">
                      View contract details, renewal dates, and terms
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <DollarSign className="h-5 w-5 text-yellow-600 mt-0.5" />
                  <div>
                    <h4 className="font-semibold">Payment Tracking</h4>
                    <p className="text-sm text-muted-foreground">
                      Monitor invoice status and payment history
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <Building2 className="h-5 w-5 text-purple-600 mt-0.5" />
                  <div>
                    <h4 className="font-semibold">Profile Management</h4>
                    <p className="text-sm text-muted-foreground">
                      Update company information and contact details
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>System Status</CardTitle>
                <CardDescription>
                  Current system availability and updates
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Portal Status</span>
                  <Badge className="bg-green-100 text-green-800">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Operational
                  </Badge>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Document Upload</span>
                  <Badge className="bg-green-100 text-green-800">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Available
                  </Badge>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Payment Processing</span>
                  <Badge className="bg-yellow-100 text-yellow-800">
                    <Clock className="h-3 w-3 mr-1" />
                    Maintenance (Tonight 2-4 AM)
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Support Section */}
        <div className="mt-16 text-center">
          <Card className="max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle>Need Help?</CardTitle>
              <CardDescription>
                Our vendor support team is here to assist you
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button variant="outline">
                Contact Support
              </Button>
              <Button variant="outline">
                View Documentation
              </Button>
              <Button variant="outline">
                Schedule Training
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
