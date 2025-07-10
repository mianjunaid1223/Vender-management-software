"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { Lock, Mail, Building2 } from "lucide-react";

export function VendorPortalLogin() {
  const [credentials, setCredentials] = useState({
    vendorId: '',
    email: '',
    accessCode: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Simulate login API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // For demo purposes, show success message
      toast({
        title: "Access Granted",
        description: "Redirecting to your vendor dashboard...",
      });
      
      // In a real app, redirect to vendor dashboard
      console.log("Vendor login successful:", credentials);
      
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Login Failed",
        description: "Invalid credentials. Please check your information and try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="vendorId">Vendor ID</Label>
          <div className="relative">
            <Building2 className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              id="vendorId"
              type="text"
              placeholder="Enter your vendor ID"
              value={credentials.vendorId}
              onChange={(e) => setCredentials(prev => ({ ...prev, vendorId: e.target.value }))}
              className="pl-10"
              required
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email Address</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              id="email"
              type="email"
              placeholder="Enter your email"
              value={credentials.email}
              onChange={(e) => setCredentials(prev => ({ ...prev, email: e.target.value }))}
              className="pl-10"
              required
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="accessCode">Access Code</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              id="accessCode"
              type="password"
              placeholder="Enter your access code"
              value={credentials.accessCode}
              onChange={(e) => setCredentials(prev => ({ ...prev, accessCode: e.target.value }))}
              className="pl-10"
              required
            />
          </div>
        </div>

        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? "Authenticating..." : "Access Portal"}
        </Button>
      </form>

      <Alert>
        <AlertDescription>
          <strong>Demo Access:</strong> Use any vendor ID and email combination for demonstration purposes. 
          The access code can be any value.
        </AlertDescription>
      </Alert>

      <div className="text-center">
        <Button variant="link" className="text-sm">
          Forgot your access code?
        </Button>
      </div>
    </div>
  );
}
