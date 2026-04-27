import { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Footer } from '@/components/landing/Footer';
import { useAuthSession } from '@/contexts/auth';
import { HeroSection } from '@/components/landing/HeroSection';
import { FeaturedPropertiesSection } from '@/components/landing/FeaturedPropertiesSection';
import { SalesSection } from '@/components/landing/SalesSection';
import { SubscriptionPlans } from '@/components/subscription/SubscriptionPlans';
import { Building2, CheckCircle2, Home, LineChart, ShieldCheck, Users } from 'lucide-react';

const LandingPage = () => {
  const { user } = useAuthSession();
  const location = useLocation();

  // If user arrives with `/#pricing`, scroll to the pricing section after render.
  useEffect(() => {
    if (location.hash !== '#pricing') return;

    const scrollToPricing = () => {
      const el = document.getElementById('pricing');
      if (!el) return;

      // Adjust for sticky header height (roughly).
      const headerOffset = 90;
      const top = el.getBoundingClientRect().top + window.scrollY - headerOffset;
      window.scrollTo({ top, behavior: 'auto' });
    };

    const t1 = window.setTimeout(scrollToPricing, 50);
    const t2 = window.setTimeout(scrollToPricing, 250);

    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
    };
  }, [location.hash]);

  return (
    <div className="mesh-surface flex min-h-screen flex-col">
      <header className="sticky top-0 z-20 border-b border-border bg-background/90 text-foreground shadow-sm backdrop-blur-xl dark:bg-background/95">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 md:px-6">
          <Link to="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary font-bold text-primary-foreground">
              D
            </div>
            <span className="premium-title text-lg text-foreground">DamianixPro</span>
          </Link>
          <nav className="hidden items-center gap-6 text-sm text-muted-foreground md:flex">
            <Link to="/public/properties" className="transition-colors hover:text-foreground">
              Properties
            </Link>
            <Link to="/shortlets" className="transition-colors hover:text-foreground">
              Short-Lets
            </Link>
            <Link to="/reports" className="transition-colors hover:text-foreground">
              Reports
            </Link>
            <Link to="/sales" className="transition-colors hover:text-foreground">
              Sales
            </Link>
            <a href="#pricing" className="transition-colors hover:text-foreground">
              Pricing
            </a>
          </nav>
          <div className="flex items-center gap-2">
            {user ? (
              <Button asChild className="rounded-full">
                <Link to="/dashboard">Open Dashboard</Link>
              </Button>
            ) : (
              <>
                <Button variant="ghost" asChild className="rounded-full">
                  <Link to="/auth">Sign In</Link>
                </Button>
                <Button asChild className="rounded-full">
                  <Link to="/auth?tab=register">Get Started</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      <HeroSection />
      <FeaturedPropertiesSection />

      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-12 px-4 py-10 md:px-6 md:py-16">
        <SalesSection />

        <section id="pricing" className="scroll-mt-24">
          <div className="glass-panel overflow-hidden rounded-3xl p-6 md:p-8">
            <div className="mb-8 text-center">
              <h2 className="premium-title text-2xl md:text-3xl">Plans & subscription</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Paid plans in NGN (no free tier on the product). Pay securely via Flutterwave after
                you sign in.
              </p>
            </div>
            <SubscriptionPlans showCompareLink={false} />
          </div>
        </section>

        <section className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[
            {
              icon: Home,
              title: 'For Owners',
              text: 'Control listings, payouts, tenant workflows, and short-let performance.',
            },
            {
              icon: Users,
              title: 'For Tenants',
              text: 'Discover better matches with AI preferences and seamless communication.',
            },
            {
              icon: Building2,
              title: 'For Agents',
              text: 'Move leads faster with centralized property and task visibility.',
            },
            {
              icon: ShieldCheck,
              title: 'For Admins',
              text: 'Oversee roles, support, billing, reporting, and platform health.',
            },
          ].map((feature) => (
            <div key={feature.title} className="glass-panel rounded-2xl p-5">
              <feature.icon className="mb-3 h-6 w-6 text-primary" />
              <h3 className="premium-title text-lg">{feature.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{feature.text}</p>
            </div>
          ))}
        </section>

        <section className="glass-panel rounded-3xl p-8 md:p-10">
          <div className="mb-6 flex items-center gap-2">
            <LineChart className="h-5 w-5 text-primary" />
            <h2 className="premium-title text-2xl">What You Can Do Faster</h2>
          </div>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {[
              'Publish and manage long-term and short-let listings from one workspace.',
              'Use AI preference matching to improve property discovery outcomes.',
              'Track occupancy, rent roll, maintenance costs, and financial reports.',
              'Coordinate tenants, agents, managers, owners, and vendors with clear workflows.',
            ].map((item) => (
              <div
                key={item}
                className="flex items-start gap-2 rounded-xl border border-border bg-muted/50 p-3 dark:bg-muted/35"
              >
                <CheckCircle2 className="mt-0.5 h-4 w-4 text-primary" />
                <p className="text-sm text-foreground">{item}</p>
              </div>
            ))}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default LandingPage;
