"use client";

import { useState, useEffect } from "react";
import { PageHeader } from "@/components/page-header";
import { ContractAddButton } from "@/components/dashboard/contract-add-button";
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
  Clock
} from "lucide-react";
import { fetchContracts, deleteContract as deleteContractAction } from "@/lib/data";
import { Contract } from "@/lib/types";
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
      const contractsData = await fetchContracts();
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
    
    if (activeTab !== "all") {
        filtered = contracts.filter(c => c.status.toLowerCase() === activeTab);
    }
    
    if (searchTerm) {
      filtered = filtered.filter(contract => 
        contract.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        contract.vendorName?.toLowerCase().includes(searchTerm.toLowerCase())
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
          <ContractAddButton onContractAdded={handleContractAdded} />
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
        <ContractsGrid contracts={getFilteredContracts()} onContractDeleted={handleContractDeleted} />
      </Tabs>
    </div>
  );
}

function ContractsGrid({ contracts, onContractDeleted }: { contracts: Contract[], onContractDeleted: (id: string) => void }) {
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const { toast } = useToast();

  const openDeleteDialog = (contract: Contract) => {
    setSelectedContract(contract);
    setDeleteDialogOpen(true);
  };
  
  const confirmDelete = async () => {
    if (!selectedContract) return;

    setIsDeleting(true);
    try {
      await deleteContractAction(selectedContract.id);
      toast({
        title: "Success",
        description: "Contract deleted successfully.",
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
                
                <Button variant="outline" size="sm">
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
      
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the contract "{selectedContract?.title}" from the database.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} disabled={isDeleting}>
              {isDeleting ? "Deleting..." : "Continue"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
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
