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
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
  X
} from "lucide-react";
import { fetchContracts, fetchExpiringContracts } from "@/lib/data";

export default function ContractsPage() {
  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("all");

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
    } finally {
      setLoading(false);
    }
  };

  const handleExportContracts = () => {
    const filteredContracts = getFilteredContracts();
    const csvContent = convertToCSV(filteredContracts);
    downloadCSV(csvContent, "contracts.csv");
  };

  const convertToCSV = (data) => {
    const headers = ['Title', 'Vendor', 'Status', 'Value'];
    const csvRows = [headers.join(',')];
    
    data.forEach(contract => {
      const row = [
        contract.title || '',
        contract.vendor || '',
        contract.status || '',
        contract.value || 0
      ];
      csvRows.push(row.join(','));
    });
    
    return csvRows.join('\n');
  };

  const downloadCSV = (content, filename) => {
    const blob = new Blob([content], { type: 'text/csv' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
  };

  const getFilteredContracts = () => {
    let filtered = contracts;
    
    if (activeTab === "active") filtered = contracts.filter(c => c.status === 'Active');
    else if (activeTab === "draft") filtered = contracts.filter(c => c.status === 'Draft');
    else if (activeTab === "expired") filtered = contracts.filter(c => c.status === 'Expired');
    
    if (searchTerm) {
      filtered = filtered.filter(contract => 
        contract.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        contract.vendor?.toLowerCase().includes(searchTerm.toLowerCase())
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
            Export
          </Button>
          <ContractAddButton />
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
            <CardTitle className="text-sm font-medium">Total Contracts</CardTitle>
            <DollarSign className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{contracts.length}</div>
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

        <TabsContent value="all">
          <ContractsGrid contracts={getFilteredContracts()} />
        </TabsContent>

        <TabsContent value="active">
          <ContractsGrid contracts={getFilteredContracts()} />
        </TabsContent>

        <TabsContent value="draft">
          <ContractsGrid contracts={getFilteredContracts()} />
        </TabsContent>

        <TabsContent value="expired">
          <ContractsGrid contracts={getFilteredContracts()} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function ContractsGrid({ contracts }) {
  const [selectedContract, setSelectedContract] = useState(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);

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
                <span>{contract.vendor}</span>
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
          </DialogHeader>
          {selectedContract && (
            <div className="space-y-4">
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
                  <p className="text-sm mt-1">{selectedContract.vendor}</p>
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
                  <p className="text-sm mt-1">{selectedContract.description}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

function ContractsPageSkeleton() {
  return (
    <div className="space-y-6">
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
    </div>
  );
}
