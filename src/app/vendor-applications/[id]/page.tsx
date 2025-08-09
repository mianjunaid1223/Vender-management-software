'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  Building2,
  Calendar,
  AlertCircle,
  Loader2,
  ArrowLeft
} from 'lucide-react';

interface ApplicationData {
  applicationId: string;
  status: string;
  submittedAt: string;
  vendorName: string;
  message: string;
}

export default function VendorApplicationStatusPage() {
  const params = useParams();
  const [application, setApplication] = useState<ApplicationData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const applicationId = params.id as string;

  useEffect(() => {
    const fetchApplication = async () => {
      try {
        const response = await fetch(`/api/vendor-applications/${applicationId}/public`);
        const data = await response.json();

        if (response.ok) {
          setApplication(data);
        } else {
          setError(data.error || 'Application not found');
        }
      } catch (err) {
        setError('Failed to load application status');
      } finally {
        setIsLoading(false);
      }
    };

    if (applicationId) {
      fetchApplication();
    }
  }, [applicationId]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="h-16 w-16 text-green-600" />;
      case 'rejected':
        return <XCircle className="h-16 w-16 text-red-600" />;
      case 'pending':
        return <Clock className="h-16 w-16 text-yellow-600" />;
      default:
        return <AlertCircle className="h-16 w-16 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'rejected':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (e) {
      return 'Unknown';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md text-center">
          <CardContent className="pt-6">
            <Loader2 className="h-16 w-16 text-blue-600 mx-auto mb-4 animate-spin" />
            <h1 className="text-xl font-medium mb-2">Loading Application Status...</h1>
            <p className="text-muted-foreground">
              Please wait while we fetch your application details.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md text-center border-red-200">
          <CardContent className="pt-6">
            <AlertCircle className="h-16 w-16 text-red-600 mx-auto mb-4" />
            <h1 className="text-xl font-bold mb-2 text-red-600">Application Not Found</h1>
            <p className="text-muted-foreground mb-6">{error}</p>
            <Button onClick={() => window.history.back()} variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Go Back
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!application) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center pb-4">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Building2 className="h-8 w-8 text-blue-600" />
            <CardTitle className="text-2xl">Vendor Application Status</CardTitle>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Status Icon and Badge */}
          <div className="text-center space-y-4">
            {getStatusIcon(application.status)}
            <Badge className={`text-lg px-4 py-2 ${getStatusColor(application.status)}`}>
              {application.status.charAt(0).toUpperCase() + application.status.slice(1)}
            </Badge>
          </div>

          {/* Application Details */}
          <div className="bg-gray-50 p-6 rounded-lg space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-600">Application ID</label>
                <p className="text-lg font-mono">{application.applicationId}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Vendor Name</label>
                <p className="text-lg">{application.vendorName}</p>
              </div>
              <div className="md:col-span-2">
                <label className="text-sm font-medium text-gray-600">Submitted Date</label>
                <div className="flex items-center gap-2 text-lg">
                  <Calendar className="h-4 w-4 text-gray-500" />
                  <span>{formatDate(application.submittedAt)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Status Message */}
          <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
            <h3 className="font-medium text-blue-900 mb-2">Status Update</h3>
            <p className="text-blue-800">{application.message}</p>
          </div>

          {/* Actions */}
          <div className="text-center space-y-3">
            {application.status === 'approved' && (
              <Button 
                className="bg-green-600 hover:bg-green-700 text-white"
                onClick={() => window.location.href = '/vendor-portal/dashboard'}
              >
                Access Vendor Portal
              </Button>
            )}
            
            <div className="text-sm text-gray-500">
              Need help? Contact the company administrator for assistance.
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
