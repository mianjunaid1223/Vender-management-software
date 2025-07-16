"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
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
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  FileText, 
  MoreHorizontal, 
  Edit, 
  Trash2, 
  Eye, 
  Download,
  AlertCircle,
  CheckCircle,
  Clock,
  XCircle,
  Search,
  Filter
} from "lucide-react";
import { Contract, ContractStatus } from "@/lib/types";
import { cn } from "@/lib/utils";
import { ContractOnboardingDialog } from "./contract-onboarding-dialog";

interface ContractsTableProps {
  contracts: Contract[];
}

export function ContractsTable({ contracts }: ContractsTableProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<ContractStatus | "all">("all");
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  const filteredContracts = contracts.filter(contract => {
    const matchesSearch = contract.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         contract.vendorName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || contract.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusIcon = (status: ContractStatus) => {
    switch (status) {
      case 'Active': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'Draft': return <FileText className="h-4 w-4 text-blue-600" />;
      case 'Expired': return <XCircle className="h-4 w-4 text-red-600" />;
      case 'Pending': return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'Terminated': return <XCircle className="h-4 w-4 text-gray-600" />;
      case 'Suspended': return <AlertCircle className="h-4 w-4 text-orange-600" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: ContractStatus) => {
    switch (status) {
      case 'Active': return 'bg-green-100 text-green-800 border-green-200';
      case 'Draft': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Expired': return 'bg-red-100 text-red-800 border-red-200';
      case 'Pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Terminated': return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'Suspended': return 'bg-orange-100 text-orange-800 border-orange-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const handleViewDetails = (contract: Contract) => {
    setSelectedContract(contract);
    setShowDetails(true);
  };

  return (
    <div className="space-y-4">
      {/* Search and Filter */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Contracts</CardTitle>
              <CardDescription>
                Manage and track all your vendor contracts
              </CardDescription>
            </div>
            <ContractOnboardingDialog />
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search contracts..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as ContractStatus | "all")}>
              <SelectTrigger className="w-[180px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="Active">Active</SelectItem>
                <SelectItem value="Draft">Draft</SelectItem>
                <SelectItem value="Pending">Pending</SelectItem>
                <SelectItem value="Expired">Expired</SelectItem>
                <SelectItem value="Terminated">Terminated</SelectItem>
                <SelectItem value="Suspended">Suspended</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Contract</TableHead>
                  <TableHead>Vendor</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Value</TableHead>
                  <TableHead>Start Date</TableHead>
                  <TableHead>End Date</TableHead>
                  <TableHead className="w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredContracts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <div className="flex flex-col items-center gap-2">
                        <FileText className="h-8 w-8 text-muted-foreground" />
                        <p className="text-muted-foreground">No contracts found</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredContracts.map((contract) => (
                    <TableRow key={contract.id}>
                      <TableCell>
                        <div className="font-medium">{contract.title}</div>
                        <div className="text-sm text-muted-foreground">
                          {contract.type || 'Service'}
                        </div>
                      </TableCell>
                      <TableCell>{contract.vendorName}</TableCell>
                      <TableCell>
                        <Badge className={cn("inline-flex items-center gap-1", getStatusColor(contract.status))}>
                          {getStatusIcon(contract.status)}
                          {contract.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{formatCurrency(contract.value)}</TableCell>
                      <TableCell>{formatDate(contract.startDate)}</TableCell>
                      <TableCell>{formatDate(contract.endDate)}</TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <span className="sr-only">Open menu</span>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => handleViewDetails(contract)}>
                              <Eye className="mr-2 h-4 w-4" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Edit className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Download className="mr-2 h-4 w-4" />
                              Download
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-red-600">
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Contract Details Dialog */}
      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Contract Details</DialogTitle>
            <DialogDescription>
              View contract information and details
            </DialogDescription>
          </DialogHeader>
          {selectedContract && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Contract Title</Label>
                  <p className="text-sm">{selectedContract.title}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Vendor</Label>
                  <p className="text-sm">{selectedContract.vendorName}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Status</Label>
                  <Badge className={cn("inline-flex items-center gap-1", getStatusColor(selectedContract.status))}>
                    {getStatusIcon(selectedContract.status)}
                    {selectedContract.status}
                  </Badge>
                </div>
                <div>
                  <Label className="text-sm font-medium">Value</Label>
                  <p className="text-sm">{formatCurrency(selectedContract.value)}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Start Date</Label>
                  <p className="text-sm">{formatDate(selectedContract.startDate)}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">End Date</Label>
                  <p className="text-sm">{formatDate(selectedContract.endDate)}</p>
                </div>
              </div>
              
              {selectedContract.description && (
                <div>
                  <Label className="text-sm font-medium">Description</Label>
                  <p className="text-sm mt-1">{selectedContract.description}</p>
                </div>
              )}
              
              <div>
                <Label className="text-sm font-medium">Payment Terms</Label>
                <p className="text-sm mt-1">{selectedContract.paymentTerms}</p>
              </div>
              
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setShowDetails(false)}>
                  Close
                </Button>
                <Button>
                  <Edit className="mr-2 h-4 w-4" />
                  Edit Contract
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
