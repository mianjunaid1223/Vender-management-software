import { type ReactNode } from "react";
import { PanelLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Sheet, SheetTrigger, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { UserNav } from "@/components/user-nav";
import { Logo } from "@/components/logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { getUser, fetchInvoices, fetchVendors, processAndFetchContracts, fetchCompany } from "@/lib/data";
import { DashboardNav } from "@/components/dashboard-nav";
import { AISpotlight } from "@/components/dashboard/ai-spotlight";

export default async function DashboardLayout({ children }: { children: ReactNode }) {
    // Fetch all data in parallel
    const [user, invoices, vendors, contracts, company] = await Promise.all([
        getUser(),
        fetchInvoices(),
        fetchVendors(),
        processAndFetchContracts(),
        fetchCompany()
    ]);

    // Serialize all data before passing to client components
    const serializedUser = JSON.parse(JSON.stringify(user));
    const serializedInvoices = JSON.parse(JSON.stringify(invoices));
    const serializedVendors = JSON.parse(JSON.stringify(vendors));
    const serializedContracts = JSON.parse(JSON.stringify(contracts));
    const serializedCompany = company ? JSON.parse(JSON.stringify(company)) : undefined;

    return (
        <div className="min-h-screen w-full bg-muted/40" suppressHydrationWarning>
            <aside className="fixed top-14 left-0 z-10 hidden h-[calc(100vh-3.5rem)] w-[220px] flex-col border-r bg-background md:flex lg:w-[280px] sm:top-[60px] sm:h-[calc(100vh-3.75rem)]">
                <nav className="flex-1 overflow-auto py-2">
                    <DashboardNav />
                </nav>
                <div className="mt-auto border-t p-4" suppressHydrationWarning>
                     <ThemeToggle asDropUp={true} />
                </div>
            </aside>
            
            <header className="fixed top-0 left-0 right-0 z-30 flex h-14 items-center justify-between gap-4 border-b bg-background/95 px-4 backdrop-blur-sm sm:h-[60px] sm:px-6">
                <div className="flex items-center gap-4">
                    <Sheet>
                        <SheetTrigger asChild>
                            <Button size="icon" variant="outline" className="md:hidden">
                                <PanelLeft className="h-5 w-5" />
                                <span className="sr-only">Toggle Menu</span>
                            </Button>
                        </SheetTrigger>
                        <SheetContent side="left" className="flex flex-col p-0 sm:max-w-xs">
                            <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
                            <div className="flex h-14 items-center border-b px-4">
                               <Logo />
                            </div>
                            <nav className="flex-grow overflow-auto">
                                <DashboardNav isMobile />
                            </nav>
                            <div className="mt-auto border-t p-4" suppressHydrationWarning>
                                <ThemeToggle asDropUp={true} />
                            </div>
                        </SheetContent>
                    </Sheet>
                    <Logo />
                </div>
                
                <div className="flex flex-1 justify-center px-4 md:px-8">
                    <div className="w-full max-w-sm">
                        <AISpotlight 
                          user={serializedUser} 
                          invoices={serializedInvoices} 
                          vendors={serializedVendors} 
                          contracts={serializedContracts} 
                          company={serializedCompany}
                        />
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <UserNav user={serializedUser} />
                </div>
            </header>

            <div className="flex flex-col pt-14 sm:pt-[60px] md:pl-[220px] lg:pl-[280px]">
                <main className="flex-1 overflow-y-auto p-4 lg:gap-6 lg:p-6">
                    {children}
                </main>
            </div>
        </div>
    );
}
