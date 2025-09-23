
import { Logo } from "@/components/logo";
import { ThemeToggle } from "@/components/theme-toggle";
import clientPromise from "@/lib/mongodb";

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
        
        {children}
       </div>
    </div>
  );
}
