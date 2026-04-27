import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { useAuthSession } from '@/contexts/auth';

export const HeroSection = () => {
  const { user } = useAuthSession();

  return (
    <section className="relative flex min-h-[90vh] flex-col items-center justify-center p-6 pt-24 text-center">
      {/* Background Image with Gradient Overlay */}
      <div className="absolute inset-0 z-0">
        <img
          src="/lovable-uploads/dd493e84-bac5-4924-9603-75ef76056640.png"
          alt="Hero background"
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-green-600/80 to-green-900/90 mix-blend-multiply"></div>
      </div>

      {/* Content */}
      <div className="relative z-10 mx-auto max-w-5xl px-4">
        <h1 className="mb-6 text-4xl font-bold text-white md:text-6xl">
          DamianixPro: Transforming Nigerian Property Management
        </h1>
        <p className="mx-auto mb-8 max-w-2xl text-xl text-white/90">
          A revolutionary platform connecting landlords, tenants, and property managers with
          cutting-edge tools designed specifically for the Nigerian market. Discover short-let
          properties, manage long-term rentals, and streamline your entire property experience.
        </p>

        <div className="flex flex-col justify-center space-y-4 md:flex-row md:space-x-4 md:space-y-0">
          {user ? (
            <Link to="/dashboard">
              <Button
                size="lg"
                className="w-full border border-border/50 bg-card/95 px-8 text-lg text-foreground hover:bg-card md:w-auto"
              >
                Go to Dashboard
              </Button>
            </Link>
          ) : (
            <>
              <Link to="/auth">
                <Button
                  size="lg"
                  className="w-full border border-border/50 bg-card/95 px-8 text-lg text-foreground hover:bg-card md:w-auto"
                >
                  Get Started
                </Button>
              </Link>
            </>
          )}
          <Link to="/public/properties">
            <Button
              size="lg"
              variant="outline"
              className="w-full border border-primary-foreground/40 bg-foreground/10 px-8 text-lg font-medium text-primary-foreground backdrop-blur-sm hover:bg-card/90 hover:text-foreground md:w-auto"
            >
              Browse Properties
            </Button>
          </Link>
          <Link to="/shortlets">
            <Button
              size="lg"
              variant="outline"
              className="w-full border border-primary-foreground/40 bg-foreground/10 px-8 text-lg font-medium text-primary-foreground backdrop-blur-sm hover:bg-card/90 hover:text-foreground md:w-auto"
            >
              Find Short-Lets
            </Button>
          </Link>
        </div>

        <div className="mx-auto mt-12 grid max-w-4xl grid-cols-1 gap-6 text-white md:grid-cols-3">
          <Link
            to="/solutions/landlords"
            className="block rounded-lg border border-primary-foreground/20 bg-foreground/10 p-4 text-left text-primary-foreground backdrop-blur-sm transition-colors hover:bg-foreground/15 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:ring-2 focus-visible:ring-ring"
          >
            <h3 className="mb-2 text-lg font-bold">For Landlords</h3>
            <p className="text-sm">
              Simplify rent collection, manage short-lets and long-term rentals, screen tenants
              effortlessly, and grow your property portfolio.
            </p>
          </Link>
          <Link
            to="/solutions/tenants"
            className="block rounded-lg border border-primary-foreground/20 bg-foreground/10 p-4 text-left text-primary-foreground backdrop-blur-sm transition-colors hover:bg-foreground/15 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:ring-2 focus-visible:ring-ring"
          >
            <h3 className="mb-2 text-lg font-bold">For Tenants</h3>
            <p className="text-sm">
              Find verified properties and short-let accommodations, request maintenance with ease,
              and make secure digital payments.
            </p>
          </Link>
          <Link
            to="/solutions/property-managers"
            className="block rounded-lg border border-primary-foreground/20 bg-foreground/10 p-4 text-left text-primary-foreground backdrop-blur-sm transition-colors hover:bg-foreground/15 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:ring-2 focus-visible:ring-ring"
          >
            <h3 className="mb-2 text-lg font-bold">For Managers</h3>
            <p className="text-sm">
              Centralize operations, manage both rentals and short-lets, track maintenance requests,
              and generate detailed financial reports.
            </p>
          </Link>
        </div>
      </div>
    </section>
  );
};
