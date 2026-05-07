import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { useAuthSession } from '@/contexts/auth';

export const HeroSection = () => {
  const { user } = useAuthSession();

  return (
    <section className="relative flex min-h-[88vh] flex-col items-center justify-center overflow-hidden px-6 pb-16 pt-24 text-center">
      {/* Premium gradient with subtle background depth */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-b from-slate-900 via-slate-950 to-slate-950" />
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900/45 via-slate-950/40 to-slate-950/90" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(59,130,246,0.25),transparent_45%),radial-gradient(circle_at_80%_15%,rgba(217,70,239,0.18),transparent_40%)]" />
      </div>

      {/* Content */}
      <div className="relative z-10 mx-auto max-w-5xl px-4">
        <h1
          data-reveal
          data-reveal-delay="0"
          className="reveal-on-scroll reveal-hero mb-6 text-4xl font-semibold tracking-tight text-white md:text-6xl"
        >
          The Operating System for Nigerian Property Businesses
        </h1>
        <p
          data-reveal
          data-reveal-delay="80"
          className="reveal-on-scroll reveal-hero mx-auto mb-10 max-w-3xl text-lg text-slate-100 md:text-xl"
        >
          Manage properties, tenants, payments, and operations - all in one platform.
        </p>

        <div
          data-reveal
          data-reveal-delay="140"
          className="reveal-on-scroll reveal-hero flex flex-col justify-center gap-3 md:flex-row md:gap-4"
        >
          {user ? (
            <Link to="/dashboard">
              <Button
                size="lg"
                className="micro-press w-full rounded-xl bg-blue-600 px-7 py-3 text-base text-white shadow-md transition-all duration-200 hover:bg-blue-700 hover:shadow-lg md:w-auto"
              >
                Go to Dashboard
              </Button>
            </Link>
          ) : (
            <>
              <Link to="/auth">
                <Button
                  size="lg"
                  className="micro-press w-full rounded-xl bg-blue-600 px-7 py-3 text-base text-white shadow-md transition-all duration-200 hover:bg-blue-700 hover:shadow-lg md:w-auto"
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
              className="micro-press w-full rounded-xl border border-white/30 bg-white/10 px-7 py-3 text-base font-medium text-white backdrop-blur-sm transition-all duration-200 hover:bg-white/20 md:w-auto"
            >
              Browse Properties
            </Button>
          </Link>
          <Link to="/shortlets">
            <Button
              size="lg"
              variant="outline"
              className="micro-press w-full rounded-xl border border-white/30 bg-white/10 px-7 py-3 text-base font-medium text-white backdrop-blur-sm transition-all duration-200 hover:bg-white/20 md:w-auto"
            >
              Find Short-Lets
            </Button>
          </Link>
        </div>

        <div className="mx-auto mt-12 grid max-w-4xl grid-cols-1 gap-4 text-white md:grid-cols-3">
          <Link
            to="/solutions/landlords"
            data-reveal
            data-reveal-delay="200"
            className="reveal-on-scroll reveal-card block rounded-2xl border border-white/20 bg-white/10 p-4 text-left text-white shadow-sm backdrop-blur-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:ring-2 focus-visible:ring-ring"
          >
            <h3 className="mb-2 text-lg font-bold">For Landlords</h3>
            <p className="text-sm">
              Simplify rent collection, manage short-lets and long-term rentals, screen tenants
              effortlessly, and grow your property portfolio.
            </p>
          </Link>
          <Link
            to="/solutions/tenants"
            data-reveal
            data-reveal-delay="260"
            className="reveal-on-scroll reveal-card block rounded-2xl border border-white/20 bg-white/10 p-4 text-left text-white shadow-sm backdrop-blur-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:ring-2 focus-visible:ring-ring"
          >
            <h3 className="mb-2 text-lg font-bold">For Tenants</h3>
            <p className="text-sm">
              Find verified properties and short-let accommodations, request maintenance with ease,
              and make secure digital payments.
            </p>
          </Link>
          <Link
            to="/solutions/property-managers"
            data-reveal
            data-reveal-delay="320"
            className="reveal-on-scroll reveal-card block rounded-2xl border border-white/20 bg-white/10 p-4 text-left text-white shadow-sm backdrop-blur-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:ring-2 focus-visible:ring-ring"
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
