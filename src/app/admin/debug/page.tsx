'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function AdminDebugPage() {
  const [vendorId, setVendorId] = useState('68bdd771268cb3a8a06cec58');
  const [companyId, setCompanyId] = useState('68bdcf5b3659db777e755f44');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState('');

  const handleAddPortalAccess = async () => {
    setLoading(true);
    setResult('');

    try {
      const response = await fetch('/api/admin/add-portal-access', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ vendorId, companyId }),
      });

      const data = await response.json();
      
      if (response.ok) {
        setResult(`Success: ${data.message}`);
      } else {
        setResult(`Error: ${data.error}`);
      }
    } catch (error) {
      setResult(`Error: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Admin Debug - Add Portal Access</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="vendorId">Vendor ID</Label>
              <Input
                id="vendorId"
                value={vendorId}
                onChange={(e) => setVendorId(e.target.value)}
              />
            </div>
            
            <div>
              <Label htmlFor="companyId">Company ID</Label>
              <Input
                id="companyId"
                value={companyId}
                onChange={(e) => setCompanyId(e.target.value)}
              />
            </div>

            <Button 
              onClick={handleAddPortalAccess} 
              disabled={loading}
              className="w-full"
            >
              {loading ? 'Adding Portal Access...' : 'Add Portal Access'}
            </Button>

            {result && (
              <div className="p-4 border rounded-lg bg-muted">
                <pre>{result}</pre>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
