'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Copy, Mail, Link, Users, Send, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface VendorInviteManagerProps {
  companyId: string;
  companyName: string;
}

export function VendorInviteManager({ companyId, companyName }: VendorInviteManagerProps) {
  const [email, setEmail] = useState('');
  const [customMessage, setCustomMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  // Generate vendor portal link with company ID
  const getVendorPortalLink = () => {
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://your-domain.com';
    return `${baseUrl}/vendor-portal?company=${companyId}`;
  };

  const copyLinkToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(getVendorPortalLink());
      toast({
        title: 'Success',
        description: 'Vendor portal link copied to clipboard!'
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to copy link to clipboard',
        variant: 'destructive'
      });
    }
  };

  const sendInviteEmail = async () => {
    if (!email) {
      toast({
        title: 'Error',
        description: 'Please enter a vendor email address',
        variant: 'destructive'
      });
      return;
    }

    setIsLoading(true);
    try {
      // TODO: Implement email sending logic
      const response = await fetch('/api/vendor-invites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          companyId,
          companyName,
          customMessage,
          portalLink: getVendorPortalLink()
        })
      });

      if (response.ok) {
        toast({
          title: 'Success',
          description: `Invitation sent to ${email}`
        });
        setEmail('');
        setCustomMessage('');
      } else {
        throw new Error('Failed to send invitation');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to send invitation email',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const defaultMessage = `Hello,

You've been invited to join ${companyName}'s vendor network. Please use the link below to complete your registration and start collaborating with us.

This portal will allow you to:
• Complete your vendor profile and documentation
• Submit and track invoices
• Access contract information
• Communicate directly with our team

We look forward to working with you!

Best regards,
${companyName} Team`;

  return (
    <div className="space-y-6">
      {/* Portal Link Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Link className="h-5 w-5" />
            Vendor Portal Link
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2">
            <Input
              value={getVendorPortalLink()}
              readOnly
              className="font-mono text-sm"
            />
            <Button onClick={copyLinkToClipboard} variant="outline" size="icon">
              <Copy className="h-4 w-4" />
            </Button>
          </div>
          <div className="text-sm text-muted-foreground">
            Share this link with vendors to allow them to self-register and access your vendor portal.
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-green-600">
              <CheckCircle className="h-3 w-3 mr-1" />
              Company ID: {companyId}
            </Badge>
            <Badge variant="outline">
              <Users className="h-3 w-3 mr-1" />
              Self-Service Registration
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Email Invitation Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Send Email Invitation
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="vendor-email">Vendor Email Address</Label>
            <Input
              id="vendor-email"
              type="email"
              placeholder="vendor@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="custom-message">Custom Message (Optional)</Label>
            <Textarea
              id="custom-message"
              placeholder="Add a personal message to the invitation..."
              value={customMessage}
              onChange={(e) => setCustomMessage(e.target.value)}
              rows={4}
            />
          </div>

          <div className="border rounded-lg p-4 bg-muted/50">
            <Label className="text-sm font-medium">Email Preview:</Label>
            <div className="mt-2 text-sm whitespace-pre-wrap">
              {customMessage || defaultMessage}
              {'\n\n'}
              <strong>Vendor Portal Link:</strong> {getVendorPortalLink()}
            </div>
          </div>

          <Button 
            onClick={sendInviteEmail} 
            disabled={isLoading || !email}
            className="w-full"
          >
            <Send className="h-4 w-4 mr-2" />
            {isLoading ? 'Sending...' : 'Send Invitation'}
          </Button>
        </CardContent>
      </Card>

      {/* Instructions Section */}
      <Card>
        <CardHeader>
          <CardTitle>How Vendor Onboarding Works</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h4 className="font-medium">For Admins:</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Copy and share the portal link above</li>
                <li>• Or send direct email invitations</li>
                <li>• Review and approve vendor applications</li>
                <li>• Manage vendor access and permissions</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium">For Vendors:</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Click the portal link to register</li>
                <li>• Complete 4-step onboarding process</li>
                <li>• Upload required documentation</li>
                <li>• Access invoice and contract tools</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
