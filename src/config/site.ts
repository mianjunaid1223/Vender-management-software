import { Zap, BrainCircuit, CheckCircle, Rocket } from "lucide-react";

export const siteConfig = {
    name: "VendorVerse",
    description: "Streamline Your Vendor Management & Invoice Tracking",
    features: [
        {
          icon: Zap,
          title: "Vendor Management",
          description: "Clean dashboard to manage vendors: add, edit, delete vendor profiles.",
        },
        {
          icon: BrainCircuit,
          title: "AI Invoice Data Extraction",
          description: "Automatically extract key data from uploaded invoices using AI.",
        },
        {
          icon: CheckCircle,
          title: "Invoice Tracking",
          description: "Upload and track invoices with key details like amount, due date, and status.",
        },
        {
          icon: Rocket,
          title: "AI Spending Insights",
          description: "AI-driven insights on spending trends and vendor performance.",
        },
    ]
}
