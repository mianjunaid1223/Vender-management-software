import { Home, Receipt, Users, LineChart, User, Settings, FileText, Shield, TrendingUp, AlertTriangle } from "lucide-react";

export const sidebarNavItems = [
    { href: "/dashboard", label: "Dashboard", icon: Home },
    { href: "/dashboard/invoices", label: "Invoices", icon: Receipt },
    { href: "/dashboard/vendors", label: "Vendors", icon: Users },
    { href: "/dashboard/contracts", label: "Contracts", icon: FileText },
    { href: "/dashboard/compliance", label: "Compliance", icon: Shield },
    { href: "/dashboard/analytics", label: "Analytics", icon: TrendingUp },
    { href: "/dashboard/alerts", label: "Alerts", icon: AlertTriangle },
    { href: "/dashboard/reports", label: "Reports", icon: LineChart },
    { href: "/dashboard/settings", label: "Settings", icon: Settings },
    { href: "/dashboard/profile", label: "Profile", icon: User },
];
