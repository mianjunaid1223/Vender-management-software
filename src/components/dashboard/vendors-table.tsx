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
import { 
  MoreHorizontal, 
  Eye, 
  Edit, 
  Trash2, 
  Search, 
  Building2, 
  Mail, 
  Phone, 
  MapPin,
  FileText,
  Receipt
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { deleteVendor, fetchContractsByVendor, fetchInvoicesByVendor } from "@/lib/database/queries";
import type { Vendor, Contract, Invoice } from "@/lib/types";
import { VendorEditDialog } from "./vendor-edit-dialog";
import { ScrollArea } from "../ui/scroll-area";

interface VendorsTableProps {
  data: Vendor[];
}

export function VendorsTable({ data: initialData }: VendorsTableProps) {
  const [data, setData] = useState(initialData);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);
  const [associatedData, setAssociatedData] = useState<{contracts: Contract[], invoices: Invoice[]}>({contracts: [], invoices: []});
  const [showViewDialog, setShowViewDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const { toast } = useToast();

  const handleVendorUpdate = (updatedVendor: Vendor) => {
    setData(prev => prev.map(v => v.id === updatedVendor.id ? updatedVendor : v));
    setShowEditDialog(false);
  };

  const filteredData = data.filter(vendor => 
    vendor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    vendor.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    vendor.service.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleViewVendor = (vendor: Vendor) => {
    setSelectedVendor(vendor);
    setShowViewDialog(true);
  };

  const handleEditVendor = (vendor: Vendor) => {
    setSelectedVendor(vendor);
    setShowEditDialog(true);
  };

  const handleDeleteVendor = async (vendor: Vendor) => {
    setSelectedVendor(vendor);
    try {
      const [contracts, invoices] = await Promise.all([
        fetchContractsByVendor(vendor.id),
        fetchInvoicesByVendor(vendor.id)
      ]);
      setAssociatedData({ contracts, invoices });
    } catch (error) {
      toast({
        title: "Error",
        description: "Could not fetch associated data for this vendor.",
        variant: "destructive"
      });
      setAssociatedData({ contracts: [], invoices: [] });
    }
    setShowDeleteDialog(true);
  };

  const confirmDelete = async () => {
    if (!selectedVendor) return;
    
    setIsDeleting(true);
    try {
      await deleteVendor(selectedVendor.id);
      setData(prev => prev.filter(v => v.id !== selectedVendor.id));
      toast({
        title: "Success",
        description: "Vendor and all associated data deleted successfully.",
      });
      setShowDeleteDialog(false);
      setSelectedVendor(null);
    } catch (error) {
      console.error('Error deleting vendor:', error);
      toast({
        title: "Error",
        description: "Failed to delete vendor. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'Active':
        return "bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300";
      case 'Inactive':
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/50 dark:text-gray-300";
      case 'Pending':
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300";
      default:
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300";
    }
  };

  const formatAddress = (address?: any) => {
    if (!address) return 'N/A';
    return `${address.city}, ${address.state}`;
  };

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search vendors..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>
      </div>

      {/* Vendors Table */}
      <div className="rounded-lg border shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Vendor</TableHead>
              <TableHead>Service</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Payment Terms</TableHead>
              <TableHead>
                <span className="sr-only">Actions</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredData.map((vendor) => (
              <TableRow key={vendor.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                      <Building2 className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="font-medium">{vendor.name}</div>
                      {vendor.taxId && (
                        <div className="text-sm text-muted-foreground">
                          Tax ID: {vendor.taxId}
                        </div>
                      )}
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline">{vendor.service}</Badge>
                </TableCell>
                <TableCell>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-sm">
                      <Mail className="h-3 w-3 text-muted-foreground" />
                      <span>{vendor.email}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="h-3 w-3 text-muted-foreground" />
                      <span>{vendor.phone}</span>
                    </div>
                    {vendor.contactPerson && (
                      <div className="text-sm text-muted-foreground">
                        Contact: {vendor.contactPerson}
                      </div>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="h-3 w-3 text-muted-foreground" />
                    <span>{formatAddress(vendor.address)}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge className={getStatusColor(vendor.status)}>
                    {vendor.status || 'Active'}
                  </Badge>
                </TableCell>
                <TableCell>
                  <span className="text-sm">{vendor.paymentTerms || 'Net 30'}</span>
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
                      <DropdownMenuItem onClick={() => handleViewVendor(vendor)}>
                        <Eye className="mr-2 h-4 w-4" />
                        View Details
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleEditVendor(vendor)}>
                        <Edit className="mr-2 h-4 w-4" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        onClick={() => handleDeleteVendor(vendor)}
                        className="text-red-600"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        
        {filteredData.length === 0 && (
          <div className="text-center py-8">
            <p className="text-muted-foreground">No vendors found matching your criteria.</p>
          </div>
        )}
      </div>

      {/* View Vendor Dialog */}
      <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Vendor Details</DialogTitle>
          </DialogHeader>
          {selectedVendor && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Name</label>
                  <p className="text-sm text-muted-foreground">{selectedVendor.name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Service</label>
                  <p className="text-sm text-muted-foreground">{selectedVendor.service}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Email</label>
                  <p className="text-sm text-muted-foreground">{selectedVendor.email}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Phone</label>
                  <p className="text-sm text-muted-foreground">{selectedVendor.phone}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Status</label>
                  <Badge className={getStatusColor(selectedVendor.status)}>
                    {selectedVendor.status || 'Active'}
                  </Badge>
                </div>
                <div>
                  <label className="text-sm font-medium">Payment Terms</label>
                  <p className="text-sm text-muted-foreground">{selectedVendor.paymentTerms || 'Net 30'}</p>
                </div>
              </div>
              {selectedVendor.address && (
                <div>
                  <label className="text-sm font-medium">Address</label>
                  <p className="text-sm text-muted-foreground">
                    {selectedVendor.address.street}, {selectedVendor.address.city}, {selectedVendor.address.state} {selectedVendor.address.zipCode}
                  </p>
                </div>
              )}
              {selectedVendor.contactPerson && (
                <div>
                  <label className="text-sm font-medium">Contact Person</label>
                  <p className="text-sm text-muted-foreground">{selectedVendor.contactPerson}</p>
                </div>
              )}
              {selectedVendor.taxId && (
                <div>
                  <label className="text-sm font-medium">Tax ID</label>
                  <p className="text-sm text-muted-foreground">{selectedVendor.taxId}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
      
      {/* Edit Vendor Dialog */}
      {selectedVendor && (
        <VendorEditDialog
          vendor={selectedVendor}
          open={showEditDialog}
          onOpenChange={setShowEditDialog}
          onVendorUpdated={handleVendorUpdate}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the vendor "{selectedVendor?.name}" and all their associated data, as listed below. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {(associatedData.contracts.length > 0 || associatedData.invoices.length > 0) && (
            <div className="mt-4 space-y-4">
              {associatedData.contracts.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-2">Associated Contracts to be Deleted:</h4>
                  <ScrollArea className="h-24 w-full rounded-md border p-2">
                    <ul className="space-y-1">
                      {associatedData.contracts.map(contract => (
                        <li key={contract.id} className="text-sm flex items-center gap-2">
                          <FileText className="h-4 w-4 text-muted-foreground"/>
                          <span>{contract.title}</span>
                        </li>
                      ))}
                    </ul>
                  </ScrollArea>
                </div>
              )}
              {associatedData.invoices.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-2">Associated Invoices to be Deleted:</h4>
                  <ScrollArea className="h-24 w-full rounded-md border p-2">
                    <ul className="space-y-1">
                      {associatedData.invoices.map(invoice => (
                        <li key={invoice.id} className="text-sm flex items-center gap-2">
                           <Receipt className="h-4 w-4 text-muted-foreground"/>
                          <span>{invoice.invoiceNumber} - ${invoice.invoiceAmount}</span>
                        </li>
                      ))}
                    </ul>
                  </ScrollArea>
                </div>
              )}
            </div>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
