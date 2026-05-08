import { useEffect, useRef } from 'react';
import {
  Sparkles,
  PhoneCall,
  Mic,
  Wrench,
  Compass,
  TrendingUp,
  ShieldCheck,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';

type AiCapability = {
  key: string;
  icon: LucideIcon;
  title: string;
  description: string;
};

const CAPABILITIES: AiCapability[] = [
  {
    key: 'copywriter',
    icon: Sparkles,
    title: 'AI listing copywriter',
    description:
      'Turn a few property details into ready-to-publish copy in three voices — a short hook, a polished marketing version, and a WhatsApp-ready blurb — in seconds.',
  },
  {
    key: 'voice-reminders',
    icon: PhoneCall,
    title: 'Voice rent reminders',
    description:
      'Place outbound calls to tenants in their preferred language using AI-cloned voices, with one-tap callback actions and a Flutterwave payment link in the same flow.',
  },
  {
    key: 'whatsapp-concierge',
    icon: Mic,
    title: 'WhatsApp voice concierge',
    description:
      'Tenants ask "how much rent do I owe?" as a voice note. We transcribe, reason over their ledger, and reply by voice — usually inside ten seconds.',
  },
  {
    key: 'predictive-maintenance',
    icon: Wrench,
    title: 'Predictive maintenance',
    description:
      'Seasonal risk alerts, end-of-life equipment flags, and emergency-repair pattern detection — so issues surface before they become Saturday-night calls.',
  },
  {
    key: 'smart-matching',
    icon: Compass,
    title: 'Smart tenant matching',
    description:
      'Pair properties with tenants using commute proximity, behavioural signals, and saved preferences — not just price filters or area name matches.',
  },
  {
    key: 'forecast',
    icon: TrendingUp,
    title: 'Rent revenue forecast',
    description:
      "Know what next month's rent collection looks like — with a 95% confidence band — so you can plan payouts, hires, and growth on real numbers.",
  },
];

function CapabilityCard({ capability, index }: { capability: AiCapability; index: number }) {
  const Icon = capability.icon;

  return (
    <div
      data-reveal
      data-reveal-delay={String(80 + index * 60)}
      className={cn(
        'reveal-on-scroll reveal-card group relative flex flex-col gap-4 overflow-hidden rounded-2xl border border-border bg-card p-6 shadow-sm',
        'transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md hover:ring-1 hover:ring-primary/20'
      )}
    >
      <div
        className="pointer-events-none absolute inset-0 bg-gradient-to-br from-primary/[0.07] via-transparent to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100"
        aria-hidden="true"
      />

      <div className="relative flex items-start gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary ring-1 ring-primary/15 transition-transform duration-300 group-hover:scale-[1.04]">
          <Icon className="h-5 w-5" strokeWidth={1.85} aria-hidden="true" />
        </div>
        <div>
          <h3 className="premium-title text-lg leading-tight text-foreground">
            {capability.title}
          </h3>
        </div>
      </div>

      <p className="relative text-sm leading-relaxed text-muted-foreground">
        {capability.description}
      </p>
    </div>
  );
}

export function AiFeaturesSection() {
  const sectionRef = useRef<HTMLElement>(null);

  // Lightweight reveal-on-scroll, mirrors the pattern used by LandingStatsStrip.
  useEffect(() => {
    const root = sectionRef.current;
    if (!root) return;

    const revealed = new WeakSet<Element>();
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting || revealed.has(entry.target)) return;
          revealed.add(entry.target);

          const baseDelay = Number((entry.target as HTMLElement).dataset.revealDelay || 0);
          const delay = Math.min(540, baseDelay);
          window.setTimeout(() => {
            entry.target.classList.add('is-visible');
          }, delay);
          observer.unobserve(entry.target);
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -8% 0px' }
    );

    root.querySelectorAll<HTMLElement>('[data-reveal]').forEach((el) => {
      el.classList.add('reveal-on-scroll');
      observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  return (
    <section ref={sectionRef} id="ai-features" className="scroll-mt-24">
      <div className="glass-panel overflow-hidden rounded-3xl p-6 md:p-10">
        <div className="mx-auto max-w-3xl text-center">
          <span
            data-reveal
            data-reveal-delay="0"
            className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-primary"
          >
            <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
            AI inside
          </span>
          <h2
            data-reveal
            data-reveal-delay="80"
            className="premium-title mt-4 text-3xl leading-tight text-foreground md:text-4xl"
          >
            Your team's AI co-pilot for Nigerian property
          </h2>
          <p
            data-reveal
            data-reveal-delay="140"
            className="mt-3 text-base text-muted-foreground md:text-lg"
          >
            From listing copy and voice rent reminders to predictive maintenance and revenue
            forecasting — the platform does the heavy lifting so you can focus on closing deals and
            keeping homes happy.
          </p>
        </div>

        <div className="mt-10 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {CAPABILITIES.map((capability, index) => (
            <CapabilityCard key={capability.key} capability={capability} index={index} />
          ))}
        </div>

        <div
          data-reveal
          data-reveal-delay="120"
          className="mt-8 flex flex-col items-start gap-3 rounded-2xl border border-border bg-muted/40 p-5 sm:flex-row sm:items-center sm:justify-between"
        >
          <div className="flex items-start gap-3 sm:items-center">
            <ShieldCheck className="h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
            <p className="text-sm text-muted-foreground">
              And more under the hood — AI tenant screening, dispute prediction, document
              intelligence (KYC + lease parsing), and an in-app assistant chat. All gated by RBAC,
              audit-logged, and built on Supabase + Nigerian payment rails.
            </p>
          </div>
          <a
            href="#pricing"
            className="inline-flex shrink-0 items-center justify-center rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
          >
            See plans
          </a>
        </div>
      </div>
    </section>
  );
}

export default AiFeaturesSection;
