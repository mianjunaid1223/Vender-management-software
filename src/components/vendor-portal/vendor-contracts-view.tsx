'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Contract } from '@/lib/types';
import { VendorInvitation } from '@/lib/vendor-auth';
import { 
  FileText, 
  Calendar, 
  DollarSign, 
  AlertTriangle, 
  CheckCircle, 
  Clock,
  Eye,
  Download
} from 'lucide-react';
import { format } from 'date-fns';

interface VendorContractsViewProps {
  contracts: Contract[];
  canView: boolean;
  canEdit: boolean;
  invitation: VendorInvitation;
}

export function VendorContractsView({ contracts, canView, canEdit, invitation }: VendorContractsViewProps) {
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null);

  if (!canView) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="text-center text-gray-500">
            <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-medium mb-2">Access Restricted</h3>
            <p>You don&apos;t have permission to view contracts.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'expired':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      default:
        return <FileText className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'expired':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'terminated':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const isContractNearExpiry = (endDate: string) => {
    const end = new Date(endDate);
    const now = new Date();
    const daysUntilExpiry = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return daysUntilExpiry <= 30 && daysUntilExpiry > 0;
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <FileText className="h-5 w-5" />
              <div>
                <CardTitle>Contracts</CardTitle>
                <CardDescription>View and manage your contractual agreements</CardDescription>
              </div>
            </div>
            <Badge variant="outline">
              {contracts.length} {contracts.length === 1 ? 'Contract' : 'Contracts'}
            </Badge>
          </div>
        </CardHeader>
      </Card>

      {contracts.length === 0 ? (
        <Card>
          <CardContent className="py-8">
            <div className="text-center text-gray-500">
              <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-medium mb-2">No Contracts Found</h3>
              <p>You don&apos;t have any contracts yet.</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {contracts.map((contract) => (
            <Card key={contract.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      {getStatusIcon(contract.status)}
                      <h3 className="text-lg font-semibold text-gray-900">
                        {contract.title}
                      </h3>
                      <Badge className={getStatusColor(contract.status)}>
                        {contract.status}
                      </Badge>
                      {isContractNearExpiry(contract.endDate) && (
                        <Badge variant="outline" className="text-orange-600 border-orange-600">
                          <AlertTriangle className="h-3 w-3 mr-1" />
                          Expires Soon
                        </Badge>
                      )}
                    </div>

                    <p className="text-gray-600 mb-4 line-clamp-2">
                      {contract.description || 'No description provided'}
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <div className="flex items-center space-x-2">
                        <Calendar className="h-4 w-4 text-gray-400" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">Start Date</p>
                          <p className="text-sm text-gray-600">
                            {format(new Date(contract.startDate), 'MMM dd, yyyy')}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Calendar className="h-4 w-4 text-gray-400" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">End Date</p>
                          <p className="text-sm text-gray-600">
                            {format(new Date(contract.endDate), 'MMM dd, yyyy')}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <DollarSign className="h-4 w-4 text-gray-400" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">Value</p>
                          <p className="text-sm text-gray-600">
                            ${contract.value?.toLocaleString() || 'N/A'}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                      <div className="flex items-center space-x-4 text-sm text-gray-600">
                        <span>Payment Terms: {contract.paymentTerms}</span>
                        {contract.type && <span>Type: {contract.type}</span>}
                      </div>
                      
                      <div className="flex space-x-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => setSelectedContract(contract)}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          View Details
                        </Button>
                        {contract.files && contract.files.length > 0 && (
                          <Button variant="outline" size="sm">
                            <Download className="h-4 w-4 mr-2" />
                            Download
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Contract Details Modal/Expanded View */}
      {selectedContract && (
        <Card className="border-2 border-blue-200 bg-blue-50/30">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center">
                <FileText className="h-5 w-5 mr-2" />
                Contract Details: {selectedContract.title}
              </CardTitle>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setSelectedContract(null)}
              >
                ×
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold mb-2">Contract Information</h4>
                <div className="space-y-2 text-sm">
                  <div><span className="font-medium">Status:</span> {selectedContract.status}</div>
                  <div><span className="font-medium">Type:</span> {selectedContract.type || 'Standard'}</div>
                  <div><span className="font-medium">Currency:</span> {selectedContract.currency || 'USD'}</div>
                  <div><span className="font-medium">Auto-Renew:</span> {selectedContract.autoRenew ? 'Yes' : 'No'}</div>
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Parties</h4>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="font-medium">Party A ({selectedContract.partyA.role}):</span>
                    <br />
                    {selectedContract.partyA.name}
                  </div>
                  <div>
                    <span className="font-medium">Party B ({selectedContract.partyB.role}):</span>
                    <br />
                    {selectedContract.partyB.name}
                  </div>
                </div>
              </div>
            </div>

            {selectedContract.description && (
              <div>
                <h4 className="font-semibold mb-2">Description</h4>
                <p className="text-sm text-gray-700">{selectedContract.description}</p>
              </div>
            )}

            {selectedContract.deliverables && selectedContract.deliverables.length > 0 && (
              <div>
                <h4 className="font-semibold mb-2">Deliverables</h4>
                <ul className="list-disc list-inside text-sm space-y-1">
                  {selectedContract.deliverables.map((deliverable, index) => (
                    <li key={index}>{deliverable}</li>
                  ))}
                </ul>
              </div>
            )}

            {selectedContract.milestones && selectedContract.milestones.length > 0 && (
              <div>
                <h4 className="font-semibold mb-2">Milestones</h4>
                <div className="space-y-2">
                  {selectedContract.milestones.map((milestone, index) => (
                    <div key={index} className="bg-white p-3 rounded-lg border">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium text-sm">{milestone.title}</span>
                        <Badge className={getStatusColor(milestone.status)}>
                          {milestone.status}
                        </Badge>
                      </div>
                      <p className="text-xs text-gray-600 mb-1">{milestone.description}</p>
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span>Due: {format(new Date(milestone.dueDate), 'MMM dd, yyyy')}</span>
                        <span>${milestone.amount.toLocaleString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
