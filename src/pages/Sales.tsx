import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { GlobalFooter } from '@/components/layout/GlobalFooter';
import { useAuthSession } from '@/contexts/auth';
import { Building2, LogIn, User, MapPinned, Landmark, Home, ArrowRight } from 'lucide-react';

export default function Sales() {
  const { user } = useAuthSession();

  return (
    <div className="mesh-surface flex min-h-screen flex-col bg-background">
      <header className="sticky top-0 z-20 border-b border-border bg-background/90 text-foreground shadow-sm backdrop-blur-xl dark:bg-background/95">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center space-x-4">
            <Link to="/" className="flex items-center space-x-2">
              <div className="flex h-8 w-8 items-center justify-center rounded bg-primary font-bold text-primary-foreground">
                D
              </div>
              <span className="premium-title text-lg text-foreground">DamianixPro</span>
            </Link>

            <Link
              to="/sales"
              className="flex items-center space-x-1 text-sm text-muted-foreground hover:text-foreground"
            >
              <span>Sales</span>
            </Link>
          </div>

          <div className="flex items-center space-x-2">
            {user ? (
              <Button
                variant="outline"
                size="sm"
                className="rounded-full border-primary/30 bg-background/80"
                asChild
              >
                <Link to="/properties" className="flex items-center gap-1">
                  <User className="h-4 w-4" />
                  <span>Dashboard</span>
                </Link>
              </Button>
            ) : (
              <Button variant="default" size="sm" className="rounded-full" asChild>
                <Link to="/auth" className="flex items-center gap-1">
                  <LogIn className="h-4 w-4" />
                  <span>Login / Register</span>
                </Link>
              </Button>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-8 px-4 py-8 md:px-6 md:py-10">
        <section className="premium-data-card p-8 md:p-10">
          <Badge className="mb-4 rounded-full bg-primary/15 text-primary hover:bg-primary/15">
            Buy Property or Land
          </Badge>
          <h1 className="premium-title text-3xl md:text-5xl">Sales Marketplace</h1>
          <p className="mt-3 max-w-3xl text-muted-foreground">
            Explore curated residential, commercial, and land sale opportunities with trusted
            listings and expert support from DamianixPro.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button asChild className="rounded-full">
              <Link to="/public/properties?transaction=SALE&view=list">
                Browse All Listings
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              className="rounded-full border-primary/30 bg-background dark:bg-muted/30"
            >
              <Link to="/contact">Talk to Sales Team</Link>
            </Button>
          </div>
        </section>

        <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <Card className="premium-data-card">
            <div className="h-44 overflow-hidden rounded-t-2xl">
              <img
                src="/sales/sales-demo-residential-modern-estate.png"
                alt="Residential property for sale"
                className="h-full w-full object-cover"
              />
            </div>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Home className="h-5 w-5 text-primary" />
                Residential
              </CardTitle>
              <CardDescription>Homes, apartments, and family-focused communities.</CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                asChild
                variant="outline"
                className="w-full rounded-full border-primary/30 bg-background dark:bg-muted/30"
              >
                <Link to="/public/properties?transaction=SALE&type=residential&view=list">
                  View Residential
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="premium-data-card">
            <div className="h-44 overflow-hidden rounded-t-2xl">
              <img
                src="/sales/sales-demo-commercial-office-tower.png"
                alt="Commercial property for sale"
                className="h-full w-full object-cover"
              />
            </div>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Building2 className="h-5 w-5 text-primary" />
                Commercial
              </CardTitle>
              <CardDescription>Office, retail, and investment-ready properties.</CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                asChild
                variant="outline"
                className="w-full rounded-full border-primary/30 bg-background dark:bg-muted/30"
              >
                <Link to="/public/properties?transaction=SALE&type=commercial&view=list">
                  View Commercial
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="premium-data-card">
            <div className="h-44 overflow-hidden rounded-t-2xl">
              <img
                src="/sales/sales-demo-land-development-plot.png"
                alt="Land plot for sale"
                className="h-full w-full object-cover"
              />
            </div>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <MapPinned className="h-5 w-5 text-primary" />
                Land
              </CardTitle>
              <CardDescription>Plots in growth corridors and strategic locations.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center gap-2 rounded-xl border border-border bg-muted/40 p-3 text-sm text-muted-foreground dark:bg-muted/25">
                <Landmark className="h-4 w-4 text-primary" />
                Lagos, Abuja, Port Harcourt
              </div>
              <Button
                asChild
                variant="outline"
                className="w-full rounded-full border-primary/30 bg-background dark:bg-muted/30"
              >
                <Link to="/public/properties?transaction=SALE&view=list">
                  Request Land Listings
                </Link>
              </Button>
            </CardContent>
          </Card>
        </section>
      </main>

      <GlobalFooter />
    </div>
  );
}
