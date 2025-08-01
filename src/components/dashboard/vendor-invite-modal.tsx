'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { 
  UserPlus, 
  Link2, 
  Mail, 
  Copy, 
  Clock, 
  Shield, 
  CheckCircle, 
  Loader2,
  ExternalLink,
  Calendar,
  Plus
} from 'lucide-react';

interface VendorInviteModalProps {
  companyName: string;
  trigger?: React.ReactNode;
}

export function VendorInviteModal({ companyName, trigger }: VendorInviteModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [inviteData, setInviteData] = useState<{
    url: string;
    token: string;
    expiresAt: string;
    inviteId: string;
  } | null>(null);
  const [emailData, setEmailData] = useState({
    email: '',
    message: `Hello! You've been invited to join ${companyName}'s vendor network. Please complete your registration using the link below.`
  });
  const [vendorName, setVendorName] = useState('');
  const [inviteHistory, setInviteHistory] = useState<any[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const { toast } = useToast();

  const generateInviteLink = async () => {
    if (!vendorName.trim()) {
      toast({
        title: 'Vendor Name Required',
        description: 'Please enter the vendor name before generating an invite link.',
        variant: 'destructive'
      });
      return;
    }

    setIsGenerating(true);
    try {
      const response = await fetch('/api/vendor-invites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'generate',
          vendorName: vendorName.trim()
        })
      });

      const data = await response.json();
      
      if (data.success) {
        setInviteData({
          url: data.inviteUrl,
          token: data.token,
          expiresAt: data.expiresAt,
          inviteId: data.inviteId
        });
        toast({
          title: 'Invite Link Generated',
          description: 'Secure vendor invite link created successfully.',
        });
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

  const copyToClipboard = async () => {
    if (!inviteData?.url) return;
    
    try {
      await navigator.clipboard.writeText(inviteData.url);
      toast({
        title: 'Copied!',
        description: 'Invite link copied to clipboard.',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to copy link. Please copy manually.',
        variant: 'destructive'
      });
    }
  };

  const sendEmail = async () => {
    if (!emailData.email || !inviteData?.url) return;
    
    setIsSending(true);
    try {
      const response = await fetch('/api/vendor-invites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'send-email',
          email: emailData.email,
          message: emailData.message,
          inviteUrl: inviteData.url,
          inviteId: inviteData.inviteId
        })
      });

      const data = await response.json();
      
      if (data.success) {
        toast({
          title: 'Email Sent',
          description: `Invitation sent to ${emailData.email}`,
        });
        setEmailData({ ...emailData, email: '' });
      } else {
        throw new Error(data.error || 'Failed to send email');
      }
    } catch (error) {
      console.error('Error sending email:', error);
      toast({
        title: 'Error',
        description: 'Failed to send invitation email. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsSending(false);
    }
  };

  const formatExpiryDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const loadInviteHistory = async () => {
    setIsLoadingHistory(true);
    try {
      const response = await fetch('/api/vendor-invites?action=history');
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

  const resetModal = () => {
    setInviteData(null);
    setVendorName('');
    setEmailData({
      email: '',
      message: `Hello! You've been invited to join ${companyName}'s vendor network. Please complete your registration using the link below.`
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      setIsOpen(open);
      if (!open) resetModal();
    }}>
      <DialogTrigger asChild>
        {trigger || (
          <Button className="bg-blue-600 hover:bg-blue-700">
            <UserPlus className="h-4 w-4 mr-2" />
            Invite Vendor
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-4xl w-[95vw] max-h-[90vh] p-0">
        <div className="flex flex-col h-full max-h-[90vh]">
          <DialogHeader className="px-6 pt-6 pb-4 border-b">
            <DialogTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-blue-600" />
              Secure Vendor Invitation
            </DialogTitle>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto px-6 pb-6">
            <Tabs defaultValue="create" className="h-full">
              <TabsList className="grid w-full grid-cols-2 my-4">
                <TabsTrigger value="create" className="flex items-center gap-2 text-sm">
                  <UserPlus className="h-4 w-4" />
                  <span className="hidden sm:inline">Create Invite</span>
                  <span className="sm:hidden">Create</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="history" 
                  className="flex items-center gap-2 text-sm"
                  onClick={() => {
                    if (!showHistory) {
                      setShowHistory(true);
                      loadInviteHistory();
                    }
                  }}
                >
                  <Clock className="h-4 w-4" />
                  <span className="hidden sm:inline">Invite History</span>
                  <span className="sm:hidden">History</span>
                </TabsTrigger>
              </TabsList>

              <div className="space-y-4">
              <TabsContent value="create" className="space-y-4 mt-0">
                {/* Company Info */}
                <Card className="border-blue-200 bg-blue-50/50 dark:bg-blue-950/20 dark:border-blue-800">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm text-blue-700 dark:text-blue-300">Inviting to</CardTitle>
                    <CardDescription className="text-lg font-medium text-foreground">
                      {companyName}
                    </CardDescription>
                  </CardHeader>
                </Card>

                {/* Vendor Name Input */}
                <Card>
                  <CardHeader className="pb-4">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <UserPlus className="h-4 w-4" />
                      Vendor Information
                    </CardTitle>
                    <CardDescription className="text-sm">
                      Enter the vendor company name for tracking
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <Label htmlFor="vendor-name" className="text-sm font-medium">Vendor Company Name *</Label>
                      <Input
                        id="vendor-name"
                        placeholder="e.g., Acme Corp, Tech Solutions Inc."
                        value={vendorName}
                        onChange={(e) => setVendorName(e.target.value)}
                        disabled={!!inviteData}
                        className="w-full"
                      />
                    </div>
                  </CardContent>
                </Card>

                {!inviteData ? (
                  /* Generate Link Step */
                  <Card>
                    <CardHeader className="pb-4">
                      <CardTitle className="flex items-center gap-2 text-base">
                        <Link2 className="h-4 w-4" />
                        Generate Secure Invite Link
                      </CardTitle>
                      <CardDescription className="text-sm">
                        Create a new encrypted invite link that expires in 7 days
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Shield className="h-4 w-4 shrink-0" />
                            <span>Links are encrypted and expire automatically</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Clock className="h-4 w-4 shrink-0" />
                            <span>Valid for 7 days from creation</span>
                          </div>
                        </div>
                        <Button 
                          onClick={generateInviteLink}
                          disabled={isGenerating}
                          className="w-full bg-blue-600 hover:bg-blue-700"
                          size="lg"
                        >
                          {isGenerating ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              <span className="hidden sm:inline">Generating Secure Link...</span>
                              <span className="sm:hidden">Generating...</span>
                            </>
                          ) : (
                            <>
                              <Link2 className="h-4 w-4 mr-2" />
                              <span className="hidden sm:inline">Generate New Invite Link</span>
                              <span className="sm:hidden">Generate Link</span>
                            </>
                          )}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
          ) : (
            /* Link Generated - Show Options */
            <Tabs defaultValue="copy" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="copy" className="flex items-center gap-2">
                  <Copy className="h-4 w-4" />
                  Copy Link
                </TabsTrigger>
                <TabsTrigger value="email" className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Send Email
                </TabsTrigger>
              </TabsList>

                {/* Link Info */}
                <Card className="mt-4 border-green-200 bg-green-50/50 dark:bg-green-950/20 dark:border-green-800">
                  <CardContent className="pt-4">
                    <div className="space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                        <Badge variant="outline" className="text-green-600 border-green-300 w-fit">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Link Generated
                        </Badge>
                        <Badge variant="secondary" className="text-orange-600 w-fit">
                          <Calendar className="h-3 w-3 mr-1" />
                          <span className="hidden sm:inline">Expires {formatExpiryDate(inviteData.expiresAt)}</span>
                          <span className="sm:hidden">Exp. {formatExpiryDate(inviteData.expiresAt)}</span>
                        </Badge>
                      </div>
                      <div className="bg-muted/50 p-3 rounded-lg border">
                        <div className="text-xs text-muted-foreground mb-2 font-medium">Secure Invite URL</div>
                        <div className="text-sm font-mono break-all bg-background p-2 rounded border text-foreground overflow-x-auto">
                          {inviteData.url}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

              <TabsContent value="copy" className="space-y-4">
                <Card>
                  <CardHeader className="pb-4">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Copy className="h-4 w-4" />
                      Copy Invite Link
                    </CardTitle>
                    <CardDescription className="text-sm">
                      Share this secure link with your vendor
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Button 
                      onClick={copyToClipboard} 
                      className="w-full bg-green-600 hover:bg-green-700"
                      size="lg"
                    >
                      <Copy className="h-4 w-4 mr-2" />
                      <span className="hidden sm:inline">Copy to Clipboard</span>
                      <span className="sm:hidden">Copy Link</span>
                    </Button>
                    <div className="text-xs text-muted-foreground text-center bg-muted/30 p-2 rounded">
                      <Clock className="h-3 w-3 inline mr-1" />
                      Link expires on {formatExpiryDate(inviteData.expiresAt)}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="email" className="space-y-4">
                <Card>
                  <CardHeader className="pb-4">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Mail className="h-4 w-4" />
                      Send Email Invitation
                    </CardTitle>
                    <CardDescription className="text-sm">
                      Send the invite link directly to your vendor
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="vendor-email" className="text-sm font-medium">Vendor Email Address *</Label>
                      <Input
                        id="vendor-email"
                        type="email"
                        placeholder="vendor@company.com"
                        value={emailData.email}
                        onChange={(e) => setEmailData({ ...emailData, email: e.target.value })}
                        className="w-full"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email-message" className="text-sm font-medium">Custom Message (Optional)</Label>
                      <Textarea
                        id="email-message"
                        placeholder="Add a personal message to include with the invitation..."
                        rows={3}
                        value={emailData.message}
                        onChange={(e) => setEmailData({ ...emailData, message: e.target.value })}
                        className="w-full resize-none"
                      />
                    </div>
                    <Button 
                      onClick={sendEmail}
                      disabled={!emailData.email || isSending}
                      className="w-full bg-blue-600 hover:bg-blue-700"
                      size="lg"
                    >
                      {isSending ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          <span className="hidden sm:inline">Sending Invitation...</span>
                          <span className="sm:hidden">Sending...</span>
                        </>
                      ) : (
                        <>
                          <Mail className="h-4 w-4 mr-2" />
                          <span className="hidden sm:inline">Send Email Invitation</span>
                          <span className="sm:hidden">Send Email</span>
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          )}

                {/* Generate New Link Option */}
                {inviteData && (
                  <div className="pt-4 border-t border-muted">
                    <div className="text-xs text-muted-foreground mb-3 text-center">
                      Need a fresh link? Generate a new one to replace the current invitation.
                    </div>
                    <Button 
                      variant="outline" 
                      onClick={() => {
                        setInviteData(null);
                      }}
                      className="w-full border-dashed hover:bg-muted/50"
                      size="sm"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      <span className="hidden sm:inline">Generate New Invite Link</span>
                      <span className="sm:hidden">New Link</span>
                    </Button>
                  </div>
                )}
          </TabsContent>

          <TabsContent value="history" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Invite History
                </CardTitle>
                <CardDescription>
                  Track all vendor invitations sent from your account
                </CardDescription>
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
                    {inviteHistory.map((invite) => (
                      <div key={invite.inviteId} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="font-medium">{invite.vendorName}</div>
                          <Badge 
                            variant={invite.status === 'completed' ? 'default' : 
                                   invite.status === 'expired' ? 'destructive' : 
                                   invite.status === 'sent' ? 'secondary' : 'outline'}
                          >
                            {invite.status === 'pending' && 'Pending'}
                            {invite.status === 'sent' && 'Email Sent'}
                            {invite.status === 'completed' && 'Registered'}
                            {invite.status === 'expired' && 'Expired'}
                          </Badge>
                        </div>
                        <div className="text-sm text-muted-foreground space-y-1">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-3 w-3" />
                            Created: {new Date(invite.createdAt).toLocaleDateString()}
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="h-3 w-3" />
                            Expires: {new Date(invite.expiresAt).toLocaleDateString()}
                          </div>
                          {invite.emailSent && (
                            <div className="flex items-center gap-2">
                              <Mail className="h-3 w-3" />
                              Email sent to: {invite.emailSent}
                            </div>
                          )}
                          {invite.completedAt && (
                            <div className="flex items-center gap-2">
                              <CheckCircle className="h-3 w-3" />
                              Completed: {new Date(invite.completedAt).toLocaleDateString()}
                            </div>
                          )}
                        </div>
                        {invite.status === 'pending' && new Date() < new Date(invite.expiresAt) && (
                          <div className="mt-3 pt-3 border-t">
                            <div className="flex gap-2">
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => navigator.clipboard.writeText(invite.inviteUrl)}
                              >
                                <Copy className="h-3 w-3 mr-1" />
                                Copy Link
                              </Button>
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => {
                                  setEmailData({ ...emailData, email: '' });
                                  // You could add resend functionality here
                                }}
                              >
                                <Mail className="h-3 w-3 mr-1" />
                                Resend
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
              </TabsContent>

              <TabsContent value="history" className="space-y-4 mt-0">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      Invite History
                    </CardTitle>
                    <CardDescription>
                      Track all vendor invitations sent from your account
                    </CardDescription>
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
                        {inviteHistory.map((invite) => (
                          <div key={invite.inviteId} className="border rounded-lg p-4">
                            <div className="flex items-center justify-between mb-2">
                              <div className="font-medium truncate mr-2">{invite.vendorName}</div>
                              <Badge 
                                variant={invite.status === 'completed' ? 'default' : 
                                       invite.status === 'expired' ? 'destructive' : 
                                       invite.status === 'sent' ? 'secondary' : 'outline'}
                                className="shrink-0"
                              >
                                {invite.status === 'pending' && 'Pending'}
                                {invite.status === 'sent' && 'Email Sent'}
                                {invite.status === 'completed' && 'Registered'}
                                {invite.status === 'expired' && 'Expired'}
                              </Badge>
                            </div>
                            <div className="text-sm text-muted-foreground space-y-1">
                              <div className="flex items-center gap-2">
                                <Calendar className="h-3 w-3" />
                                <span className="truncate">Created: {new Date(invite.createdAt).toLocaleDateString()}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Clock className="h-3 w-3" />
                                <span className="truncate">Expires: {new Date(invite.expiresAt).toLocaleDateString()}</span>
                              </div>
                              {invite.emailSent && (
                                <div className="flex items-center gap-2">
                                  <Mail className="h-3 w-3" />
                                  <span className="truncate">Email sent to: {invite.emailSent}</span>
                                </div>
                              )}
                              {invite.completedAt && (
                                <div className="flex items-center gap-2">
                                  <CheckCircle className="h-3 w-3" />
                                  <span className="truncate">Completed: {new Date(invite.completedAt).toLocaleDateString()}</span>
                                </div>
                              )}
                            </div>
                            {invite.status === 'pending' && new Date() < new Date(invite.expiresAt) && (
                              <div className="mt-3 pt-3 border-t">
                                <div className="flex gap-2 flex-wrap">
                                  <Button 
                                    size="sm" 
                                    variant="outline"
                                    onClick={() => navigator.clipboard.writeText(invite.inviteUrl)}
                                    className="flex-1 sm:flex-none"
                                  >
                                    <Copy className="h-3 w-3 mr-1" />
                                    Copy Link
                                  </Button>
                                  <Button 
                                    size="sm" 
                                    variant="outline"
                                    onClick={() => {
                                      setEmailData({ ...emailData, email: '' });
                                    }}
                                    className="flex-1 sm:flex-none"
                                  >
                                    <Mail className="h-3 w-3 mr-1" />
                                    Resend
                                  </Button>
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
              </div>
            </Tabs>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
