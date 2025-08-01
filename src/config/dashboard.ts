import { Home, Receipt, Users, LineChart, User, FileText, Building, UserCheck } from "lucide-react";

export const sidebarNavItems = [
    { href: "/dashboard", label: "Dashboard", icon: Home },
    { href: "/dashboard/company", label: "My Company", icon: Building },
    { href: "/dashboard/invoices", label: "Invoices", icon: Receipt },
    { href: "/dashboard/vendors", label: "Vendors", icon: Users },
    { href: "/dashboard/vendor-applications", label: "Vendor Applications", icon: UserCheck },
    { href: "/dashboard/contracts", label: "Contracts", icon: FileText },
    { href: "/dashboard/reports", label: "Reports", icon: LineChart },
    { href: "/dashboard/profile", label: "Profile", icon: User },
];
