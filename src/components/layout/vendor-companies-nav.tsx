"use client";

import { useState } from 'react';
import Link from 'next/link';
import { ChevronDown, ChevronRight, Building2, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils/index';
import { useVendorCompanies } from '@/hooks/use-vendor-companies';
import { Skeleton } from '@/components/ui/skeleton';

export function VendorCompaniesNav() {
  const [isExpanded, setIsExpanded] = useState(false);
  const { vendorCompanies, loading, error } = useVendorCompanies();

  // Don't render if no vendor companies or still loading
  if (loading) {
    return (
      <div className="px-3 py-2">
        <Skeleton className="h-4 w-32 mb-2" />
        <Skeleton className="h-3 w-24 ml-4" />
      </div>
    );
  }

  if (error || !vendorCompanies.length) {
    return null;
  }

  return (
    <div className="border-t border-border/40 mt-2 pt-2">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={cn(
          "flex items-center gap-2 w-full rounded-lg px-3 py-2 text-sm text-muted-foreground transition-all hover:text-primary hover:bg-accent/50",
          "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
        )}
      >
        {isExpanded ? (
          <ChevronDown className="h-4 w-4" />
        ) : (
          <ChevronRight className="h-4 w-4" />
        )}
        <Building2 className="h-4 w-4" />
        <span className="font-medium">My Vendor Portals</span>
        <span className="ml-auto text-xs bg-muted px-1.5 py-0.5 rounded-full">
          {vendorCompanies.length}
        </span>
      </button>

      {isExpanded && (
        <div className="ml-6 mt-1 space-y-1">
          {vendorCompanies.map((vendorCompany) => (
            <Link
              key={vendorCompany.vendorId}
              href={`/vendor-portal/dashboard/${vendorCompany.vendorId}?from=dashboard`}
              className={cn(
                "flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-all hover:text-primary hover:bg-accent/50",
                "group relative"
              )}
            >
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <div className="w-2 h-2 rounded-full bg-green-500 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-foreground truncate">
                    {vendorCompany.company.name}
                  </div>
                  <div className="text-xs text-muted-foreground truncate">
                    as {vendorCompany.vendorName}
                  </div>
                </div>
              </div>
              <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
