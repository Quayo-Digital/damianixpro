import { Home, Building2 } from 'lucide-react';
import React from 'react';
import {
  NavItem,
  getAdminNav,
  getPropertiesNav,
  getShortletsNav,
  getTenantsNav,
  getFinanceNav,
  getOwnerSubscriptionNav,
  getVerificationNav,
  getMaintenanceNav,
  getAnalyticsNav,
  getReportsNav,
  getVendorNav,
  getCommonNav,
} from './nav-config';
import { getDefaultDashboardPathForRole } from '@/utils/authRedirect';
import type { UserRole } from '@/contexts/auth/types';

export const createNavItems = (
  userRole: string | null,
  isAdmin: boolean,
  isVendor: boolean
): NavItem[] => {
  const dashboardHref = getDefaultDashboardPathForRole((userRole as UserRole) ?? null);

  const navItems = [
    // Dashboard
    {
      title: userRole === 'tenant' ? 'Tenant Portal' : 'Dashboard',
      href: dashboardHref,
      icon: React.createElement(Home, { className: 'h-4 w-4' }),
      isVisible: true,
    },
    ...(userRole === 'tenant'
      ? [
          {
            title: 'Resident Center',
            href: '/resident-center',
            icon: React.createElement(Building2, { className: 'h-4 w-4' }),
            isVisible: true,
            isActive: (pathname: string) => pathname.startsWith('/resident-center'),
          } satisfies NavItem,
        ]
      : []),
    getAdminNav(isAdmin),
    getPropertiesNav(userRole),
    getShortletsNav(userRole),
    getTenantsNav(userRole),
    getAnalyticsNav(userRole),
    getFinanceNav(userRole),
    getOwnerSubscriptionNav(userRole),
    getVerificationNav(userRole),
    getMaintenanceNav(userRole),
    getReportsNav(userRole),
    getVendorNav(isVendor),
    ...getCommonNav(userRole),
  ];

  return navItems.filter(Boolean) as NavItem[];
};
