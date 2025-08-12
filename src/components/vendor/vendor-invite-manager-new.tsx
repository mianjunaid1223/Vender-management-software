"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  UserPlus,
  Mail,
  Copy,
  ExternalLink,
  Clock,
  CheckCircle,
  XCircle,
  Loader2,
  Link as LinkIcon,
  History,
  Building2
} from 'lucide-react';

interface VendorInviteManagerNewProps {
  companyId: string;
  companyName: string;
}

interface VendorInvite {
  inviteId: string;
  vendorName: string;
  email: string;
  status: 'active' | 'completed' | 'expired';
  createdAt: string;
  expiresAt: string;
  inviteUrl: string;
  message?: string;
  emailSent: boolean;
  emailSentAt?: string;
  used: boolean;
}

export function VendorInviteManagerNew({ companyId, companyName }: VendorInviteManagerNewProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [vendorName, setVendorName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [generatedInvite, setGeneratedInvite] = useState<{
    url: string;
    token: string;
    expiresAt: string;
    inviteId: string;
  } | null>(null);
  const [inviteHistory, setInviteHistory] = useState<VendorInvite[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const { toast } = useToast();

  // Load invite history
  const loadInviteHistory = async () => {
    setIsLoadingHistory(true);
    try {
      const response = await fetch('/api/vendor/invites');
      const data = await response.json();
      
      if (data.success) {
        setInviteHistory(data.invites || []);
      } else {
        throw new Error(data.error || 'Failed to load history');
      }
    } catch (error) {
      console.error('Error loading invite history:', error);
      toast({
        title: 'Error',
        description: 'Failed to load invite history.',
        variant: 'destructive'
      });
    } finally {
      setIsLoadingHistory(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadInviteHistory();
    }
  }, [isOpen]);

  const generateInvite = async () => {
    if (!vendorName.trim()) {
      toast({
        title: 'Vendor Name Required',
        description: 'Please enter the vendor name before generating an invite.',
        variant: 'destructive'
      });
      return;
    }

    setIsGenerating(true);
    try {
      const response = await fetch('/api/vendor/invites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          vendorName: vendorName.trim(),
          email: email.trim() || undefined,
          message: message.trim() || undefined
        })
      });

      const data = await response.json();
      
      if (data.success) {
        setGeneratedInvite({
          url: data.inviteUrl,
          token: data.token,
          expiresAt: data.expiresAt,
          inviteId: data.inviteId
        });
        
        toast({
          title: 'Invite Generated',
          description: `Secure invite link created for ${vendorName}`,
        });
        
        // Reload history
        loadInviteHistory();
      } else {
        throw new Error(data.error || 'Failed to generate invite');
      }
    } catch (error) {
      console.error('Error generating invite:', error);
      toast({
        title: 'Error',
        description: 'Failed to generate invite link. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: 'Copied!',
        description: 'Link copied to clipboard.',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to copy link.',
        variant: 'destructive'
      });
    }
  };

  const sendEmailInvite = async () => {
    if (!email.trim() || !generatedInvite) return;

    setIsSending(true);
    try {
      // Send email invitation using the existing invite
      const response = await fetch('/api/vendor/invites', {
        method: 'PUT', // Use PUT to update and send email for existing invite
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          inviteId: generatedInvite.inviteId, // Fixed: use inviteId instead of id
          email: email.trim(),
          vendorName,
          message: message.trim()
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to send email');
      }

      const result = await response.json();
      
      toast({
        title: 'Email Sent Successfully! 📧',
        description: `Invitation email sent to ${email}`,
      });
      
    } catch (error) {
      console.error('Email sending error:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to send email. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsSending(false);
    }
  };

  const resetForm = () => {
    setVendorName('');
    setEmail('');
    setMessage('');
    setGeneratedInvite(null);
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

  const getStatusBadge = (status: string, isExpired?: boolean) => {
    if (isExpired) {
      return <Badge variant="destructive">Expired</Badge>;
    }
    
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-100 text-green-800">Completed</Badge>;
      case 'active':
        return <Badge className="bg-blue-100 text-blue-800">Active</Badge>;
      case 'expired':
        return <Badge variant="destructive">Expired</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      setIsOpen(open);
      if (!open) resetForm();
    }}>
      <DialogTrigger asChild>
        <Button className="bg-blue-600 hover:bg-blue-700">
          <UserPlus className="h-4 w-4 mr-2" />
          Invite Vendor
        </Button>
      </DialogTrigger>
      
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-blue-600" />
            Vendor Invitation Manager
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="create" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="create">Create Invite</TabsTrigger>
            <TabsTrigger value="history">Invite History</TabsTrigger>
          </TabsList>

          {/* Create Invite Tab */}
          <TabsContent value="create" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Company Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-blue-600">
                    {companyName}
                  </Badge>
                  <span className="text-sm text-muted-foreground">Company ID: {companyId}</span>
                </div>
              </CardContent>
            </Card>

            {!generatedInvite ? (
              /* Generate Invite Form */
              <Card>
                <CardHeader>
                  <CardTitle>Generate Vendor Invite</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="vendorName">Vendor Company Name *</Label>
                    <Input
                      id="vendorName"
                      placeholder="e.g., Acme Corp, Tech Solutions Inc."
                      value={vendorName}
                      onChange={(e) => setVendorName(e.target.value)}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address (Optional)</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="vendor@company.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="message">Custom Message (Optional)</Label>
                    <Textarea
                      id="message"
                      placeholder="Add a personal message to include with the invitation..."
                      rows={3}
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                    />
                  </div>
                  
                  <Button 
                    onClick={generateInvite}
                    disabled={isGenerating || !vendorName.trim()}
                    className="w-full bg-blue-600 hover:bg-blue-700"
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <LinkIcon className="h-4 w-4 mr-2" />
                        Generate Secure Invite Link
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            ) : (
              /* Generated Invite Display */
              <Card className="border-green-200 bg-green-50/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-green-800">
                    <CheckCircle className="h-5 w-5" />
                    Invite Link Generated
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Vendor: {vendorName}</span>
                    <Badge className="bg-green-100 text-green-800">
                      <Clock className="h-3 w-3 mr-1" />
                      Expires {formatDate(generatedInvite.expiresAt)}
                    </Badge>
                  </div>
                  
                  <div className="bg-white p-3 rounded border">
                    <Label className="text-sm font-medium">Secure Invite URL</Label>
                    <div className="mt-1 text-sm font-mono break-all bg-gray-50 p-2 rounded">
                      {generatedInvite.url}
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      onClick={() => copyToClipboard(generatedInvite.url)}
                      className="flex-1"
                    >
                      <Copy className="h-4 w-4 mr-2" />
                      Copy Link
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => window.open(generatedInvite.url, '_blank')}
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Test
                    </Button>
                  </div>
                  
                  {email && (
                    <div className="border-t pt-4">
                      <Button 
                        onClick={()=>({sendEmailInvite})}
                        disabled={isSending}
                        className="w-full bg-green-600 hover:bg-green-700"
                      >
                        {isSending ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Sending...
                          </>
                        ) : (
                          <>
                            <Mail className="h-4 w-4 mr-2" />
                            Send Email to {email}
                          </>
                        )}
                      </Button>
                    </div>
                  )}
                  
                  <Button 
                    variant="outline" 
                    onClick={resetForm}
                    className="w-full"
                  >
                    Generate Another Invite
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* History Tab */}
          <TabsContent value="history" className="space-y-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <History className="h-4 w-4" />
                  Invite History
                </CardTitle>
                <Button 
                  variant="outline" 
                  onClick={loadInviteHistory}
                  disabled={isLoadingHistory}
                >
                  {isLoadingHistory ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    'Refresh'
                  )}
                </Button>
              </CardHeader>
              <CardContent>
                {isLoadingHistory ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin mr-2" />
                    <span>Loading invite history...</span>
                  </div>
                ) : inviteHistory.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <UserPlus className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No invitations sent yet</p>
                    <p className="text-sm">Create your first vendor invite to see it here</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {inviteHistory.map((invite) => {
                      const isExpired = new Date() > new Date(invite.expiresAt);
                      
                      return (
                        <div key={invite.inviteId} className="border rounded-lg p-4">
                          <div className="flex items-center justify-between mb-2">
                            <div className="font-medium">{invite.vendorName}</div>
                            {getStatusBadge(invite.status, isExpired)}
                          </div>
                          
                          <div className="text-sm text-muted-foreground space-y-1">
                            <div className="flex items-center gap-2">
                              <Clock className="h-3 w-3" />
                              Created: {formatDate(invite.createdAt)}
                            </div>
                            <div className="flex items-center gap-2">
                              <Clock className="h-3 w-3" />
                              Expires: {formatDate(invite.expiresAt)}
                            </div>
                            {invite.email && (
                              <div className="flex items-center gap-2">
                                <Mail className="h-3 w-3" />
                                Email: {invite.email}
                              </div>
                            )}
                            {invite.used && (
                              <div className="flex items-center gap-2">
                                <CheckCircle className="h-3 w-3" />
                                Registration completed
                              </div>
                            )}
                          </div>
                          
                          {invite.status === 'active' && !isExpired && (
                            <div className="mt-3 pt-3 border-t flex gap-2">
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => copyToClipboard(invite.inviteUrl)}
                              >
                                <Copy className="h-3 w-3 mr-1" />
                                Copy Link
                              </Button>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => window.open(invite.inviteUrl, '_blank')}
                              >
                                <ExternalLink className="h-3 w-3 mr-1" />
                                Open
                              </Button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
