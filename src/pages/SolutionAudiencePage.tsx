import { Link, useParams } from 'react-router-dom';
import type { LucideIcon } from 'lucide-react';
import {
  Home,
  Users,
  Briefcase,
  Calendar,
  CreditCard,
  ShieldCheck,
  Video,
  Wrench,
  Database,
  MessageSquare,
  LogIn,
  User,
  ArrowRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { GlobalFooter } from '@/components/layout/GlobalFooter';
import { FeatureCard } from '@/components/landing/FeatureCard';
import { useAuthSession } from '@/contexts/auth';
import NotFound from '@/pages/NotFound';

type AudienceSlug = 'landlords' | 'tenants' | 'property-managers';

type FeatureBlock = {
  Icon: LucideIcon;
  title: string;
  description: string;
  features: string[];
};

type AudienceContent = {
  title: string;
  subtitle: string;
  HeroIcon: LucideIcon;
  intro: string;
  features: FeatureBlock[];
};

const AUDIENCE_CONTENT: Record<AudienceSlug, AudienceContent> = {
  landlords: {
    title: 'For Landlords',
    subtitle:
      'List, collect rent, run short-lets, and screen tenants — built for property owners in Nigeria.',
    HeroIcon: Home,
    intro:
      'DamianixPro helps you operate professionally: keep calendars and bookings in sync, get paid through integrated payments, and reduce risk with structured applications and references — without juggling spreadsheets and WhatsApp threads.',
    features: [
      {
        Icon: Calendar,
        title: 'Short-let management',
        description:
          'Maximize income with calendars, bookings, and payouts in one workflow tailored to Nigerian operators.',
        features: [
          'Availability and booking management',
          'Instant or approval-based bookings',
          'Payment flows with Flutterwave integration',
        ],
      },
      {
        Icon: CreditCard,
        title: 'Automated rent collection',
        description:
          'Collect rent on time with reminders, notifications, and clearer visibility into what is paid and what is due.',
        features: [
          'Payment notifications',
          'Rent reminders for tenants',
          'Financial reporting for your portfolio',
        ],
      },
      {
        Icon: ShieldCheck,
        title: 'Tenant screening',
        description:
          'Move from informal vetting to a consistent process so you can compare applicants fairly.',
        features: [
          'Identity and application data in one place',
          'Employment and income context',
          'Reference and history where available',
        ],
      },
    ],
  },
  tenants: {
    title: 'For Tenants',
    subtitle:
      'Find homes and short-lets, pay securely, and stay in touch with your landlord or manager — all in one place.',
    HeroIcon: Users,
    intro:
      'Whether you are renting long-term or booking a short-let, DamianixPro is designed for transparency: search real listings, understand pricing, pay through trusted channels, and log maintenance without losing track of conversations.',
    features: [
      {
        Icon: Home,
        title: 'Discover short-lets and rentals',
        description:
          'Search by location, dates, and amenities with availability that reflects what owners actually publish.',
        features: [
          'Filters that match how people search in Nigeria',
          'Availability tied to host calendars',
          'Secure checkout with Flutterwave',
        ],
      },
      {
        Icon: Video,
        title: 'Verified listings & rich media',
        description:
          'Reduce surprises before you visit — better descriptions, media, and structured property details.',
        features: [
          'Virtual tours and photos where provided',
          'Clear pricing and listing metadata',
          'Confidence when comparing options',
        ],
      },
      {
        Icon: Wrench,
        title: 'Maintenance requests',
        description:
          'Report issues with context (photos, description) and follow status instead of chasing messages.',
        features: [
          'Structured tickets with updates',
          'Direct line to the responsible party',
          'History you can refer back to',
        ],
      },
    ],
  },
  'property-managers': {
    title: 'For Property Managers',
    subtitle:
      'One operating layer for portfolios, tenants, maintenance, and money — so you scale without losing control.',
    HeroIcon: Briefcase,
    intro:
      'Managing multiple owners and buildings means coordination overhead. DamianixPro centralizes properties, people, and workflows so your team spends less time on admin and more time on occupancy, collections, and service quality.',
    features: [
      {
        Icon: Database,
        title: 'Centralized portfolio dashboard',
        description:
          'See properties, tenants, and key activity from a single hub instead of fragmented tools.',
        features: [
          'Portfolio-level visibility',
          'Tenant and lease context in one system',
          'Financial tracking and reporting support',
        ],
      },
      {
        Icon: MessageSquare,
        title: 'Maintenance & communication',
        description:
          'Route requests, assign work, and keep tenants informed with consistent status updates.',
        features: [
          'Task assignment and scheduling patterns',
          'Vendor and stakeholder coordination',
          'Tenant-facing progress visibility',
        ],
      },
      {
        Icon: CreditCard,
        title: 'Collections aligned with owners',
        description:
          'Support transparent rent and fee flows so owners see what you collect and what is remitted.',
        features: [
          'Payment tracking across the portfolio',
          'Clearer reconciliation story per property',
          'Less manual follow-up on arrears',
        ],
      },
    ],
  },
};

const SOLUTION_LINKS: { slug: AudienceSlug; label: string }[] = [
  { slug: 'landlords', label: 'Landlords' },
  { slug: 'tenants', label: 'Tenants' },
  { slug: 'property-managers', label: 'Property managers' },
];

function isAudienceSlug(value: string | undefined): value is AudienceSlug {
  return value === 'landlords' || value === 'tenants' || value === 'property-managers';
}

export default function SolutionAudiencePage() {
  const { audience } = useParams<{ audience: string }>();
  const { user } = useAuthSession();

  if (!isAudienceSlug(audience)) {
    return <NotFound />;
  }

  const content = AUDIENCE_CONTENT[audience];
  const HeroIcon = content.HeroIcon;

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="sticky top-0 z-10 border-b border-border bg-background/95 text-foreground shadow-sm backdrop-blur-xl supports-[backdrop-filter]:bg-background/80">
        <div className="container mx-auto flex h-16 flex-wrap items-center justify-between gap-2 px-4">
          <div className="flex min-w-0 flex-1 items-center gap-4">
            <Link to="/" className="flex shrink-0 items-center space-x-2">
              <div className="flex h-8 w-8 items-center justify-center rounded bg-gradient-to-r from-green-600 to-green-400 font-bold text-white">
                D
              </div>
              <span className="text-lg font-semibold">DamianixPro</span>
            </Link>
            <nav className="hidden items-center gap-3 text-sm text-muted-foreground sm:flex">
              <span className="text-foreground/60">Solutions:</span>
              {SOLUTION_LINKS.map(({ slug, label }) => (
                <Link
                  key={slug}
                  to={`/solutions/${slug}`}
                  className={
                    slug === audience ? 'font-medium text-green-600' : 'hover:text-foreground'
                  }
                >
                  {label}
                </Link>
              ))}
              <Link to="/contact" className="hover:text-foreground">
                Contact
              </Link>
            </nav>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            {user ? (
              <Button variant="outline" size="sm" asChild>
                <Link to="/properties" className="flex items-center gap-1">
                  <User className="h-4 w-4" />
                  Dashboard
                </Link>
              </Button>
            ) : (
              <Button variant="default" size="sm" asChild>
                <Link to="/auth" className="flex items-center gap-1">
                  <LogIn className="h-4 w-4" />
                  Login / Register
                </Link>
              </Button>
            )}
          </div>
        </div>
      </header>

      <main className="flex-grow">
        <section className="border-b border-green-100 bg-gradient-to-b from-green-50/80 to-background px-4 py-14 md:py-20">
          <div className="container mx-auto max-w-4xl text-center">
            <div className="mb-6 flex justify-center">
              <div className="rounded-full bg-green-100 p-4">
                <HeroIcon className="h-10 w-10 text-green-600 md:h-12 md:w-12" />
              </div>
            </div>
            <h1 className="mb-4 text-3xl font-bold tracking-tight md:text-4xl">{content.title}</h1>
            <p className="mx-auto mb-6 max-w-2xl text-lg text-muted-foreground">
              {content.subtitle}
            </p>
            <p className="mx-auto max-w-2xl text-pretty text-foreground/90">{content.intro}</p>
            <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
              <Button asChild size="lg" className="gap-2">
                <Link to="/auth?tab=register">
                  Get started
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button variant="outline" size="lg" asChild>
                <Link to="/public/properties">Browse properties</Link>
              </Button>
              <Button variant="ghost" size="lg" asChild>
                <Link to="/contact">Talk to sales</Link>
              </Button>
            </div>
          </div>
        </section>

        <section className="px-4 py-16 md:py-20">
          <div className="container mx-auto max-w-5xl">
            <h2 className="mb-4 text-center text-2xl font-bold md:text-3xl">
              What you can do on DamianixPro
            </h2>
            <p className="mx-auto mb-12 max-w-2xl text-center text-muted-foreground">
              Capabilities evolve with the product; this overview reflects the core problems we
              solve for {content.title.toLowerCase()}.
            </p>
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              {content.features.map((block) => {
                const Icon = block.Icon;
                return (
                  <FeatureCard
                    key={block.title}
                    icon={
                      <Icon className="h-10 w-10 shrink-0 text-green-600 dark:text-green-400" />
                    }
                    title={block.title}
                    description={block.description}
                    features={block.features}
                  />
                );
              })}
            </div>
          </div>
        </section>
      </main>

      <GlobalFooter />
    </div>
  );
}
