import { Fragment } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { buildBreadcrumbTrail, type BreadcrumbTrailItem } from '@/utils/breadcrumbTrail';
import { cn } from '@/lib/utils';

export type AppBreadcrumbProps = {
  pageTitle: string;
  homeHref: string;
  /** When set, replaces auto-generated crumbs from the URL. */
  items?: BreadcrumbTrailItem[] | null;
  className?: string;
};

export function AppBreadcrumb({ pageTitle, homeHref, items, className }: AppBreadcrumbProps) {
  const { pathname } = useLocation();
  const trail = items ?? buildBreadcrumbTrail(pathname, pageTitle, homeHref);

  if (trail.length <= 1) {
    return null;
  }

  return (
    <Breadcrumb className={cn('text-muted-foreground', className)}>
      <BreadcrumbList className="flex-wrap gap-y-1">
        {trail.map((crumb, index) => {
          const isLast = index === trail.length - 1;
          return (
            <Fragment key={`${index}-${crumb.label}`}>
              {index > 0 && <BreadcrumbSeparator />}
              <BreadcrumbItem className="min-w-0">
                {isLast || !crumb.href ? (
                  <BreadcrumbPage className="max-w-[min(100vw-6rem,28rem)] truncate font-medium">
                    {crumb.label}
                  </BreadcrumbPage>
                ) : (
                  <BreadcrumbLink asChild>
                    <Link
                      to={crumb.href}
                      className="max-w-[12rem] truncate hover:text-foreground sm:max-w-xs"
                    >
                      {crumb.label}
                    </Link>
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
            </Fragment>
          );
        })}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
