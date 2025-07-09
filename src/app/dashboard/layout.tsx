import { type ReactNode } from "react";
import Link from "next/link";
import { PanelLeft, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetTrigger, SheetContent } from "@/components/ui/sheet";
import { UserNav } from "@/components/user-nav";
import { Logo } from "@/components/logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { getUser, fetchInvoices, fetchVendors } from "@/lib/data";
import { DashboardNav } from "@/components/dashboard-nav";
import { AISpotlight } from "@/components/dashboard/ai-spotlight";
import { Input } from "@/components/ui/input";

export default async function DashboardLayout({ children }: { children: ReactNode }) {
    const user = await getUser();
    const invoices = await fetchInvoices();
    const vendors = await fetchVendors();

    return (
        <div className="grid min-h-screen w-full md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]">
            <div className="hidden border-r bg-muted/40 md:block">
                <div className="flex h-full max-h-screen flex-col gap-2">
                    <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
                        <Logo />
                    </div>
                    <div className="flex-1">
                        <DashboardNav />
                    </div>
                </div>
            </div>
            <div className="flex flex-col">
                <header className="flex h-14 items-center gap-4 border-b bg-muted/40 px-4 lg:h-[60px] lg:px-6">
                    <Sheet>
                        <SheetTrigger asChild>
                            <Button
                                variant="outline"
                                size="icon"
                                className="shrink-0 md:hidden"
                            >
                                <PanelLeft className="h-5 w-5" />
                                <span className="sr-only">Toggle navigation menu</span>
                            </Button>
                        </SheetTrigger>
                        <SheetContent side="left" className="flex flex-col p-0">
                             <div className="flex h-14 items-center border-b px-4">
                                  <Logo />
                             </div>
                            <DashboardNav isMobile />
                        </SheetContent>
                    </Sheet>
                    <div className="w-full flex-1">
                       <AISpotlight user={user} invoices={invoices} vendors={vendors} />
                    </div>
                    <ThemeToggle />
                    <UserNav user={user} />
                </header>
                <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
                    {children}
                </main>
            </div>
        </div>
    );
}
