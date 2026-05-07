import { Link } from 'react-router-dom';
import { PublicPageShell } from '@/components/layout/PublicPageShell';

export default function PrivacyPolicyPage() {
  return (
    <PublicPageShell
      title="Privacy Policy"
      description="How DamianixPro and Damianix Systems Ltd collect, use, and protect personal information."
    >
      <p className="text-sm text-muted-foreground">
        Last updated:{' '}
        {new Date().toLocaleDateString('en-NG', { year: 'numeric', month: 'long', day: 'numeric' })}
        . This page is a general notice for users of the DamianixPro platform. For binding advice,
        consult qualified legal counsel.
      </p>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-foreground">1. Who we are</h2>
        <p className="text-muted-foreground">
          DamianixPro is operated in connection with{' '}
          <strong className="text-foreground">Damianix Systems Ltd</strong> (&quot;we&quot;,
          &quot;us&quot;). Contact:{' '}
          <a href="mailto:privacy@damianixpro.com" className="text-primary hover:text-primary/90">
            privacy@damianixpro.com
          </a>
          .
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-foreground">2. Information we collect</h2>
        <p className="text-muted-foreground">
          Depending on how you use the service, we may process:
        </p>
        <ul className="list-disc space-y-2 pl-5 text-muted-foreground">
          <li>
            <strong className="text-foreground">Account data:</strong> name, email, phone, role,
            authentication identifiers.
          </li>
          <li>
            <strong className="text-foreground">Property &amp; transaction data:</strong> listings,
            applications, leases, bookings, payment references, and related metadata you or your
            counterparty submit.
          </li>
          <li>
            <strong className="text-foreground">Technical data:</strong> device, browser, IP
            address, logs, and cookies or similar technologies (see{' '}
            <a href="#cookies" className="text-primary hover:text-primary/90">
              Cookies
            </a>
            ).
          </li>
          <li>
            <strong className="text-foreground">Support communications:</strong> messages you send
            to us by email or in-app channels.
          </li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-foreground">3. How we use information</h2>
        <ul className="list-disc space-y-2 pl-5 text-muted-foreground">
          <li>Provide, secure, and improve the platform.</li>
          <li>Authenticate users, enforce access rules, and prevent abuse.</li>
          <li>Process payments and payouts where integrated payment providers are used.</li>
          <li>Send service-related notices and, where permitted, product updates.</li>
          <li>Comply with law and respond to lawful requests.</li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-foreground">4. Sharing</h2>
        <p className="text-muted-foreground">
          We may share information with service providers (hosting, analytics, email, payments) who
          process data on our instructions, with other users where the product requires it (for
          example showing a landlord contact flow to a tenant), or when required by law. Payment
          processing is subject to the relevant provider&apos;s privacy policy.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-foreground">5. Retention &amp; security</h2>
        <p className="text-muted-foreground">
          We retain data for as long as your account is active and as needed to provide the service,
          meet legal obligations, resolve disputes, and enforce agreements. We use appropriate
          technical and organizational measures, but no method of transmission over the Internet is
          completely secure.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-foreground">6. Your choices</h2>
        <p className="text-muted-foreground">
          Where applicable under Nigerian data protection law (NDPR) and other regulations, you may
          request access, correction, or deletion of certain personal data, or object to specific
          processing. Contact us at the email above. You may also adjust cookie preferences in your
          browser.
        </p>
      </section>

      <section className="scroll-mt-24 space-y-3" id="cookies">
        <h2 className="text-xl font-semibold text-foreground">7. Cookies</h2>
        <p className="text-muted-foreground">
          We use cookies and similar technologies to keep you signed in, remember preferences,
          measure performance, and protect the service. You can block cookies in your browser; some
          features may not work without them.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-foreground">8. Children</h2>
        <p className="text-muted-foreground">
          The service is not directed at children under 16. We do not knowingly collect personal
          data from children without parental consent.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-foreground">9. Changes</h2>
        <p className="text-muted-foreground">
          We may update this policy from time to time. The &quot;Last updated&quot; date will change
          when we do. Continued use after changes means you accept the revised policy.
        </p>
      </section>

      <p className="text-muted-foreground">
        Questions? See also our{' '}
        <Link to="/terms" className="text-primary hover:text-primary/90">
          Terms of Service
        </Link>{' '}
        or{' '}
        <Link to="/contact" className="text-primary hover:text-primary/90">
          contact us
        </Link>
        .
      </p>
    </PublicPageShell>
  );
}
