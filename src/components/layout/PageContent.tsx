import React from 'react';
import { cn } from '@/lib/utils';
import { ContextualGuide } from '@/components/ui/ContextualGuide';
import { AppBreadcrumb } from '@/components/layout/AppBreadcrumb';
import { useAuthSession } from '@/contexts/auth';
import { getDefaultDashboardPathForRole } from '@/utils/authRedirect';
import type { UserRole } from '@/contexts/auth/types';
import type { BreadcrumbTrailItem } from '@/utils/breadcrumbTrail';
import { BodyText, PageTitle } from '@/components/ui/typography';

interface PageContentProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
  /** Merged onto the outer wrapper for page-specific layout (grids, max-width, bleed). */
  className?: string;
  /** Set false to hide breadcrumb row. */
  showBreadcrumbs?: boolean;
  /** Optional override for breadcrumb trail (otherwise derived from the URL + title). */
  breadcrumbItems?: BreadcrumbTrailItem[] | null;
}

export function PageContent({
  title,
  description,
  children,
  actions,
  className,
  showBreadcrumbs = true,
  breadcrumbItems,
}: PageContentProps) {
  const { userRole } = useAuthSession();
  const homeHref = getDefaultDashboardPathForRole((userRole ?? 'tenant') as UserRole);

  return (
    <div className={cn('space-y-5 sm:space-y-6', className)}>
      {showBreadcrumbs && (
        <AppBreadcrumb pageTitle={title} homeHref={homeHref} items={breadcrumbItems ?? undefined} />
      )}
      <div className="page-header-shell flex flex-col items-start justify-between gap-3 sm:gap-4 md:flex-row md:items-center">
        <div className="min-w-0 space-y-1.5">
          <PageTitle>{title}</PageTitle>
          {description && <BodyText>{description}</BodyText>}
        </div>
        {actions && <div className="w-full flex-shrink-0 pt-1 md:w-auto md:pt-0">{actions}</div>}
      </div>
      <ContextualGuide />
      {children}
    </div>
  );
}
