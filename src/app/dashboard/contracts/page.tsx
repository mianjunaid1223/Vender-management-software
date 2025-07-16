
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
  Clock,
  Receipt,
  MoreHorizontal,
  Printer,
  ChevronDown,
  User,
  Users,
  Briefcase
} from "lucide-react";
import { fetchContracts, deleteContract, fetchInvoicesByContract, fetchVendors, fetchCompany, updateContract } from "@/lib/data";
import { Contract, Invoice, ContractStatus, Vendor, Company, ContractParty, ContractType } from "@/lib/types";
import { downloadContractPDF, previewContractPDF } from "@/lib/pdf-utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent
} from "@/components/ui/dropdown-menu";
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
import { cn } from "@/lib/utils";

export default function ContractsPage() {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const { toast } = useToast();

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      const [contractsData, vendorsData, companyData] = await Promise.all([
        fetch('/api/contracts').then(res => {
          if (!res.ok) throw new Error('Failed to fetch contracts');
          return res.json();
        }),
        fetchVendors(),
        fetchCompany()
      ]);
      setContracts(contractsData);
      setVendors(vendorsData);
      setCompany(companyData);
    } catch (err) {
      console.error("Error loading initial data:", err);
      toast({
        title: "Error",
        description: "Failed to load initial data.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleContractAddedOrUpdated = (updatedContract: Contract) => {
    setContracts(prev => {
        const index = prev.findIndex(c => c.id === updatedContract.id);
        if (index > -1) {
            const newContracts = [...prev];
            newContracts[index] = updatedContract;
            return newContracts;
        }
        return [updatedContract, ...prev];
    });
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
        contract.partyA?.name?.toLowerCase().includes(lowerCaseSearchTerm) ||
        contract.partyB?.name?.toLowerCase().includes(lowerCaseSearchTerm)
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
          <ContractOnboardingDialog 
            vendors={vendors} 
            company={company}
            onContractAdded={handleContractAddedOrUpdated}
          />
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
          vendors={vendors}
          company={company}
          onContractDeleted={handleContractDeleted}
          onContractUpdated={handleContractAddedOrUpdated}
        />
      </Tabs>
    </div>
  );
}

function ContractsGrid({ 
  contracts, 
  vendors,
  company,
  onContractDeleted,
  onContractUpdated
}: { 
  contracts: Contract[], 
  vendors: Vendor[],
  company: Company | null,
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

  const getStatusColor = (status: ContractStatus) => {
    switch (status) {
      case 'Active': return 'bg-green-100 text-green-800 border-green-200';
      case 'Draft': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Expired': return 'bg-red-100 text-red-800 border-red-200';
      case 'Pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Terminated': return 'bg-gray-200 text-gray-800 border-gray-300';
      case 'Suspended': return 'bg-orange-100 text-orange-800 border-orange-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const contractStatuses: ContractStatus[] = ['Draft', 'Active', 'Pending', 'Expired', 'Terminated', 'Suspended'];

  const handleChangeStatus = async (contract: Contract, status: ContractStatus) => {
    try {
      const updated = await updateContract(contract.id, { ...contract, status });
      onContractUpdated(updated);
      toast({ title: 'Status Updated', description: `Contract status changed to ${status}.` });
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to update contract status.', variant: 'destructive' });
    }
  };
  
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
  
  const getPartyInfo = (party?: ContractParty) => {
    if (!party) return null;
    return (
      <div className="flex items-center gap-2">
        <div className="flex items-center justify-center h-6 w-6 rounded-full bg-muted text-muted-foreground">
            {party.role === 'Client' ? <User className="h-4 w-4"/> : <Briefcase className="h-4 w-4"/>}
        </div>
        <div>
            <div className="text-sm font-medium">{party.name}</div>
            <div className="text-xs text-muted-foreground">{party.role}</div>
        </div>
      </div>
    );
  };

  return (
    <>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {contracts.map((contract) => (
          <Card key={contract.id} className="flex flex-col">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                 <Badge variant="outline" className={cn("capitalize", getStatusColor(contract.status))}>
                    {contract.status}
                </Badge>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => { setSelectedContract(contract); setViewDialogOpen(true); }}>
                      <Eye className="mr-2 h-4 w-4" /> View Details
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => openEditDialog(contract)}>
                      <Edit className="mr-2 h-4 w-4" /> Edit Contract
                    </DropdownMenuItem>
                    <DropdownMenuSub>
                        <DropdownMenuSubTrigger>
                            <ChevronDown className="mr-2 h-4 w-4" /> Change Status
                        </DropdownMenuSubTrigger>
                        <DropdownMenuSubContent>
                            {contractStatuses.map(status => (
                                <DropdownMenuItem key={status} onSelect={() => handleChangeStatus(contract, status)} disabled={contract.status === status}>
                                    {status}
                                </DropdownMenuItem>
                            ))}
                        </DropdownMenuSubContent>
                    </DropdownMenuSub>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={async () => downloadContractPDF(await contract)}>
                      <Download className="mr-2 h-4 w-4" /> Download PDF
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={async () => previewContractPDF(await contract)}>
                      <Printer className="mr-2 h-4 w-4" /> Preview PDF
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => openDeleteDialog(contract)} className="text-red-500">
                      <Trash2 className="mr-2 h-4 w-4" /> Delete Contract
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <CardTitle className="text-lg pt-2">{contract.title}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 flex-grow">
              <div className="space-y-3">
                {getPartyInfo(contract.partyA)}
                {getPartyInfo(contract.partyB)}
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm pt-4 border-t">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>{new Date(contract.startDate).toLocaleDateString()} - {new Date(contract.endDate).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center gap-2 font-medium">
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                  <span>{contract.value?.toLocaleString() || 0} {contract.currency}</span>
                </div>
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
            <div className="space-y-4 py-4 max-h-[70vh] overflow-y-auto pr-4">
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Title</Label><p className="text-sm mt-1">{selectedContract.title}</p></div>
                <div><Label>Status</Label><div className="mt-1"><Badge variant={selectedContract.status === 'Active' ? 'default' : selectedContract.status === 'Draft' ? 'secondary' : 'destructive'}>{selectedContract.status}</Badge></div></div>
                {selectedContract.partyA && <div><Label>Party A ({selectedContract.partyA.role})</Label><p className="text-sm mt-1">{selectedContract.partyA.name}</p></div>}
                {selectedContract.partyB && <div><Label>Party B ({selectedContract.partyB.role})</Label><p className="text-sm mt-1">{selectedContract.partyB.name}</p></div>}
                <div><Label>Value</Label><p className="text-sm font-medium mt-1">${selectedContract.value?.toLocaleString() || 0} {selectedContract.currency}</p></div>
                <div><Label>Contract Type</Label><p className="text-sm mt-1">{selectedContract.type}</p></div>
                <div><Label>Start Date</Label><p className="text-sm mt-1">{new Date(selectedContract.startDate).toLocaleDateString()}</p></div>
                <div><Label>End Date</Label><p className="text-sm mt-1">{new Date(selectedContract.endDate).toLocaleDateString()}</p></div>
                <div><Label>Payment Terms</Label><p className="text-sm mt-1">{selectedContract.paymentTerms}</p></div>
              </div>
              
              {selectedContract.description && (<div><Label>Description</Label><p className="text-sm mt-1 text-muted-foreground">{selectedContract.description}</p></div>)}
              {selectedContract.termsAndConditions && (<div><Label>Terms & Conditions</Label><p className="text-sm mt-1 text-muted-foreground">{selectedContract.termsAndConditions}</p></div>)}

              <div className="flex items-center gap-2">
                <Label>Auto-renew:</Label>
                <Badge variant={selectedContract.autoRenew ? "default" : "secondary"}>
                  {selectedContract.autoRenew ? 'Yes' : 'No'}
                </Badge>
                {selectedContract.autoRenew && <p className="text-sm text-muted-foreground">(Renews every {selectedContract.renewalPeriod} months)</p>}
              </div>

              <div className="flex justify-end pt-4 gap-2">
                 <Button variant="outline" onClick={async () => downloadContractPDF(await selectedContract)}>
                    <Download className="h-4 w-4 mr-2" />
                    Download PDF
                 </Button>
                 <Button variant="outline" onClick={async () => previewContractPDF(await selectedContract)}>
                    <Printer className="h-4 w-4 mr-2" />
                    Preview PDF
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
        vendors={vendors}
        company={company}
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
  onContractUpdated,
  vendors,
  company
}: { 
  contract: Contract | null, 
  open: boolean, 
  onOpenChange: (open: boolean) => void,
  onContractUpdated: (contract: Contract) => void,
  vendors: Vendor[],
  company: Company | null,
}) {
  const [formData, setFormData] = useState<Partial<Contract>>({});
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();
  const contractStatuses: ContractStatus[] = ['Draft', 'Active', 'Pending', 'Expired', 'Terminated', 'Suspended'];
  const contractTypes: ContractType[] = ['Service', 'Product', 'Subscription', 'One-time', 'Framework'];

  useEffect(() => {
    if (contract) {
      setFormData({
        ...contract,
        startDate: new Date(contract.startDate).toISOString().split('T')[0],
        endDate: new Date(contract.endDate).toISOString().split('T')[0],
      });
    }
  }, [contract]);

  const handleInputChange = (field: keyof Contract, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handlePartyRoleChange = (party: 'partyA' | 'partyB', newRole: 'Client' | 'Provider') => {
    const otherParty = party === 'partyA' ? 'partyB' : 'partyA';
    setFormData(prev => ({
      ...prev,
      [party]: { ...prev[party], role: newRole },
      [otherParty]: { ...prev[otherParty], role: newRole === 'Client' ? 'Provider' : 'Client' }
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contract || !formData.id) return;

    setIsSaving(true);
    try {
      const updatedContract = await updateContract(formData.id, formData);

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
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Edit Contract</DialogTitle>
          <DialogDescription>Update the details for "{contract.title}"</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6 py-4 max-h-[70vh] overflow-y-auto pr-4">
          
          {/* Basic Info */}
          <div className="space-y-4 p-4 border rounded-lg">
            <h3 className="font-medium">Basic Information</h3>
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input id="title" value={formData.title || ''} onChange={(e) => handleInputChange('title', e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="type">Contract Type</Label>
                <Select value={formData.type} onValueChange={(value) => handleInputChange('type', value)}>
                  <SelectTrigger id="type"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {contractTypes.map(type => <SelectItem key={type} value={type}>{type}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
               <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select value={formData.status} onValueChange={(value) => handleInputChange('status', value)}>
                  <SelectTrigger id="status"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {contractStatuses.map((status) => <SelectItem key={status} value={status}>{status}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
             <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea id="description" value={formData.description || ''} onChange={(e) => handleInputChange('description', e.target.value)} />
            </div>
          </div>

          {/* Parties */}
          <div className="space-y-4 p-4 border rounded-lg">
            <h3 className="font-medium">Parties</h3>
            <div className="grid grid-cols-2 gap-4">
              {formData.partyA && <div className="space-y-2">
                  <Label>Party A: {formData.partyA.name}</Label>
                   <Select value={formData.partyA.role} onValueChange={(role: 'Client' | 'Provider') => handlePartyRoleChange('partyA', role)}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="Client">Client</SelectItem>
                            <SelectItem value="Provider">Provider</SelectItem>
                        </SelectContent>
                    </Select>
              </div>}
              {formData.partyB && <div className="space-y-2">
                  <Label>Party B: {formData.partyB.name}</Label>
                   <Select value={formData.partyB.role} onValueChange={(role: 'Client' | 'Provider') => handlePartyRoleChange('partyB', role)}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="Client">Client</SelectItem>
                            <SelectItem value="Provider">Provider</SelectItem>
                        </SelectContent>
                    </Select>
              </div>}
            </div>
          </div>

          {/* Financial Details */}
          <div className="space-y-4 p-4 border rounded-lg">
            <h3 className="font-medium">Financial Details</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="value">Value</Label>
                <Input id="value" type="number" value={formData.value || 0} onChange={(e) => handleInputChange('value', parseFloat(e.target.value))} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="currency">Currency</Label>
                <Input id="currency" value={formData.currency || 'USD'} onChange={(e) => handleInputChange('currency', e.target.value)} />
              </div>
            </div>
             <div className="space-y-2">
              <Label htmlFor="paymentTerms">Payment Terms</Label>
              <Input id="paymentTerms" value={formData.paymentTerms || ''} onChange={(e) => handleInputChange('paymentTerms', e.target.value)} />
            </div>
          </div>

          {/* Timeline */}
          <div className="space-y-4 p-4 border rounded-lg">
            <h3 className="font-medium">Timeline & Renewal</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startDate">Start Date</Label>
                <Input id="startDate" type="date" value={formData.startDate || ''} onChange={(e) => handleInputChange('startDate', e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endDate">End Date</Label>
                <Input id="endDate" type="date" value={formData.endDate || ''} onChange={(e) => handleInputChange('endDate', e.target.value)} />
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="autoRenew"
                checked={formData.autoRenew || false}
                onChange={(e) => handleInputChange('autoRenew', e.target.checked)}
                className="rounded border-gray-300"
              />
              <Label htmlFor="autoRenew">Auto-renew this contract</Label>
            </div>
             {formData.autoRenew && (
              <div className="space-y-2">
                <Label htmlFor="renewalPeriod">Renewal Period (months)</Label>
                <Input
                  id="renewalPeriod"
                  type="number"
                  value={formData.renewalPeriod || 12}
                  onChange={(e) => handleInputChange('renewalPeriod', Number(e.target.value))}
                  min="1"
                />
              </div>
            )}
          </div>
          
          <div className="flex justify-end gap-2 pt-4">
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
