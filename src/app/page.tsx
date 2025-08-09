import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { Logo } from "@/components/logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { siteConfig } from "@/config/site";

export default function Home() {
  const features = siteConfig.features;

  return (
    <div className="flex flex-col min-h-screen">
      <header className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Logo />
        <div className="flex items-center gap-4">
          <ThemeToggle />
          <Button variant="ghost" asChild>
            <Link href="/login">Login</Link>
          </Button>
          <Button asChild>
            <Link href="/signup">Sign Up</Link>
          </Button>
        </div>
      </header>

      <main className="flex-1">
        <section className="container mx-auto px-4 text-center py-20 sm:py-32">
          <div className="bg-primary/20 text-primary-foreground inline-flex items-center rounded-full px-4 py-1 mb-4">
            <span className="text-primary font-medium">Manage Vendors Smarter</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tighter mb-4 font-headline">
            {siteConfig.description}
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
            {siteConfig.name} is your all-in-one solution for efficient vendor management, invoice tracking, and AI-powered financial insights. Take control of your payables today.
          </p>
          <div className="flex justify-center gap-4">
            <Button size="lg" asChild>
              <Link href="/signup">Get Started for Free</Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/login">Login</Link>
            </Button>
            <Button size="lg" variant="secondary" asChild>
              <Link href="/vendor-portal">Vendor Portal</Link>
            </Button>
          </div>
        </section>

        <section className="bg-muted/50 py-20 sm:py-24">
            <div className="container mx-auto px-4">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-12 font-headline">
                Core Features
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                {features.map((feature, index) => (
                <Card key={index} className="bg-card">
                    <CardHeader className="flex flex-row items-center gap-4">
                    <div className="bg-primary/10 text-primary p-3 rounded-full">
                        <feature.icon className="h-6 w-6" />
                    </div>
                    <CardTitle>{feature.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                    <p className="text-muted-foreground">{feature.description}</p>
                    </CardContent>
                </Card>
                ))}
            </div>
            </div>
        </section>

        {/* Vendor Portal Section */}
        <section className="container mx-auto px-4 py-20 sm:py-24">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 font-headline">
              Are You a Vendor?
            </h2>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
              Access your vendor dashboard to manage invoices, contracts, and communications with ease.
            </p>
          </div>
          
          <div className="max-w-md mx-auto">
            <Card className="border-2 border-primary/20 shadow-lg">
              <CardContent className="p-8 text-center">
                <div className="bg-primary/10 p-4 rounded-full w-16 h-16 mx-auto mb-6 flex items-center justify-center">
                  <svg className="h-8 w-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold mb-4">Vendor Portal</h3>
                <p className="text-muted-foreground mb-6">
                  Secure access to your vendor dashboard with your unique PIN
                </p>
                <Button size="lg" className="w-full" asChild>
                  <Link href="/vendor-portal">Access Vendor Portal</Link>
                </Button>
                <p className="text-xs text-muted-foreground mt-4">
                  Don't have a PIN? Contact your business partner for access.
                </p>
              </CardContent>
            </Card>
          </div>
        </section>
      </main>

      <footer className="container mx-auto px-4 py-6 border-t">
        <div className="flex flex-col sm:flex-row justify-between items-center">
          <Logo isLanding />
          <p className="text-sm text-muted-foreground mt-4 sm:mt-0">
            © {new Date().getFullYear()} {siteConfig.name}. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
