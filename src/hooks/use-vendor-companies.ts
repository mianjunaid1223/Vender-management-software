import { useState, useEffect } from 'react';

export interface VendorCompany {
  vendorId: string;
  vendorName: string;
  vendorPin: string;
  company: {
    id: string;
    name: string;
    logo?: string;
    industry?: string;
  };
  joinedDate: string;
  status: string;
}

interface UseVendorCompaniesReturn {
  vendorCompanies: VendorCompany[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useVendorCompanies(): UseVendorCompaniesReturn {
  const [vendorCompanies, setVendorCompanies] = useState<VendorCompany[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchVendorCompanies = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/user/vendor-companies');
      
      if (!response.ok) {
        throw new Error('Failed to fetch vendor companies');
      }
      
      const data = await response.json();
      setVendorCompanies(data.vendorCompanies || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error('Error fetching vendor companies:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVendorCompanies();
  }, []);

  return {
    vendorCompanies,
    loading,
    error,
    refetch: fetchVendorCompanies
  };
}
