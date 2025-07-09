"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { sidebarNavItems } from "@/config/dashboard";
import type { LucideIcon } from "lucide-react";

type DashboardNavProps = {
    isMobile?: boolean;
};

export function DashboardNav({ isMobile = false }: DashboardNavProps) {
    const pathname = usePathname();
    const items = sidebarNavItems;

    if (isMobile) {
        return (
            <nav className="grid gap-2 p-4 text-base font-medium">
                {items.map(({ href, label, icon: Icon }) => (
                    <Link
                        key={href}
                        href={href}
                        className={cn(
                            "flex items-center gap-4 rounded-lg px-3 py-2 text-muted-foreground hover:text-primary",
                            pathname === href && "bg-accent text-accent-foreground"
                        )}
                    >
                        <Icon className="h-5 w-5" />
                        {label}
                    </Link>
                ))}
            </nav>
        );
    }

    return (
        <nav className="grid items-start px-2 text-sm font-medium lg:px-4">
            {items.map(({ href, label, icon: Icon }) => (
                <Link
                    key={href}
                    href={href}
                    className={cn(
                        "flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary",
                        pathname === href && "bg-accent text-primary"
                    )}
                >
                    <Icon className="h-4 w-4" />
                    {label}
                </Link>
            ))}
        </nav>
    );
}
