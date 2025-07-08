import { Logo } from "@/components/logo";
import { ThemeToggle } from "@/components/theme-toggle";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-muted/40 p-4">
       <div className="absolute top-4 left-4">
         <Logo />
       </div>
       <div className="absolute top-4 right-4">
        <ThemeToggle />
       </div>
       {children}
    </div>
  );
}
