
import { Home } from 'lucide-react';
import React from 'react';
import { 
  NavItem, 
  getAdminNav, 
  getPropertiesNav, 
  getShortletsNav,
  getTenantsNav, 
  getFinanceNav, 
  getMaintenanceNav, 
  getAnalyticsNav,
  getReportsNav, 
  getVendorNav, 
  getCommonNav 
} from './nav-config';

export const createNavItems = (userRole: string | null, isAdmin: boolean, isVendor: boolean): NavItem[] => {
  const dashboardHref = userRole === 'tenant' 
    ? '/tenant/dashboard' 
    : isAdmin 
      ? '/admin/dashboard' 
      : '/dashboard';

  const navItems = [
    // Dashboard
    {
      title: userRole === 'tenant' ? 'Tenant Portal' : 'Dashboard',
      href: dashboardHref,
      icon: React.createElement(Home, { className: "h-4 w-4" }),
      isVisible: true,
    },
    getAdminNav(isAdmin),
    getPropertiesNav(userRole),
    getShortletsNav(userRole),
    getTenantsNav(userRole),
    getAnalyticsNav(userRole),
    getFinanceNav(userRole),
    getMaintenanceNav(userRole),
    getReportsNav(userRole),
    getVendorNav(isVendor),
    ...getCommonNav(userRole),
  ];

  return navItems.filter(Boolean) as NavItem[];
};
