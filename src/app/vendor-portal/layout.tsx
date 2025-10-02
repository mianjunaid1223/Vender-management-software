import { ThemeProvider } from "@/shared/components/theme-provider";
import { Toaster } from "@/shared/components/ui/toaster";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Vendor Portal | Vendor Management System",
  description: "Secure vendor portal for managing invoices, contracts, and business operations.",
};

export default function VendorPortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      {children}
      <Toaster />
    </ThemeProvider>
  );
}
