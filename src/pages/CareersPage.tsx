import { Link } from 'react-router-dom';
import { PublicPageShell } from '@/components/layout/PublicPageShell';

export default function CareersPage() {
  return (
    <PublicPageShell
      title="Careers"
      description="Help us build the operating system for Nigerian property — product, engineering, growth, and operations."
    >
      <p className="text-muted-foreground">
        We are a small, product-focused team working on real problems for landlords, tenants, and
        property managers. If you care about fintech, marketplaces, and making complex workflows
        simple, we would like to hear from you.
      </p>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-foreground">How we hire</h2>
        <p className="text-muted-foreground">
          Roles open and close based on need. We review every introduction thoughtfully: share your
          background, what you have shipped, and why DamianixPro interests you.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-foreground">Apply</h2>
        <p className="text-muted-foreground">
          Send your CV, portfolio, or LinkedIn profile to{' '}
          <a
            href="mailto:careers@damianixpro.com"
            className="font-medium text-green-600 hover:text-green-700"
          >
            careers@damianixpro.com
          </a>{' '}
          with the role or area (e.g. engineering, design, operations) in the subject line.
        </p>
        <p className="text-muted-foreground">
          Prefer a form? Use the{' '}
          <Link to="/contact" className="font-medium text-green-600 hover:text-green-700">
            contact page
          </Link>{' '}
          and choose the topic that best fits your message.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-foreground">Working style</h2>
        <ul className="list-disc space-y-2 pl-5 text-muted-foreground">
          <li>Remote-friendly collaboration with clear written communication.</li>
          <li>Ownership over outcomes, not just tasks.</li>
          <li>Respect for users handling rent, bookings, and maintenance in the real economy.</li>
        </ul>
      </section>
    </PublicPageShell>
  );
}
