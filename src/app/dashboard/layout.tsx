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
        <div className="flex min-h-screen w-full flex-col bg-muted/40">
            <aside className="fixed inset-y-0 left-0 z-10 hidden w-[220px] flex-col border-r bg-background md:flex lg:w-[280px]">
                <div className="flex h-14 items-center px-4 lg:h-[60px] lg:px-6">
                    <Logo />
                </div>
                <nav className="flex-1 overflow-auto py-2">
                    <DashboardNav />
                </nav>
            </aside>
            <div className="flex flex-col md:pl-[220px] lg:pl-[280px]">
                <header className="sticky top-0 z-30 flex h-14 items-center justify-between gap-4 border-b bg-background/95 px-4 backdrop-blur-sm sm:h-[60px] sm:px-6">
                    <Sheet>
                        <SheetTrigger asChild>
                            <Button size="icon" variant="outline" className="sm:hidden">
                                <PanelLeft className="h-5 w-5" />
                                <span className="sr-only">Toggle Menu</span>
                            </Button>
                        </SheetTrigger>
                        <SheetContent side="left" className="p-0 sm:max-w-xs">
                            <div className="flex h-14 items-center border-b px-4">
                               <Logo />
                            </div>
                            <DashboardNav isMobile />
                        </SheetContent>
                    </Sheet>
                    
                    <div className="flex flex-1 justify-center px-4">
                        <div className="w-full max-w-sm">
                            <AISpotlight user={user} invoices={invoices} vendors={vendors} />
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <ThemeToggle />
                        <UserNav user={user} />
                    </div>
                </header>
                <main className="flex-1 overflow-y-auto p-4 lg:gap-6 lg:p-6">
                    {children}
                </main>
            </div>
        </div>
    );
}
