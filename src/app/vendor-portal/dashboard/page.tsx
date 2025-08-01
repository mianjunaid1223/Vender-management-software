'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { 
  Building2, 
  FileText, 
  MessageSquare, 
  Settings, 
  LogOut,
  Home,
  FileInvoice,
  Users,
  BarChart2
} from 'lucide-react';

interface VendorData {
  id: string;
  name: string;
  email: string;
  status: string;
  applicationId: string;
}

export default function VendorDashboard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [vendor, setVendor] = useState<VendorData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    const fetchVendorData = async () => {
      try {
        const token = searchParams.get('token');
        const email = searchParams.get('email');
        
        if (!token && !email) {
          router.push('/vendor-portal');
          return;
        }

        const response = await fetch(`/api/vendor/status?${token ? `token=${token}` : `email=${email}`}`);
        const data = await response.json();

        if (data.approved && data.vendor) {
          setVendor(data.vendor);
          // Store vendor token in localStorage for future requests
          if (token) {
            localStorage.setItem('vendorToken', token);
          }
        } else {
          toast({
            title: 'Access Denied',
            description: 'Your vendor account is not approved or the link is invalid.',
            variant: 'destructive',
          });
          router.push('/vendor-portal');
        }
      } catch (error) {
        console.error('Error fetching vendor data:', error);
        toast({
          title: 'Error',
          description: 'Failed to load vendor information. Please try again later.',
          variant: 'destructive',
        });
        router.push('/vendor-portal');
      } finally {
        setIsLoading(false);
      }
    };

    fetchVendorData();
  }, [router, searchParams, toast]);

  const handleLogout = () => {
    localStorage.removeItem('vendorToken');
    router.push('/vendor-portal');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!vendor) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 p-4">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Vendor Not Found</h2>
          <p className="text-gray-600 mb-6">We couldn't find your vendor account. Please contact support.</p>
          <Button onClick={() => router.push('/vendor-portal')}>
            Return to Portal
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <Building2 className="h-8 w-8 text-blue-600" />
            <h1 className="text-xl font-bold text-gray-900">Vendor Portal</h1>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-600">Signed in as {vendor.name}</span>
            <Button variant="outline" size="sm" onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row gap-8">
          {/* Sidebar */}
          <aside className="w-full md:w-64 flex-shrink-0">
            <nav className="space-y-1">
              <button
                onClick={() => setActiveTab('overview')}
                className={`w-full flex items-center px-4 py-2 text-sm font-medium rounded-md ${activeTab === 'overview' ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-50'}`}
              >
                <Home className="mr-3 h-5 w-5 text-gray-500" />
                Overview
              </button>
              <button
                onClick={() => setActiveTab('invoices')}
                className={`w-full flex items-center px-4 py-2 text-sm font-medium rounded-md ${activeTab === 'invoices' ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-50'}`}
              >
                <FileInvoice className="mr-3 h-5 w-5 text-gray-500" />
                Invoices
              </button>
              <button
                onClick={() => setActiveTab('profile')}
                className={`w-full flex items-center px-4 py-2 text-sm font-medium rounded-md ${activeTab === 'profile' ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-50'}`}
              >
                <Users className="mr-3 h-5 w-5 text-gray-500" />
                Profile
              </button>
              <button
                onClick={() => setActiveTab('reports')}
                className={`w-full flex items-center px-4 py-2 text-sm font-medium rounded-md ${activeTab === 'reports' ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-50'}`}
              >
                <BarChart2 className="mr-3 h-5 w-5 text-gray-500" />
                Reports
              </button>
              <button
                onClick={() => setActiveTab('settings')}
                className={`w-full flex items-center px-4 py-2 text-sm font-medium rounded-md ${activeTab === 'settings' ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-50'}`}
              >
                <Settings className="mr-3 h-5 w-5 text-gray-500" />
                Settings
              </button>
            </nav>
          </aside>

          {/* Main Content Area */}
          <div className="flex-1">
            {activeTab === 'overview' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">Welcome back, {vendor.name}!</h2>
                  <p className="mt-1 text-sm text-gray-500">Here's what's happening with your vendor account.</p>
                </div>

                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Account Status</CardTitle>
                      <div className="h-4 w-4 rounded-full bg-green-500"></div>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">Active</div>
                      <p className="text-xs text-muted-foreground">Your vendor account is active</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Pending Invoices</CardTitle>
                      <FileText className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">3</div>
                      <p className="text-xs text-muted-foreground">Awaiting approval</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Next Payment</CardTitle>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        className="h-4 w-4 text-muted-foreground"
                      >
                        <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                      </svg>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">$2,500.00</div>
                      <p className="text-xs text-muted-foreground">Due in 15 days</p>
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle>Recent Activity</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {[1, 2, 3].map((item) => (
                        <div key={item} className="flex items-start pb-4 border-b last:border-0 last:pb-0">
                          <div className="h-2 w-2 rounded-full bg-blue-500 mt-2 mr-3"></div>
                          <div>
                            <p className="text-sm font-medium">Invoice #{1000 + item} was approved</p>
                            <p className="text-sm text-muted-foreground">2 days ago</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {activeTab === 'invoices' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">Invoices</h2>
                  <p className="mt-1 text-sm text-gray-500">View and manage your invoices.</p>
                </div>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center text-muted-foreground py-8">
                      <FileText className="mx-auto h-12 w-12 text-gray-400" />
                      <h3 className="mt-2 text-sm font-medium text-gray-900">No invoices yet</h3>
                      <p className="mt-1 text-sm text-gray-500">Get started by creating a new invoice.</p>
                      <div className="mt-6">
                        <Button>
                          <FileText className="-ml-1 mr-2 h-5 w-5" />
                          New Invoice
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {activeTab === 'profile' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">Profile</h2>
                  <p className="mt-1 text-sm text-gray-500">Update your vendor profile information.</p>
                </div>
                <Card>
                  <CardContent className="pt-6">
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                        <div>
                          <label htmlFor="company-name" className="block text-sm font-medium text-gray-700">
                            Company Name
                          </label>
                          <input
                            type="text"
                            id="company-name"
                            defaultValue={vendor.name}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                          />
                        </div>
                        <div>
                          <label htmlFor="contact-email" className="block text-sm font-medium text-gray-700">
                            Contact Email
                          </label>
                          <input
                            type="email"
                            id="contact-email"
                            defaultValue={vendor.email}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                          />
                        </div>
                      </div>
                      <div className="flex justify-end">
                        <Button>Save Changes</Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {activeTab === 'reports' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">Reports</h2>
                  <p className="mt-1 text-sm text-gray-500">View and download your reports.</p>
                </div>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center text-muted-foreground py-8">
                      <BarChart2 className="mx-auto h-12 w-12 text-gray-400" />
                      <h3 className="mt-2 text-sm font-medium text-gray-900">No reports available</h3>
                      <p className="mt-1 text-sm text-gray-500">Check back later for your reports.</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {activeTab === 'settings' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">Settings</h2>
                  <p className="mt-1 text-sm text-gray-500">Manage your account settings.</p>
                </div>
                <Card>
                  <CardContent className="pt-6">
                    <div className="space-y-6">
                      <div>
                            <h3 className="text-lg font-medium">Account</h3>
                            <p className="text-sm text-muted-foreground">
                              Update your account settings and preferences.
                            </p>
                          </div>
                          <div className="space-y-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700">Email</label>
                              <p className="mt-1 text-sm text-gray-900">{vendor.email}</p>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700">Account Status</label>
                              <div className="mt-1 flex items-center">
                                <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                                  Active
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="pt-4 border-t">
                            <h3 className="text-lg font-medium">Danger Zone</h3>
                            <p className="text-sm text-muted-foreground">
                              These actions are irreversible. Proceed with caution.
                            </p>
                            <div className="mt-4">
                              <Button variant="destructive" onClick={handleLogout}>
                                <LogOut className="mr-2 h-4 w-4" />
                                Sign Out
                              </Button>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <p className="text-center text-sm text-gray-500">
            &copy; {new Date().getFullYear()} Vendor Portal. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
