import { Logo } from "@/components/logo";
import { ThemeToggle } from "@/components/theme-toggle";
import clientPromise from "@/lib/mongodb";
import { DbConfigWarning } from "@/components/db-config-warning";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const isDbConfigured = clientPromise !== null;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-muted/40 p-4">
       <div className="absolute top-4 left-4">
         <Logo isLanding />
       </div>
       <div className="absolute top-4 right-4">
        <ThemeToggle />
       </div>
       <div className="w-full max-w-sm space-y-4">
        {!isDbConfigured && <DbConfigWarning />}
        {children}
       </div>
    </div>
  );
}
