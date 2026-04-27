import { Link } from 'react-router-dom';
import { PublicPageShell } from '@/components/layout/PublicPageShell';

export default function AboutPage() {
  return (
    <PublicPageShell
      title="About Us"
      description="DamianixPro is built for Nigeria’s rental and short-let market — connecting landlords, tenants, and property managers with clearer tools and payments."
    >
      <p className="text-muted-foreground">
        <strong className="text-foreground">DamianixPro</strong> is promoted by{' '}
        <strong className="text-foreground">Damianix Systems Ltd</strong>. We focus on practical
        workflows: listings and discovery, applications, rent and booking payments, maintenance
        communication, and reporting — so operations scale without losing visibility.
      </p>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-foreground">REDAN membership</h2>
        <p className="text-muted-foreground">
          Damianix Systems Ltd is a registered member of the Real Estate Developers&apos;
          Association of Nigeria (REDAN). Membership number:{' '}
          <span className="font-medium text-foreground">NC/25/4428/DAM</span>.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-foreground">What we believe</h2>
        <ul className="list-disc space-y-2 pl-5 text-muted-foreground">
          <li>Transparency beats informal handoffs for both sides of a lease.</li>
          <li>Payments and reminders should be trackable, not buried in chat threads.</li>
          <li>Property managers need one place to coordinate people, tasks, and money.</li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-foreground">Get in touch</h2>
        <p className="text-muted-foreground">
          For partnerships, press, or enterprise questions, visit our{' '}
          <Link to="/contact" className="font-medium text-green-600 hover:text-green-700">
            contact page
          </Link>{' '}
          or email{' '}
          <a
            href="mailto:contact@damianixpro.com"
            className="font-medium text-green-600 hover:text-green-700"
          >
            contact@damianixpro.com
          </a>
          .
        </p>
      </section>
    </PublicPageShell>
  );
}
