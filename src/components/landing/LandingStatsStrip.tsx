import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Building2, CircleDollarSign, UsersRound, type LucideIcon } from 'lucide-react';

import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { formatCompactNGN, formatCountNG } from '@/lib/landingStatsFormat';
import {
  FALLBACK_LANDING_STATS,
  usePublicLandingStats,
  type PublicLandingStats,
} from '@/hooks/usePublicLandingStats';

function useAnimatedScalar(target: number, enabled: boolean, duration = 1400) {
  const [val, setVal] = useState(0);

  useEffect(() => {
    if (!enabled || !Number.isFinite(target)) {
      setVal(target);
      return;
    }

    let raf = 0;
    let start: number | null = null;
    const from = 0;

    const tick = (now: number) => {
      if (start === null) start = now;
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setVal(from + (target - from) * eased);
      if (t < 1) raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, enabled, duration]);

  return val;
}

type StatRow = {
  key: string;
  label: string;
  sublabel: string;
  icon: LucideIcon;
  rawKey: keyof PublicLandingStats;
  format: (animated: number, raw: PublicLandingStats) => ReactNode;
};

const STATS: StatRow[] = [
  {
    key: 'properties',
    label: 'Properties managed',
    sublabel: 'Across the platform',
    icon: Building2,
    rawKey: 'properties_count',
    format: (animated) => (
      <>
        <span className="tabular-nums tracking-tight">{formatCountNG(Math.round(animated))}</span>
        <span className="inline-block animate-stat-plus-pop text-primary" aria-hidden="true">
          +
        </span>
      </>
    ),
  },
  {
    key: 'volume',
    label: 'Rent collected',
    sublabel: 'Successful payments (all time)',
    icon: CircleDollarSign,
    rawKey: 'successful_rent_volume_ngn',
    format: (animated) => (
      <>
        <span className="tabular-nums tracking-tight">{formatCompactNGN(animated)}</span>
        <span className="inline-block animate-stat-plus-pop text-primary" aria-hidden="true">
          +
        </span>
      </>
    ),
  },
  {
    key: 'operators',
    label: 'Landlords & operators',
    sublabel: 'Owners, agents & managers',
    icon: UsersRound,
    rawKey: 'landlords_managers_count',
    format: (animated) => (
      <>
        <span className="tabular-nums tracking-tight">{formatCountNG(Math.round(animated))}</span>
        <span className="inline-block animate-stat-plus-pop text-primary" aria-hidden="true">
          +
        </span>
      </>
    ),
  },
];

function StatCard({
  stat,
  raw,
  animate,
}: {
  stat: StatRow;
  raw: PublicLandingStats;
  animate: boolean;
}) {
  const target = raw[stat.rawKey];
  const animated = useAnimatedScalar(
    target,
    animate,
    stat.rawKey === 'successful_rent_volume_ngn' ? 1600 : 1300
  );
  const Icon = stat.icon;

  return (
    <div
      data-reveal
      data-reveal-delay="90"
      className={cn(
        'reveal-on-scroll reveal-card group relative overflow-hidden rounded-2xl border border-border bg-card px-5 py-6 shadow-sm',
        'transition-shadow duration-300 hover:shadow-md hover:ring-1 hover:ring-primary/15'
      )}
    >
      <div
        className="pointer-events-none absolute inset-0 bg-gradient-to-br from-primary/[0.06] via-transparent to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100"
        aria-hidden="true"
      />
      <div className="relative flex flex-col items-center gap-4 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary shadow-inner ring-1 ring-primary/15 transition-transform duration-300 group-hover:scale-[1.03]">
          <Icon className="h-7 w-7" strokeWidth={1.75} aria-hidden />
        </div>
        <div className="space-y-1">
          <p
            className="flex items-baseline justify-center gap-0.5 text-3xl font-bold tracking-tight text-foreground sm:text-4xl"
            aria-live="polite"
          >
            {stat.format(animated, raw)}
          </p>
          <p className="text-sm font-medium text-foreground">{stat.label}</p>
          <p className="text-xs text-muted-foreground">{stat.sublabel}</p>
        </div>
      </div>
    </div>
  );
}

function StatsSkeleton() {
  return (
    <div className="mx-auto grid w-full max-w-6xl grid-cols-1 gap-4 sm:grid-cols-3">
      {[1, 2, 3].map((i) => (
        <div key={i} className="rounded-2xl border border-border bg-card px-5 py-6 shadow-sm">
          <div className="flex flex-col items-center gap-4">
            <Skeleton className="h-14 w-14 rounded-2xl" />
            <div className="w-full space-y-2 text-center">
              <Skeleton className="mx-auto h-9 w-28 sm:h-10 sm:w-32" />
              <Skeleton className="mx-auto h-4 w-40" />
              <Skeleton className="mx-auto h-3 w-48" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function LandingStatsStrip() {
  const stripRef = useRef<HTMLElement>(null);
  const { data, isLoading, isError } = usePublicLandingStats();
  const raw = isError || !data ? FALLBACK_LANDING_STATS : data;
  const showLive = Boolean(data) && !isError;
  const animate = !isLoading && Boolean(data) && !isError;

  useEffect(() => {
    if (isLoading) return;
    const root = stripRef.current;
    if (!root) return;

    const getDelayScale = () => {
      if (window.matchMedia('(max-width: 640px)').matches) return 1.22;
      if (window.matchMedia('(max-width: 1024px)').matches) return 1.05;
      return 0.82;
    };

    const revealed = new WeakSet<Element>();
    let delayScale = getDelayScale();

    const handleResize = () => {
      delayScale = getDelayScale();
    };

    window.addEventListener('resize', handleResize, { passive: true });

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting || revealed.has(entry.target)) return;
          revealed.add(entry.target);

          const baseDelay = Number((entry.target as HTMLElement).dataset.revealDelay || 0);
          const delay = Math.round(Math.max(0, Math.min(520, baseDelay * delayScale)));
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

    return () => {
      observer.disconnect();
      window.removeEventListener('resize', handleResize);
    };
  }, [isLoading]);

  return (
    <section ref={stripRef} className="border-y border-border bg-background px-6 py-8">
      <div className="mx-auto mb-5 flex max-w-6xl flex-col items-center justify-between gap-2 text-center sm:flex-row sm:text-left">
        <div>
          <h2 className="premium-title text-lg font-semibold tracking-tight text-foreground md:text-xl">
            Platform reach
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Live totals from our database — updated when you load this page.
          </p>
        </div>
        {showLive ? (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-emerald-700 dark:text-emerald-400">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
            </span>
            Live
          </span>
        ) : (
          <span className="rounded-full border border-border bg-muted/40 px-3 py-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {isLoading ? 'Loading…' : 'Offline estimate'}
          </span>
        )}
      </div>

      {isLoading ? (
        <StatsSkeleton />
      ) : (
        <div className="mx-auto grid w-full max-w-6xl grid-cols-1 gap-4 sm:grid-cols-3">
          {STATS.map((stat) => (
            <StatCard key={stat.key} stat={stat} raw={raw} animate={animate} />
          ))}
        </div>
      )}
    </section>
  );
}
