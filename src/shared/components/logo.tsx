import { Rocket } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/core/utils/utils';
import { siteConfig } from '@/config/site';

export function Logo({ className, isLanding = false }: { className?: string, isLanding?: boolean }) {
  return (
    <Link href={isLanding ? "/" : "/dashboard"} className={cn("flex items-center gap-2", className)}>
      <div className="p-1.5 bg-primary rounded-lg">
        <Rocket className="h-5 w-5 text-primary-foreground" />
      </div>
      <span className="text-lg font-bold tracking-tight">{siteConfig.name}</span>
    </Link>
  );
}
