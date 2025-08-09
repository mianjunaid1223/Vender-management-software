"use client";

import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { 
  MoreHorizontal, 
  Eye, 
  Check, 
  X, 
  Search, 
  Building2, 
  Mail, 
  Phone, 
  MapPin,
  Calendar,
  FileText,
  DollarSign,
  Copy
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { VendorApplication } from "@/lib/types";
import { ScrollArea } from "../ui/scroll-area";

interface VendorApplicationsTableProps {
  data: VendorApplication[];
}

export function VendorApplicationsTable({ data: initialData }: VendorApplicationsTableProps) {
  const [data, setData] = useState(initialData);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedApplication, setSelectedApplication] = useState<VendorApplication | null>(null);
  const [showViewDialog, setShowViewDialog] = useState(false);
  
  // Debug logging
  console.log('VendorApplicationsTable data:', initialData);
  console.log('Number of applications:', initialData.length);
  initialData.forEach((app, i) => {
    console.log(`App ${i}:`, {
      id: app.id,
      applicationId: app.applicationId,
      vendorName: app.vendorName || app.name,
      status: app.status,
      targetCompanyId: app.targetCompanyId
    });
  });
  const [showApprovalDialog, setShowApprovalDialog] = useState(false);
  const [approvalAction, setApprovalAction] = useState<'approve' | 'reject'>('approve');
  const [reviewNotes, setReviewNotes] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const filteredData = data.filter((application) => {
    if (!searchTerm) return true;
    
    const searchLower = searchTerm.toLowerCase();
    return (
      (application.name?.toLowerCase() || '').includes(searchLower) ||
      (application.vendorName?.toLowerCase() || '').includes(searchLower) ||
      (application.contactPerson?.toLowerCase() || '').includes(searchLower) ||
      (application.email?.toLowerCase() || '').includes(searchLower) ||
      (application.phone?.toLowerCase() || '').includes(searchLower) ||
      (application.service?.toLowerCase() || '').includes(searchLower) ||
      (application.taxId?.toLowerCase() || '').includes(searchLower) ||
      (application.paymentTerms?.toLowerCase() || '').includes(searchLower) ||
      (application.address?.street?.toLowerCase() || '').includes(searchLower) ||
      (application.address?.city?.toLowerCase() || '').includes(searchLower) ||
      (application.address?.state?.toLowerCase() || '').includes(searchLower) ||
      (application.address?.zipCode?.toLowerCase() || '').includes(searchLower) ||
      (application.notes?.toLowerCase() || '').includes(searchLower)
    );
  });

  const handleViewApplication = (application: VendorApplication) => {
    setSelectedApplication(application);
    setShowViewDialog(true);
  };

  const handleApprovalAction = (application: VendorApplication, action: 'approve' | 'reject') => {
    setSelectedApplication(application);
    setApprovalAction(action);
    setReviewNotes('');
    setShowApprovalDialog(true);
  };

  const copyApplicationLink = async (application: VendorApplication) => {
    try {
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || window.location.origin;
      const applicationLink = `${baseUrl}/vendor-applications/${application.id}`;
      
      await navigator.clipboard.writeText(applicationLink);
      toast({
        title: "Link Copied!",
        description: "Application link has been copied to clipboard.",
      });
    } catch (error) {
      toast({
        title: "Copy Failed",
        description: "Could not copy link to clipboard.",
        variant: "destructive",
      });
    }
  };

  const processApplication = async () => {
    if (!selectedApplication) return;
    
    setIsProcessing(true);
    try {
      const response = await fetch(`/api/vendor-applications/${selectedApplication.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: approvalAction === 'approve' ? 'approved' : 'rejected',
          notes: reviewNotes,
          // Only generate a token for approval
          generateToken: approvalAction === 'approve'
        })
      });

      if (response.ok) {
        const result = await response.json();
        
        // Update local state
        setData(prev => prev.map(app => 
          app.id === selectedApplication.id 
            ? { 
                ...app, 
                status: approvalAction === 'approve' ? 'approved' : 'rejected', 
                notes: reviewNotes,
                inviteToken: result.inviteToken || null
              }
            : app
        ));
        
        toast({
          title: `Application ${approvalAction === 'approve' ? 'Approved' : 'Rejected'}`,
          description: (
            <div>
              <p>Vendor application has been {approvalAction === 'approve' ? 'approved' : 'rejected'} successfully.</p>
              <div className="mt-2 p-2 bg-green-50 dark:bg-green-900/20 rounded border border-green-200 dark:border-green-800">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-green-600" />
                  <p className="text-sm font-medium text-green-800 dark:text-green-200">
                    Email notification sent to {selectedApplication.email}
                  </p>
                </div>
                <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                  {approvalAction === 'approve' 
                    ? 'The vendor will receive an approval confirmation email.'
                    : 'The vendor will receive a rejection notification.'
                  }
                </p>
              </div>
            </div>
          )
        });
        
        setShowApprovalDialog(false);
        setSelectedApplication(null);
      } else {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to process application');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to process application. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return "bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300";
      case 'rejected':
        return "bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300";
      case 'pending':
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/50 dark:text-gray-300";
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (e) {
      return 'Invalid date';
    }
  };

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search applications..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>
      </div>

      {/* Applications Table */}
      <div className="rounded-lg border shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Application</TableHead>
              <TableHead>Company</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Submitted</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>
                <span className="sr-only">Actions</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredData.map((application) => (
              <TableRow key={application.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                      <Building2 className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="font-medium">#{application.applicationId}</div>
                      <div className="text-sm text-muted-foreground">
                        {application.service ? `${application.service.substring(0, 30)}...` : 'No service specified'}
                      </div>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div>
                    <div className="font-medium">{application.vendorName || application.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {application.service}
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-sm">
                      <Mail className="h-3 w-3 text-muted-foreground" />
                      <span>{application.email}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="h-3 w-3 text-muted-foreground" />
                      <span>{application.phone}</span>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Contact: {application.contactPerson}
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-3 w-3 text-muted-foreground" />
                    <span>{formatDate(application.submittedAt)}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge className={getStatusColor(application.status)}>
                    {application.status.charAt(0).toUpperCase() + application.status.slice(1)}
                  </Badge>
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button aria-haspopup="true" size="icon" variant="ghost">
                        <MoreHorizontal className="h-4 w-4" />
                        <span className="sr-only">Toggle menu</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => handleViewApplication(application)}>
                        <Eye className="mr-2 h-4 w-4" />
                        View Details
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => copyApplicationLink(application)}>
                        <Copy className="mr-2 h-4 w-4" />
                        Copy Application Link
                      </DropdownMenuItem>
                      {application.status === 'pending' && (
                        <>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            onClick={() => handleApprovalAction(application, 'approve')}
                            className="text-green-600"
                          >
                            <Check className="mr-2 h-4 w-4" />
                            Approve
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => handleApprovalAction(application, 'reject')}
                            className="text-red-600"
                          >
                            <X className="mr-2 h-4 w-4" />
                            Reject
                          </DropdownMenuItem>
                        </>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        
        {filteredData.length === 0 && (
          <div className="text-center py-8">
            <p className="text-muted-foreground">No vendor applications found.</p>
          </div>
        )}
      </div>

      {/* View Application Dialog */}
      <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Vendor Application Details</DialogTitle>
          </DialogHeader>
          {selectedApplication && (
            <ScrollArea className="max-h-[70vh] pr-4">
              <div className="space-y-6 py-2">
                {/* Basic Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Basic Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-sm font-medium">Application ID</label>
                      <p className="text-sm text-muted-foreground">{selectedApplication.applicationId}</p>
                    </div>
                    <div className="space-y-1">
                      <label className="text-sm font-medium">Status</label>
                      <div>
                        <Badge className={getStatusColor(selectedApplication.status)}>
                          {selectedApplication.status.charAt(0).toUpperCase() + selectedApplication.status.slice(1)}
                        </Badge>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="text-sm font-medium">Company Name</label>
                      <p className="text-sm text-muted-foreground">{selectedApplication.name}</p>
                    </div>
                    <div className="space-y-1">
                      <label className="text-sm font-medium">Contact Person</label>
                      <p className="text-sm text-muted-foreground">{selectedApplication.contactPerson}</p>
                    </div>
                    <div className="space-y-1">
                      <label className="text-sm font-medium">Email</label>
                      <p className="text-sm text-muted-foreground">{selectedApplication.email}</p>
                    </div>
                    <div className="space-y-1">
                      <label className="text-sm font-medium">Phone</label>
                      <p className="text-sm text-muted-foreground">{selectedApplication.phone}</p>
                    </div>
                  </div>
                </div>

                {/* Business Details */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Business Details</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-sm font-medium">Service/Product</label>
                      <p className="text-sm text-muted-foreground">{selectedApplication.service}</p>
                    </div>
                    <div className="space-y-1">
                      <label className="text-sm font-medium">Tax ID</label>
                      <p className="text-sm text-muted-foreground">{selectedApplication.taxId || 'Not provided'}</p>
                    </div>
                    <div className="space-y-1">
                      <label className="text-sm font-medium">Payment Terms</label>
                      <p className="text-sm text-muted-foreground">
                        {selectedApplication.paymentTerms || 'Not specified'}
                      </p>
                    </div>
                    {selectedApplication.address && (
                      <div className="space-y-1">
                        <label className="text-sm font-medium">Address</label>
                        <p className="text-sm text-muted-foreground">
                          {selectedApplication.address.street}<br />
                          {selectedApplication.address.city}, {selectedApplication.address.state}<br />
                          {selectedApplication.address.zipCode}
                        </p>
                      </div>
                    )}
                    {selectedApplication.notes && (
                      <div className="space-y-1 md:col-span-2">
                        <label className="text-sm font-medium">Additional Notes</label>
                        <p className="text-sm text-muted-foreground whitespace-pre-line">
                          {selectedApplication.notes}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Application Timeline */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Application Timeline</h3>
                  <div className="space-y-4">
                    <div className="flex items-start gap-4">
                      <div className="flex flex-col items-center">
                        <div className="h-3 w-3 rounded-full bg-blue-500 mt-1"></div>
                        <div className="h-full w-px bg-gray-200 dark:bg-gray-700 my-1"></div>
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">Application Submitted</p>
                        <p className="text-xs text-muted-foreground">
                          {formatDate(selectedApplication.submittedAt)}
                        </p>
                      </div>
                    </div>
                    
                    {selectedApplication.reviewedAt && (
                      <div className="flex items-start gap-4">
                        <div className="flex flex-col items-center">
                          <div className="h-3 w-3 rounded-full bg-green-500 mt-1"></div>
                          <div className="h-full w-px bg-gray-200 dark:bg-gray-700 my-1"></div>
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium">
                            Application {selectedApplication.status === 'approved' ? 'Approved' : 'Rejected'}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatDate(selectedApplication.reviewedAt)}
                            {selectedApplication.reviewedBy && ` by ${selectedApplication.reviewedBy}`}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end gap-2 pt-4 border-t">
                  <Button 
                    variant="outline" 
                    onClick={() => setShowViewDialog(false)}
                  >
                    Close
                  </Button>
                  {selectedApplication.status === 'pending' && (
                    <>
                      <Button 
                        variant="outline" 
                        className="text-red-600 border-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                        onClick={() => handleApprovalAction(selectedApplication, 'reject')}
                      >
                        <X className="mr-2 h-4 w-4" />
                        Reject
                      </Button>
                      <Button 
                        onClick={() => handleApprovalAction(selectedApplication, 'approve')}
                      >
                        <Check className="mr-2 h-4 w-4" />
                        Approve
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </ScrollArea>
          )}
        </DialogContent>
      </Dialog>

      {/* Approval/Rejection Dialog */}
      <AlertDialog open={showApprovalDialog} onOpenChange={setShowApprovalDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {approvalAction === 'approve' ? 'Approve' : 'Reject'} Application
            </AlertDialogTitle>
            <AlertDialogDescription>
              {selectedApplication ? (
                <>
                  Are you sure you want to {approvalAction} the application from "{selectedApplication.name}"?
                  {approvalAction === 'approve' && ' This will allow them to access the vendor portal.'}
                </>
              ) : (
                `Are you sure you want to ${approvalAction} this application?`
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-2">
            <label className="text-sm font-medium">Review Notes (Optional)</label>
            <Textarea
              placeholder={`Add notes about your ${approvalAction} decision...`}
              value={reviewNotes}
              onChange={(e) => setReviewNotes(e.target.value)}
              rows={3}
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={processApplication}
              disabled={isProcessing}
              className={approvalAction === 'approve' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}
            >
              {isProcessing ? 'Processing...' : (approvalAction === 'approve' ? 'Approve' : 'Reject')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
