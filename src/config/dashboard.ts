import { Home, Receipt, Users, LineChart, User } from "lucide-react";

export const sidebarNavItems = [
    { href: "/dashboard", label: "Dashboard", icon: Home },
    { href: "/dashboard/invoices", label: "Invoices", icon: Receipt },
    { href: "/dashboard/vendors", label: "Vendors", icon: Users },
    { href: "/dashboard/reports", label: "Reports", icon: LineChart },
    { href: "/dashboard/profile", label: "Profile", icon: User },
];
