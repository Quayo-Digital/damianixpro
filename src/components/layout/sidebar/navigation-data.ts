import { Home, Building2, FileSpreadsheet } from 'lucide-react';
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
  getCrmPipelineNav,
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

  const setupMigrationVisible = ['owner', 'admin', 'super_admin'].includes(userRole ?? '');

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
    ...(setupMigrationVisible
      ? ([
          {
            title: 'Setup & migration',
            href: '/organization/setup',
            icon: React.createElement(FileSpreadsheet, { className: 'h-4 w-4' }),
            isVisible: true,
            isActive: (pathname: string) => pathname.startsWith('/organization/setup'),
          },
        ] satisfies NavItem[])
      : []),
    getPropertiesNav(userRole),
    getShortletsNav(userRole),
    getTenantsNav(userRole),
    getAnalyticsNav(userRole),
    getFinanceNav(userRole),
    getOwnerSubscriptionNav(userRole),
    getVerificationNav(userRole),
    getMaintenanceNav(userRole),
    getReportsNav(userRole),
    getCrmPipelineNav(userRole),
    getVendorNav(isVendor),
    ...getCommonNav(userRole),
  ];

  return navItems.filter(Boolean) as NavItem[];
};
