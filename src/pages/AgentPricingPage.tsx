import { Link } from 'react-router-dom';
import { User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { GlobalFooter } from '@/components/layout/GlobalFooter';
import { useAuthSession } from '@/contexts/auth';
import { SubscriptionPlans } from '@/components/subscription/SubscriptionPlans';

/**
 * Dedicated pricing for agents, vendors, tenants, and partners (non–owner subscription hub).
 */
export default function AgentPricingPage() {
  const { user } = useAuthSession();

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="sticky top-0 z-10 border-b border-border bg-background/95 text-foreground shadow-sm backdrop-blur-xl supports-[backdrop-filter]:bg-background/80">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-6">
            <Link to="/" className="flex items-center space-x-2">
              <div className="flex h-8 w-8 items-center justify-center rounded bg-gradient-to-r from-green-600 to-green-400 font-bold text-primary-foreground">
                D
              </div>
              <span className="text-lg font-semibold">DamianixPro</span>
            </Link>
            <Link to="/contact" className="text-sm text-muted-foreground hover:text-foreground">
              Contact
            </Link>
          </div>
          <div className="flex items-center gap-2">
            {user ? (
              <Button variant="outline" size="sm" asChild>
                <Link to="/dashboard" className="flex items-center gap-1">
                  <User className="h-4 w-4" />
                  Dashboard
                </Link>
              </Button>
            ) : (
              <Button size="sm" asChild>
                <Link to="/auth">Sign in</Link>
              </Button>
            )}
          </div>
        </div>
      </header>

      <main className="container mx-auto flex-1 px-4 py-10">
        <div className="mx-auto max-w-6xl space-y-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold tracking-tight text-foreground md:text-4xl">
              Plans for agents and partners
            </h1>
            <p className="mx-auto mt-3 max-w-2xl text-muted-foreground">
              Compare tiers, start a trial, or subscribe—without going through the landlord
              subscription hub. Property owners managing portfolios can use{' '}
              <Link
                to="/owner/subscription"
                className="font-medium text-primary underline-offset-4 hover:underline"
              >
                owner billing
              </Link>
              .
            </p>
          </div>
          <SubscriptionPlans showCurrentPlan={Boolean(user)} showCompareLink />
        </div>
      </main>

      <GlobalFooter />
    </div>
  );
}
