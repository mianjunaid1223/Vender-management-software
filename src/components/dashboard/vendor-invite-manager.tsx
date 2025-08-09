'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Copy, Mail, Link, Users, Send, CheckCircle, History, Calendar, User, ExternalLink } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface VendorInviteManagerProps {
  companyId: string;
  companyName: string;
}

interface VendorInvite {
  vendorName: string;
  email: string;
  status: 'pending' | 'completed' | 'expired';
  createdAt: string;
  expiresAt: string;
  inviteUrl: string;
  message?: string;
}

export function VendorInviteManager({ companyId, companyName }: VendorInviteManagerProps) {
  const [email, setEmail] = useState('');
  const [vendorName, setVendorName] = useState('');
  const [customMessage, setCustomMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [inviteHistory, setInviteHistory] = useState<VendorInvite[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const { toast } = useToast();

  // Fetch invite history
  const fetchInviteHistory = async () => {
    try {
      setIsLoadingHistory(true);
      const response = await fetch('/api/vendor-invites');
      
      if (response.ok) {
        const data = await response.json();
        setInviteHistory(data.invites || []);
      } else {
        throw new Error('Failed to fetch invite history');
      }
    } catch (error) {
      console.error('Error fetching invite history:', error);
      toast({
        title: 'Error',
        description: 'Failed to load invite history',
        variant: 'destructive'
      });
    } finally {
      setIsLoadingHistory(false);
    }
  };

  // Load invite history on component mount
  useEffect(() => {
    fetchInviteHistory();
  }, []);

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
    if (!email || !vendorName) {
      toast({
        title: 'Error',
        description: 'Please enter both vendor name and email address',
        variant: 'destructive'
      });
      return;
    }

    setIsLoading(true);
    try {
      // First generate the invite
      const generateResponse = await fetch('/api/vendor-invites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'generate',
          email,
          vendorName,
          message: customMessage
        })
      });

      if (!generateResponse.ok) {
        throw new Error('Failed to generate invitation');
      }

      const generateData = await generateResponse.json();
      
      // Then send the email
      const emailResponse = await fetch('/api/vendor-invites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'send-email',
          email,
          vendorName,
          message: customMessage,
          inviteUrl: generateData.inviteUrl
        })
      });

      if (emailResponse.ok) {
        toast({
          title: 'Success',
          description: `Invitation sent to ${email}`
        });
        setEmail('');
        setVendorName('');
        setCustomMessage('');
        // Refresh invite history
        fetchInviteHistory();
      } else {
        throw new Error('Failed to send invitation email');
      }
    } catch (error) {
      console.error('Invitation error:', error);
      toast({
        title: 'Error',
        description: 'Failed to send invitation email',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-100 text-green-800">Completed</Badge>;
      case 'expired':
        return <Badge variant="destructive">Expired</Badge>;
      case 'pending':
      default:
        return <Badge variant="outline" className="text-yellow-600">Pending</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const defaultMessage = `Hello,

You've been invited to join ${companyName}'s vendor network. Please use the link below to complete your registration and start collaborating with us.

This portal will allow you to:
• Complete your vendor profile and documentation
• Submit and track invoices
• Access contract information

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
            <Label htmlFor="vendor-name">Vendor Name</Label>
            <Input
              id="vendor-name"
              type="text"
              placeholder="Company or vendor name"
              value={vendorName}
              onChange={(e) => setVendorName(e.target.value)}
            />
          </div>

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
            disabled={isLoading || !email || !vendorName}
            className="w-full"
          >
            <Send className="h-4 w-4 mr-2" />
            {isLoading ? 'Sending...' : 'Send Invitation'}
          </Button>
        </CardContent>
      </Card>

      {/* Invite History Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Invite History
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoadingHistory ? (
            <div className="text-center py-8 text-muted-foreground">
              Loading invite history...
            </div>
          ) : inviteHistory.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No invitations sent yet. Send your first vendor invitation above!
            </div>
          ) : (
            <div className="space-y-4">
              <div className="text-sm text-muted-foreground mb-4">
                Track all vendor invitations sent from your account
              </div>
              <div className="space-y-3">
                {inviteHistory.map((invite, index) => (
                  <div key={index} className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4" />
                          <span className="font-medium">{invite.vendorName}</span>
                          {getStatusBadge(invite.status)}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {invite.email}
                        </div>
                      </div>
                      <div className="text-right text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {formatDate(invite.createdAt)}
                        </div>
                        {invite.status === 'pending' && (
                          <div className="text-xs mt-1">
                            Expires: {formatDate(invite.expiresAt)}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {invite.message && (
                      <div className="text-sm text-muted-foreground border-l-2 border-gray-200 pl-3">
                        <strong>Custom message:</strong> {invite.message}
                      </div>
                    )}
                    
                    <div className="flex items-center gap-2">
                      <Input
                        value={invite.inviteUrl}
                        readOnly
                        className="font-mono text-xs"
                      />
                      <Button 
                        onClick={() => navigator.clipboard.writeText(invite.inviteUrl)}
                        variant="outline" 
                        size="sm"
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                      <Button 
                        onClick={() => window.open(invite.inviteUrl, '_blank')}
                        variant="outline" 
                        size="sm"
                      >
                        <ExternalLink className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
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
