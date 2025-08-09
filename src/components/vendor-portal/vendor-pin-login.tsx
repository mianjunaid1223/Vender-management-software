'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Shield, ArrowRight } from 'lucide-react';

interface VendorPinLoginProps {
  onSuccess: (vendorData: any) => void;
}

export function VendorPinLogin({ onSuccess }: VendorPinLoginProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [pin, setPin] = useState('');
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!pin.trim()) {
      toast({
        title: 'PIN Required',
        description: 'Please enter your vendor PIN.',
        variant: 'destructive'
      });
      return;
    }

    if (!email.trim()) {
      toast({
        title: 'Email Required',
        description: 'Please enter your email address for verification.',
        variant: 'destructive'
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/vendor/pin-auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          pin: pin.trim().toUpperCase(),
          email: email.trim()
        })
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: 'Login Successful! 🎉',
          description: `Welcome back, ${data.vendor.name}!`
        });
        
        // Store vendor data in session storage for the dashboard
        sessionStorage.setItem('vendorData', JSON.stringify(data.vendor));
        sessionStorage.setItem('vendorToken', data.token);
        
        onSuccess(data.vendor);
      } else {
        throw new Error(data.error || 'Login failed');
      }
    } catch (error) {
      console.error('PIN login error:', error);
      
      let errorMessage = 'Invalid PIN. Please check your PIN and try again.';
      if (error instanceof Error) {
        if (error.message.includes('Rate limited')) {
          errorMessage = 'Too many login attempts. Please wait 15 minutes before trying again.';
        } else if (error.message.includes('Invalid credentials')) {
          errorMessage = 'Invalid PIN or email combination. Please verify your credentials.';
        } else {
          errorMessage = error.message;
        }
      }
      
      toast({
        title: 'Login Failed',
        description: errorMessage,
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto bg-blue-100 p-3 rounded-full w-16 h-16 flex items-center justify-center mb-4">
            <Shield className="h-8 w-8 text-blue-600" />
          </div>
          <CardTitle className="text-2xl font-bold">Vendor Portal Login</CardTitle>
          <p className="text-muted-foreground">
            Enter your secure PIN to access your vendor dashboard
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="pin">Vendor PIN</Label>
              <Input
                id="pin"
                type="text"
                placeholder="Enter your 8-character PIN"
                value={pin}
                onChange={(e) => setPin(e.target.value.toUpperCase())}
                maxLength={8}
                className="text-center text-lg font-mono tracking-wider"
                disabled={isLoading}
                autoFocus
              />
              <p className="text-xs text-muted-foreground">
                PIN is case-insensitive and should be 8 characters
              </p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email">Email Address *</Label>
              <Input
                id="email"
                type="email"
                placeholder="your-email@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
                required
              />
              <p className="text-xs text-muted-foreground">
                Required for security verification
              </p>
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={isLoading || !pin.trim() || !email.trim()}
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Authenticating...
                </>
              ) : (
                <>
                  Access Dashboard
                  <ArrowRight className="h-4 w-4 ml-2" />
                </>
              )}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-sm text-blue-800 font-medium">Need Help?</p>
              <p className="text-xs text-blue-600 mt-1">
                Contact the company administrator if you don't have your PIN or need assistance.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
