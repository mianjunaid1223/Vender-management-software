"use client";

import { useState, useEffect } from "react";
import { PageHeader } from "@/components/page-header";
import { ContractOnboardingDialog } from "@/components/dashboard/contract-onboarding-dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { 
  AlertCircle, 
  CheckCircle, 
  Search,
  Download,
  DollarSign,
  FileText,
  Eye,
  Edit,
  Trash2,
  Calendar,
  Building,
  Save,
  X,
  Clock,
  Receipt
} from "lucide-react";
import { fetchContracts, deleteContract, fetchInvoicesByContract, fetchVendors } from "@/lib/data";
import { Contract, Invoice, ContractStatus, Vendor } from "@/lib/types";
import { downloadContractPDF } from "@/lib/pdf-utils";
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
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function ContractsPage() {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const { toast } = useToast();

  useEffect(() => {
    loadContracts();
  }, []);

  const loadContracts = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/contracts');
      if (!response.ok) {
        throw new Error('Failed to fetch contracts');
      }
      const contractsData: Contract[] = await response.json();
      setContracts(contractsData);
    } catch (err) {
      console.error("Error loading contracts:", err);
      toast({
        title: "Error",
        description: "Failed to load contracts.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleContractAdded = () => {
    loadContracts();
  };

  const handleContractDeleted = (contractId: string) => {
    setContracts(prev => prev.filter(c => c.id !== contractId));
  };
  
  const handleExportContracts = () => {
    const filteredContracts = getFilteredContracts();
    const csvContent = convertToCSV(filteredContracts);
    downloadCSV(csvContent, "contracts.csv");
  };

  const convertToCSV = (data: Contract[]) => {
    if (!data.length) return "";
    const headers = Object.keys(data[0]);
    const csvRows = [headers.join(',')];
    
    data.forEach(contract => {
      const row = headers.map(header => {
        let value = contract[header as keyof Contract];
        if (typeof value === 'string') {
          return `"${value.replace(/"/g, '""')}"`;
        }
        if (typeof value === 'object' && value !== null) {
          return `"${JSON.stringify(value).replace(/"/g, '""')}"`;
        }
        return value;
      });
      csvRows.push(row.join(','));
    });
    
    return csvRows.join('\n');
  };

  const downloadCSV = (content: string, filename: string) => {
    if (!content) {
      toast({
        title: "No Data",
        description: "There is no data to export.",
      });
      return;
    }
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getFilteredContracts = () => {
    let filtered = contracts;
    
    const lowerCaseSearchTerm = searchTerm.toLowerCase();
    
    if (activeTab !== "all") {
        filtered = contracts.filter(c => c.status.toLowerCase() === activeTab);
    }
    
    if (searchTerm) {
      filtered = filtered.filter(contract => 
        contract.title?.toLowerCase().includes(lowerCaseSearchTerm) ||
        contract.vendorName?.toLowerCase().includes(lowerCaseSearchTerm)
      );
    }
    
    return filtered;
  };

  const activeContracts = contracts.filter(c => c.status === 'Active');
  const draftContracts = contracts.filter(c => c.status === 'Draft');
  const expiredContracts = contracts.filter(c => c.status === 'Expired');

  if (loading) return <ContractsPageSkeleton />;

  return (
    <div className="space-y-6">
      <PageHeader title="Contracts" description="Manage and track all your vendor contracts">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleExportContracts}>
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
          <ContractOnboardingDialog />
        </div>
      </PageHeader>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Contracts</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeContracts.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Draft Contracts</CardTitle>
            <FileText className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{draftContracts.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Expired Contracts</CardTitle>
            <AlertCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{expiredContracts.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Contracts</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{contracts.filter(c => c.status === 'Pending').length}</div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="all">All ({contracts.length})</TabsTrigger>
            <TabsTrigger value="active">Active ({activeContracts.length})</TabsTrigger>
            <TabsTrigger value="draft">Draft ({draftContracts.length})</TabsTrigger>
            <TabsTrigger value="expired">Expired ({expiredContracts.length})</TabsTrigger>
          </TabsList>
          
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input 
                placeholder="Search contracts..." 
                className="pl-9 w-64"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </div>
        <ContractsGrid 
          contracts={getFilteredContracts()} 
          onContractDeleted={handleContractDeleted}
          onContractUpdated={(updatedContract) => {
            setContracts(prev => prev.map(c => c.id === updatedContract.id ? updatedContract : c))
          }}
        />
      </Tabs>
    </div>
  );
}

function ContractsGrid({ 
  contracts, 
  onContractDeleted,
  onContractUpdated
}: { 
  contracts: Contract[], 
  onContractDeleted: (id: string) => void,
  onContractUpdated: (contract: Contract) => void 
}) {
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null);
  const [associatedInvoices, setAssociatedInvoices] = useState<Invoice[]>([]);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const { toast } = useToast();

  const openDeleteDialog = async (contract: Contract) => {
    setSelectedContract(contract);
    try {
      const invoices = await fetchInvoicesByContract(contract.id);
      setAssociatedInvoices(invoices);
    } catch (error) {
      toast({
        title: "Error",
        description: "Could not fetch associated invoices.",
        variant: "destructive",
      });
      setAssociatedInvoices([]);
    }
    setDeleteDialogOpen(true);
  };
  
  const confirmDelete = async () => {
    if (!selectedContract) return;

    setIsDeleting(true);
    try {
      await deleteContract(selectedContract.id);
      toast({
        title: "Success",
        description: "Contract and associated data deleted successfully.",
      });
      onContractDeleted(selectedContract.id);
      setDeleteDialogOpen(false);
      setSelectedContract(null);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete contract.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const openEditDialog = (contract: Contract) => {
    setSelectedContract(contract);
    setEditDialogOpen(true);
  };

  return (
    <>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {contracts.map((contract) => (
          <Card key={contract.id} className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{contract.title}</CardTitle>
                <Badge variant={contract.status === 'Active' ? 'default' : 
                              contract.status === 'Draft' ? 'secondary' : 'destructive'}>
                  {contract.status}
                </Badge>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Building className="h-4 w-4" />
                <span>{contract.vendorName}</span>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>Start: {new Date(contract.startDate).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>End: {new Date(contract.endDate).toLocaleDateString()}</span>
                </div>
              </div>
              
              <div className="flex items-center gap-2 text-sm">
                <DollarSign className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">${contract.value?.toLocaleString() || 0}</span>
              </div>
              
              <div className="flex items-center gap-2 pt-2 border-t">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => {
                    setSelectedContract(contract);
                    setViewDialogOpen(true);
                  }}
                >
                  <Eye className="h-4 w-4 mr-2" />
                  View
                </Button>
                
                <Button variant="outline" size="sm" onClick={() => openEditDialog(contract)}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Button>
                
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="text-red-600 hover:text-red-700"
                  onClick={() => openDeleteDialog(contract)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      
      {contracts.length === 0 && (
        <div className="text-center py-8">
          <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">No contracts found</p>
        </div>
      )}

      {/* View Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Contract Details</DialogTitle>
            <DialogDescription>
              Review the details of the contract.
            </DialogDescription>
          </DialogHeader>
          {selectedContract && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Title</Label>
                  <p className="text-sm mt-1">{selectedContract.title}</p>
                </div>
                <div>
                  <Label>Status</Label>
                  <div className="mt-1">
                    <Badge variant={selectedContract.status === 'Active' ? 'default' : 
                                  selectedContract.status === 'Draft' ? 'secondary' : 'destructive'}>
                      {selectedContract.status}
                    </Badge>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Vendor</Label>
                  <p className="text-sm mt-1">{selectedContract.vendorName}</p>
                </div>
                <div>
                  <Label>Value</Label>
                  <p className="text-sm font-medium mt-1">${selectedContract.value?.toLocaleString() || 0}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Start Date</Label>
                  <p className="text-sm mt-1">{new Date(selectedContract.startDate).toLocaleDateString()}</p>
                </div>
                <div>
                  <Label>End Date</Label>
                  <p className="text-sm mt-1">{new Date(selectedContract.endDate).toLocaleDateString()}</p>
                </div>
              </div>
              
              {selectedContract.description && (
                <div>
                  <Label>Description</Label>
                  <p className="text-sm mt-1 text-muted-foreground">{selectedContract.description}</p>
                </div>
              )}

              <div className="flex justify-end pt-4 gap-2">
                 <Button variant="outline" onClick={() => downloadContractPDF(selectedContract)}>
                    <Download className="h-4 w-4 mr-2" />
                    Download PDF
                 </Button>
                 <Button onClick={() => setViewDialogOpen(false)}>Close</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <EditContractDialog 
        contract={selectedContract} 
        open={editDialogOpen} 
        onOpenChange={setEditDialogOpen} 
        onContractUpdated={onContractUpdated}
      />
      
      {/* Delete Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the contract "{selectedContract?.title}" and all associated data listed below.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {associatedInvoices.length > 0 && (
            <div className="mt-4">
              <h4 className="font-semibold mb-2">Associated Invoices to be Deleted:</h4>
              <ScrollArea className="h-32 w-full rounded-md border p-2">
                <ul className="space-y-1">
                  {associatedInvoices.map(invoice => (
                    <li key={invoice.id} className="text-sm flex items-center gap-2">
                      <Receipt className="h-4 w-4 text-muted-foreground"/>
                      <span>{invoice.invoiceNumber} - ${invoice.invoiceAmount}</span>
                    </li>
                  ))}
                </ul>
              </ScrollArea>
            </div>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} disabled={isDeleting} className="bg-red-600 hover:bg-red-700">
              {isDeleting ? "Deleting..." : "Continue"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

// Edit Contract Dialog Component
function EditContractDialog({ 
  contract, 
  open, 
  onOpenChange, 
  onContractUpdated 
}: { 
  contract: Contract | null, 
  open: boolean, 
  onOpenChange: (open: boolean) => void,
  onContractUpdated: (contract: Contract) => void 
}) {
  const [formData, setFormData] = useState<Partial<Contract>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const { toast } = useToast();
  const contractStatuses: ContractStatus[] = ['Draft', 'Active', 'Pending', 'Expired', 'Terminated', 'Suspended'];

  useEffect(() => {
    if (contract) {
      setFormData({
        ...contract,
        startDate: new Date(contract.startDate).toISOString().split('T')[0],
        endDate: new Date(contract.endDate).toISOString().split('T')[0],
      });
    }
  }, [contract]);

  useEffect(() => {
    if (open) {
      fetchVendors().then(setVendors);
    }
  }, [open]);

  const handleInputChange = (field: keyof Contract, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleVendorChange = (vendorId: string) => {
    const selectedVendor = vendors.find(v => v.id === vendorId);
    if (selectedVendor) {
      setFormData(prev => ({
        ...prev,
        vendorId: selectedVendor.id,
        vendorName: selectedVendor.name,
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contract) return;

    setIsSaving(true);
    try {
      const response = await fetch(`/api/contracts/${contract.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update contract');
      }

      const updatedContract = await response.json();

      toast({
        title: "Success",
        description: "Contract updated successfully.",
      });
      onOpenChange(false);
      onContractUpdated(updatedContract);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
      toast({
        title: "Error",
        description: `Failed to update contract: ${errorMessage}`,
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (!contract) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Contract</DialogTitle>
          <DialogDescription>Update the details for "{contract.title}"</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div>
            <Label htmlFor="title">Title</Label>
            <Input id="title" value={formData.title || ''} onChange={(e) => handleInputChange('title', e.target.value)} />
          </div>
          
          <div>
            <Label htmlFor="vendor">Vendor</Label>
            <Select value={formData.vendorId} onValueChange={handleVendorChange}>
              <SelectTrigger id="vendor">
                <SelectValue placeholder="Select vendor" />
              </SelectTrigger>
              <SelectContent>
                {vendors.map((vendor) => (
                  <SelectItem key={vendor.id} value={vendor.id}>{vendor.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="value">Value</Label>
              <Input id="value" type="number" value={formData.value || 0} onChange={(e) => handleInputChange('value', parseFloat(e.target.value))} />
            </div>
            <div>
              <Label htmlFor="status">Status</Label>
              <Select value={formData.status} onValueChange={(value) => handleInputChange('status', value)}>
                <SelectTrigger id="status">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  {contractStatuses.map((status) => (
                    <SelectItem key={status} value={status}>{status}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="startDate">Start Date</Label>
              <Input id="startDate" type="date" value={formData.startDate || ''} onChange={(e) => handleInputChange('startDate', e.target.value)} />
            </div>
            <div>
              <Label htmlFor="endDate">End Date</Label>
              <Input id="endDate" type="date" value={formData.endDate || ''} onChange={(e) => handleInputChange('endDate', e.target.value)} />
            </div>
          </div>
          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" value={formData.description || ''} onChange={(e) => handleInputChange('description', e.target.value)} />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? <Save className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              Save Changes
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}


function ContractsPageSkeleton() {
  return (
    <div className="space-y-6">
       <PageHeader title="Contracts" description="Manage and track all your vendor contracts">
        <div className="flex items-center gap-2">
          <Skeleton className="h-9 w-28" />
          <Skeleton className="h-9 w-32" />
        </div>
      </PageHeader>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-4 w-24" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-12" />
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="space-y-4">
         <div className="flex justify-between">
            <Skeleton className="h-10 w-96" />
            <Skeleton className="h-10 w-64" />
         </div>
         <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({length: 6}).map((_, i) => (
                <Card key={i}>
                    <CardHeader>
                        <Skeleton className="h-5 w-4/5" />
                        <Skeleton className="h-4 w-2/5" />
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-1/2" />
                        <div className="flex gap-2 pt-2 border-t">
                            <Skeleton className="h-8 w-20" />
                            <Skeleton className="h-8 w-20" />
                            <Skeleton className="h-8 w-8" />
                        </div>
                    </CardContent>
                </Card>
            ))}
         </div>
      </div>
    </div>
  );
}
