import { Rocket } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

export function Logo({ className }: { className?: string }) {
  return (
    <Link href="/dashboard" className={cn("flex items-center gap-2", className)}>
      <div className="p-1.5 bg-primary rounded-lg">
        <Rocket className="h-5 w-5 text-primary-foreground" />
      </div>
      <span className="text-lg font-bold tracking-tight font-headline">VendorVerse</span>
    </Link>
  );
}
