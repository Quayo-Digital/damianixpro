import { Link } from 'react-router-dom';
import { PublicPageShell } from '@/components/layout/PublicPageShell';

export default function TermsOfServicePage() {
  return (
    <PublicPageShell
      title="Terms of Service"
      description="Rules for using the DamianixPro platform and services offered by or on behalf of Damianix Systems Ltd."
    >
      <p className="text-sm text-muted-foreground">
        Last updated:{' '}
        {new Date().toLocaleDateString('en-NG', { year: 'numeric', month: 'long', day: 'numeric' })}
        . These terms are a general template for users. Obtain legal review before relying on them
        for compliance.
      </p>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-foreground">1. Agreement</h2>
        <p className="text-muted-foreground">
          By accessing or using DamianixPro (&quot;Service&quot;), you agree to these Terms. If you
          do not agree, do not use the Service. We may update these Terms; we will indicate changes
          by updating the date above. Your continued use after changes constitutes acceptance.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-foreground">2. The Service</h2>
        <p className="text-muted-foreground">
          DamianixPro provides software tools for property discovery, applications, leasing and
          short-let workflows, communications, and related features. The Service is provided by or
          on behalf of <strong className="text-foreground">Damianix Systems Ltd</strong>. We may
          modify, suspend, or discontinue features with reasonable notice where practicable.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-foreground">3. Accounts</h2>
        <p className="text-muted-foreground">
          You must provide accurate registration information and keep credentials confidential. You
          are responsible for activity under your account. We may suspend or terminate accounts that
          violate these Terms or pose security or legal risk.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-foreground">
          4. Listings, applications &amp; user content
        </h2>
        <p className="text-muted-foreground">
          Users may submit listings, documents, messages, and other content. You retain ownership of
          your content but grant us a licence to host, display, and process it to operate the
          Service. You represent that you have the right to submit the content and that listings are
          not misleading or unlawful. We may remove content that violates law or these Terms.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-foreground">5. Payments</h2>
        <p className="text-muted-foreground">
          Payments may be processed by third-party providers (such as Flutterwave). Those
          transactions are also governed by the provider&apos;s terms. DamianixPro does not
          guarantee approval of any payment. Disputes between landlords, tenants, and managers
          remain between those parties unless we explicitly offer a dispute resolution product.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-foreground">6. Prohibited conduct</h2>
        <p className="text-muted-foreground">You agree not to:</p>
        <ul className="list-disc space-y-2 pl-5 text-muted-foreground">
          <li>Violate law or infringe others&apos; rights.</li>
          <li>Attempt to gain unauthorized access to systems, data, or accounts.</li>
          <li>Use the Service to distribute malware, spam, or fraudulent listings.</li>
          <li>Scrape or overload the Service in a way that harms availability.</li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-foreground">7. Disclaimers</h2>
        <p className="text-muted-foreground">
          The Service is provided &quot;as is&quot; and &quot;as available&quot;. We do not warrant
          uninterrupted or error-free operation. We are not a party to leases between users and do
          not guarantee the accuracy of third-party listings or identity verification outcomes.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-foreground">8. Limitation of liability</h2>
        <p className="text-muted-foreground">
          To the fullest extent permitted by applicable law in Nigeria, Damianix Systems Ltd and its
          affiliates will not be liable for indirect, incidental, special, consequential, or
          punitive damages, or loss of profits or data, arising from your use of the Service. Our
          aggregate liability for claims relating to the Service shall not exceed the greater of
          amounts you paid us for the Service in the twelve months before the claim or a nominal
          amount where no fees applied.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-foreground">9. Indemnity</h2>
        <p className="text-muted-foreground">
          You will indemnify and hold harmless Damianix Systems Ltd from claims arising out of your
          content, your use of the Service, or your breach of these Terms, except to the extent
          caused by our wilful misconduct.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-foreground">10. Governing law</h2>
        <p className="text-muted-foreground">
          These Terms are governed by the laws of the Federal Republic of Nigeria. Courts in Nigeria
          shall have exclusive jurisdiction, subject to mandatory consumer protections where
          applicable.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-foreground">11. Contact</h2>
        <p className="text-muted-foreground">
          Questions about these Terms:{' '}
          <a href="mailto:legal@damianixpro.com" className="text-green-600 hover:text-green-700">
            legal@damianixpro.com
          </a>
          . See our{' '}
          <Link to="/privacy" className="text-green-600 hover:text-green-700">
            Privacy Policy
          </Link>{' '}
          for data practices.
        </p>
      </section>
    </PublicPageShell>
  );
}
