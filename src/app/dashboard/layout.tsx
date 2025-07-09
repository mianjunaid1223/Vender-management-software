import { type ReactNode } from "react";
import { PanelLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Sheet, SheetTrigger, SheetContent } from "@/components/ui/sheet";
import { UserNav } from "@/components/user-nav";
import { Logo } from "@/components/logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { getUser, fetchInvoices, fetchVendors } from "@/lib/data";
import { DashboardNav } from "@/components/dashboard-nav";
import { AISpotlight } from "@/components/dashboard/ai-spotlight";

export default async function DashboardLayout({ children }: { children: ReactNode }) {
    const user = await getUser();
    const invoices = await fetchInvoices();
    const vendors = await fetchVendors();

    return (
        <div className="min-h-screen w-full bg-muted/40">
            <aside className="fixed top-14 left-0 bottom-0 z-10 hidden w-[220px] flex-col border-r bg-background sm:top-[60px] md:flex lg:w-[280px]">
                <nav className="flex-1 overflow-auto py-2">
                    <DashboardNav />
                </nav>
                <div className="mt-auto border-t p-4">
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
                            <div className="flex h-14 items-center border-b px-4">
                               <Logo />
                            </div>
                            <div className="flex-grow overflow-auto">
                                <DashboardNav isMobile />
                            </div>
                            <div className="mt-auto border-t p-4">
                                <ThemeToggle asDropUp={true} />
                            </div>
                        </SheetContent>
                    </Sheet>
                    <Logo />
                </div>
                
                <div className="flex flex-1 justify-center px-4">
                    <div className="w-full max-w-sm">
                        <AISpotlight user={user} invoices={invoices} vendors={vendors} />
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <UserNav user={user} />
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
