import { Link } from 'react-router-dom';
import { PublicPageShell } from '@/components/layout/PublicPageShell';

export default function HelpCenterPage() {
  return (
    <PublicPageShell
      title="Help Center"
      description="Quick answers for getting started, accounts, payments, and where to get more support."
    >
      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-foreground">Getting started</h2>
        <ul className="list-disc space-y-2 pl-5 text-muted-foreground">
          <li>
            <strong className="text-foreground">New user:</strong> Create an account from{' '}
            <Link to="/auth?tab=register" className="text-green-600 hover:text-green-700">
              Register
            </Link>{' '}
            and choose the role that matches how you use the platform (owner, tenant, agent, etc.).
          </li>
          <li>
            <strong className="text-foreground">Browsing:</strong> Explore{' '}
            <Link to="/public/properties" className="text-green-600 hover:text-green-700">
              public listings
            </Link>{' '}
            or{' '}
            <Link to="/shortlets" className="text-green-600 hover:text-green-700">
              short-lets
            </Link>{' '}
            without signing in.
          </li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-foreground">Accounts & access</h2>
        <p className="text-muted-foreground">
          If you cannot sign in, reset your password from the login screen or use the same email you
          registered with. Role-specific dashboards (owner, tenant, admin, agent) only show data you
          are allowed to see.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-foreground">Payments</h2>
        <p className="text-muted-foreground">
          Rent and booking flows use integrated payment providers (e.g. Flutterwave) where enabled.
          Always confirm amounts and references on the provider&apos;s receipt. For failed or
          pending transactions, check your in-app payment history first, then contact support with
          the reference code.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-foreground">Listings & applications</h2>
        <p className="text-muted-foreground">
          Owners and agents manage properties from the dashboard. Tenants can apply where the
          listing supports applications; status updates appear in your account when the landlord or
          manager processes them.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-foreground">More documentation</h2>
        <p className="text-muted-foreground">
          In-app guides and deeper product documentation may be available under{' '}
          <Link to="/public/docs" className="text-green-600 hover:text-green-700">
            Documentation
          </Link>{' '}
          when signed in or on public routes.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-foreground">Still stuck?</h2>
        <p className="text-muted-foreground">
          Email{' '}
          <a
            href="mailto:support@damianixpro.com"
            className="font-medium text-green-600 hover:text-green-700"
          >
            support@damianixpro.com
          </a>{' '}
          or use the{' '}
          <Link to="/contact" className="font-medium text-green-600 hover:text-green-700">
            contact form
          </Link>
          . Include your account email (never share passwords) and screenshots if relevant.
        </p>
      </section>
    </PublicPageShell>
  );
}
