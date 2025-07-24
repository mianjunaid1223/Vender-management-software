
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
    <div className="relative min-h-screen w-full">
       <div className="absolute top-4 left-4 z-10">
         <Logo isLanding />
       </div>
       <div className="absolute top-4 right-4 z-10">
        <ThemeToggle />
       </div>
       <div className="w-full">
        {!isDbConfigured && (
            <div className="absolute top-20 left-1/2 -translate-x-1/2 w-full max-w-4xl p-4 z-10">
                <DbConfigWarning />
            </div>
        )}
        {children}
       </div>
    </div>
  );
}
