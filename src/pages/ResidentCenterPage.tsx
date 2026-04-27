import { Navigate, Link } from 'react-router-dom';
import { PageLayout } from '@/components/layout/PageLayout';
import { PageContent } from '@/components/layout/PageContent';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useAuthSession } from '@/contexts/auth';
import { useEnhancedTenantData } from '@/hooks/useEnhancedTenantData';
import {
  CreditCard,
  History,
  Megaphone,
  MessageSquare,
  Wrench,
  FileText,
  Bell,
  Smartphone,
  Building2,
  Users,
} from 'lucide-react';
import { RoleScreeningBanner } from '@/components/screening/RoleScreeningBanner';

const tiles = [
  {
    title: 'Pay rent & fees',
    description:
      'Make payments online from any device. Set aside time each month or pay early when your manager enables it.',
    href: '/tenant/dashboard?tab=payments',
    icon: CreditCard,
    cta: 'Open payments',
  },
  {
    title: 'Payment history',
    description: 'Review past rent and fee transactions in one place.',
    href: '/payments',
    icon: History,
    cta: 'View history',
  },
  {
    title: 'Announcements',
    description: 'Building or community updates from your property manager.',
    href: '/tenant/announcements',
    icon: Megaphone,
    cta: 'See announcements',
  },
  {
    title: 'Messages',
    description: 'Direct messages with your landlord or property manager.',
    href: '/messages',
    icon: MessageSquare,
    cta: 'Open messages',
  },
  {
    title: 'Community board',
    description: 'Building-scoped posts you share with neighbors (same property).',
    href: '/tenant/community',
    icon: Users,
    cta: 'Open community',
  },
  {
    title: 'Maintenance',
    description:
      'Submit requests with photos, track status, and see progress without calling the office.',
    href: '/tenant/dashboard?tab=maintenance',
    icon: Wrench,
    cta: 'Maintenance hub',
  },
  {
    title: 'Documents',
    description: 'Leases, notices, and files shared with your household.',
    href: '/tenant/dashboard?tab=documents',
    icon: FileText,
    cta: 'View documents',
  },
] as const;

export default function ResidentCenterPage() {
  const { user, userRole } = useAuthSession();
  const { lease, notifications, loading } = useEnhancedTenantData();

  if (!user || userRole !== 'tenant') {
    return <Navigate to="/unauthorized" replace />;
  }

  return (
    <PageLayout>
      <PageContent>
        <RoleScreeningBanner />
        <div className="mx-auto max-w-5xl space-y-8">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <Building2 className="h-8 w-8 text-primary" aria-hidden />
              <h1 className="text-3xl font-bold tracking-tight">Resident Center</h1>
            </div>
            <p className="max-w-2xl text-muted-foreground">
              Your home for rent, updates, maintenance, and community — same secure account on{' '}
              <span className="inline-flex items-center gap-1 font-medium text-foreground">
                <Smartphone className="h-4 w-4" aria-hidden />
                mobile
              </span>{' '}
              and desktop. Everything below links to tools already on the platform.
            </p>
            {lease && (
              <div className="flex flex-wrap gap-2 pt-1">
                <Badge variant="secondary">{lease.property_title}</Badge>
                {lease.property_address ? (
                  <Badge variant="outline" className="font-normal">
                    {lease.property_address}
                  </Badge>
                ) : null}
              </div>
            )}
          </div>

          <section aria-labelledby="resident-center-actions">
            <h2 id="resident-center-actions" className="sr-only">
              Resident actions
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {tiles.map((tile) => (
                <Card key={tile.href} className="flex flex-col transition-shadow hover:shadow-md">
                  <CardHeader className="pb-2">
                    <div className="flex items-center gap-2">
                      <tile.icon className="h-5 w-5 text-primary" aria-hidden />
                      <CardTitle className="text-lg">{tile.title}</CardTitle>
                    </div>
                    <CardDescription>{tile.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="mt-auto pt-0">
                    <Button asChild variant="secondary" className="w-full sm:w-auto">
                      <Link to={tile.href}>{tile.cta}</Link>
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>

          <Separator />

          <section aria-labelledby="recent-updates-heading" className="space-y-3">
            <div className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-muted-foreground" aria-hidden />
              <h2 id="recent-updates-heading" className="text-lg font-semibold">
                Recent updates
              </h2>
            </div>
            {loading ? (
              <p className="text-sm text-muted-foreground">Loading…</p>
            ) : notifications.length > 0 ? (
              <ul className="space-y-2 rounded-lg border bg-muted/30 p-4">
                {notifications.slice(0, 5).map((n) => (
                  <li key={n.id} className="text-sm">
                    <span className="font-medium">{n.title}</span>
                    {n.message ? (
                      <span className="block text-muted-foreground">{n.message}</span>
                    ) : null}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">
                No in-app alerts right now. Check{' '}
                <Link
                  to="/tenant/announcements"
                  className="text-primary underline-offset-4 hover:underline"
                >
                  announcements
                </Link>{' '}
                for building-wide news.
              </p>
            )}
          </section>

          <p className="text-xs text-muted-foreground">
            Mass text and email campaigns, recurring payment mandates, branded portals, and shared
            resident directories can layer onto this hub as your organization enables them — the
            Resident Center stays the single entry point for residents.
          </p>
        </div>
      </PageContent>
    </PageLayout>
  );
}
