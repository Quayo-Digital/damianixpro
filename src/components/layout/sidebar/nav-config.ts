import {
  Building,
  CreditCard,
  FileText,
  Home,
  Settings,
  Users,
  MessageSquare,
  Wrench,
  Network,
  Banknote,
  Shield,
  Lightbulb,
  Headset,
  BarChart3,
  TrendingUp,
  Calendar,
  Search,
  Camera,
  Crown,
  Palette,
} from 'lucide-react';
import React from 'react';

export type NavItem = {
  title: string;
  href: string;
  icon: React.ReactNode;
  isVisible: boolean;
  isActive?: (pathname: string) => boolean;
  children?: NavItem[];
};

export const getAdminNav = (isAdmin: boolean): NavItem | null => {
  if (!isAdmin) return null;
  return {
    title: 'Admin',
    href: '/admin/dashboard',
    icon: React.createElement(Shield, { className: 'h-4 w-4' }),
    isVisible: true,
    isActive: (pathname) => pathname.startsWith('/admin'),
    children: [
      {
        title: 'Users',
        href: '/admin/users',
        icon: React.createElement(Users, { className: 'h-4 w-4' }),
        isVisible: true,
      },
      {
        title: 'Roles',
        href: '/admin/roles',
        icon: React.createElement(Network, { className: 'h-4 w-4' }),
        isVisible: true,
      },
      {
        title: 'Support',
        href: '/admin/support',
        icon: React.createElement(Headset, { className: 'h-4 w-4' }),
        isVisible: true,
      },
      {
        title: 'Billing',
        href: '/admin/billing',
        icon: React.createElement(CreditCard, { className: 'h-4 w-4' }),
        isVisible: true,
      },
      {
        title: 'Features',
        href: '/admin/features',
        icon: React.createElement(Lightbulb, { className: 'h-4 w-4' }),
        isVisible: true,
      },
      {
        title: '3D Tour Requests',
        href: '/admin/tour-requests',
        icon: React.createElement(Camera, { className: 'h-4 w-4' }),
        isVisible: true,
      },
      {
        title: 'White Label Preview',
        href: '/admin/white-label-preview',
        icon: React.createElement(Palette, { className: 'h-4 w-4' }),
        isVisible: true,
      },
    ],
  };
};

export const getPropertiesNav = (userRole: string | null): NavItem => ({
  // Owners/agents/admins see their own properties at /properties (role-filtered by useProperties)
  // /public/properties shows ALL listings - for tenants and public browsing only
  title: 'My Properties',
  href: '/properties',
  icon: React.createElement(Building, { className: 'h-4 w-4' }),
  isVisible: ['admin', 'super_admin', 'owner', 'agent', 'manager'].includes(userRole || ''),
  isActive: (pathname) => pathname === '/properties' || pathname.startsWith('/properties/'),
});

export const getShortletsNav = (userRole: string | null): NavItem => {
  const isVisible = ['admin', 'super_admin', 'owner'].includes(userRole || '');
  const children: NavItem[] = [];

  if (userRole === 'owner') {
    children.push(
      {
        title: 'My Short-Lets',
        href: '/owner/shortlets',
        icon: React.createElement(Calendar, { className: 'h-4 w-4' }),
        isVisible: true,
      },
      {
        title: 'Browse All',
        href: '/shortlets',
        icon: React.createElement(Search, { className: 'h-4 w-4' }),
        isVisible: true,
      }
    );
  }

  return {
    title: 'Short-Lets',
    href: userRole === 'owner' ? '/owner/shortlets' : '/shortlets',
    icon: React.createElement(Calendar, { className: 'h-4 w-4' }),
    isVisible: isVisible,
    isActive: (pathname) =>
      pathname.startsWith('/shortlets') || pathname.startsWith('/owner/shortlets'),
    children: children.length > 0 ? children : undefined,
  };
};

export const getTenantsNav = (userRole: string | null): NavItem => ({
  title: 'Tenants',
  href: '/tenant-management',
  icon: React.createElement(Users, { className: 'h-4 w-4' }),
  isVisible: ['admin', 'super_admin', 'owner', 'agent', 'manager'].includes(userRole || ''),
});

/** Owner plan & billing (required to create listings). */
export const getOwnerSubscriptionNav = (userRole: string | null): NavItem | null => {
  if (userRole !== 'owner') return null;
  return {
    title: 'Subscription',
    href: '/owner/subscription',
    icon: React.createElement(Crown, { className: 'h-4 w-4' }),
    isVisible: true,
    isActive: (pathname) => pathname.startsWith('/owner/subscription'),
  };
};

/** Identity + role screening hub (KYC, CAC, tenant screening). */
export const getVerificationNav = (userRole: string | null): NavItem | null => {
  const eligible = ['owner', 'tenant', 'agent', 'vendor', 'manager'];
  if (!eligible.includes(userRole || '')) return null;
  return {
    title: 'Verification',
    href: '/verification',
    icon: React.createElement(Shield, { className: 'h-4 w-4' }),
    isVisible: true,
    isActive: (pathname) => pathname.startsWith('/verification'),
  };
};

export const getFinanceNav = (userRole: string | null): NavItem => {
  // Exclude tenants since they have integrated payment management in their Enhanced Tenant Dashboard
  const isVisible = ['admin', 'super_admin', 'owner'].includes(userRole || '');
  let children: NavItem[] = [];
  if (userRole === 'admin' || userRole === 'super_admin') {
    children = [
      {
        title: 'Dashboard',
        href: '/admin/finance',
        icon: React.createElement(CreditCard, { className: 'h-4 w-4' }),
        isVisible: true,
      },
      {
        title: 'Payment Accounting',
        href: '/admin/accounting',
        icon: React.createElement(Banknote, { className: 'h-4 w-4' }),
        isVisible: true,
      },
    ];
  } else if (userRole === 'owner') {
    children = [
      {
        title: 'Overview',
        href: '/finance',
        icon: React.createElement(CreditCard, { className: 'h-4 w-4' }),
        isVisible: true,
      },
      {
        title: 'Payments',
        href: '/owner/payments',
        icon: React.createElement(Banknote, { className: 'h-4 w-4' }),
        isVisible: true,
      },
    ];
  }
  return {
    title: 'Finance',
    href: userRole === 'owner' ? '/finance' : '/admin/finance',
    icon: React.createElement(CreditCard, { className: 'h-4 w-4' }),
    isVisible: isVisible,
    isActive: (pathname) => {
      if (userRole === 'owner') return pathname === '/finance' || pathname === '/owner/payments';
      if (userRole === 'admin' || userRole === 'super_admin')
        return pathname.startsWith('/admin/finance') || pathname.startsWith('/admin/accounting');
      return pathname.startsWith('/finance');
    },
    children: children.length > 0 ? children : undefined,
  };
};

export const getMaintenanceNav = (userRole: string | null): NavItem => ({
  title: 'Maintenance',
  href: '/maintenance',
  icon: React.createElement(Wrench, { className: 'h-4 w-4' }),
  isVisible: ['admin', 'super_admin', 'owner', 'agent', 'manager', 'tenant'].includes(
    userRole || ''
  ),
});

export const getAnalyticsNav = (userRole: string | null): NavItem => {
  const isVisible = ['admin', 'super_admin', 'owner', 'agent', 'manager'].includes(userRole || '');
  return {
    title: 'Analytics',
    href: '/analytics',
    icon: React.createElement(BarChart3, { className: 'h-4 w-4' }),
    isVisible: isVisible,
    isActive: (pathname) =>
      pathname.startsWith('/analytics') ||
      pathname.startsWith('/live-data') ||
      pathname.startsWith('/production-testing'),
    children: [
      {
        title: 'Market Intelligence',
        href: '/analytics',
        icon: React.createElement(TrendingUp, { className: 'h-4 w-4' }),
        isVisible: true,
      },
      {
        title: 'Live Data Demo',
        href: '/live-data-demo',
        icon: React.createElement(BarChart3, { className: 'h-4 w-4' }),
        isVisible: true,
      },
      {
        title: 'System Testing',
        href: '/analytics-testing',
        icon: React.createElement(BarChart3, { className: 'h-4 w-4' }),
        isVisible: userRole === 'admin' || userRole === 'super_admin',
      },
      {
        title: 'Production Testing',
        href: '/production-testing',
        icon: React.createElement(BarChart3, { className: 'h-4 w-4' }),
        isVisible: userRole === 'admin' || userRole === 'super_admin',
      },
    ],
  };
};

export const getReportsNav = (userRole: string | null): NavItem => ({
  title: 'Reports',
  href: '/reports',
  icon: React.createElement(FileText, { className: 'h-4 w-4' }),
  isVisible: ['admin', 'super_admin', 'owner', 'agent', 'manager'].includes(userRole || ''),
});

export const getVendorNav = (isVendor: boolean): NavItem | null => {
  if (!isVendor) return null;
  return {
    title: 'Vendor Portal',
    href: '/vendor/dashboard',
    icon: React.createElement(Wrench, { className: 'h-4 w-4' }),
    isVisible: true,
    isActive: (pathname) => pathname.startsWith('/vendor'),
    children: [
      {
        title: 'Dashboard',
        href: '/vendor/dashboard',
        icon: React.createElement(Home, { className: 'h-4 w-4' }),
        isVisible: true,
      },
      {
        title: 'My Jobs',
        href: '/vendor/maintenance',
        icon: React.createElement(Wrench, { className: 'h-4 w-4' }),
        isVisible: true,
      },
    ],
  };
};

export const getCommonNav = (userRole: string | null): NavItem[] => [
  {
    title: 'Messages',
    href: '/messages',
    icon: React.createElement(MessageSquare, { className: 'h-4 w-4' }),
    isVisible: true,
  },
  {
    title: 'Templates',
    href: '/templates',
    icon: React.createElement(FileText, { className: 'h-4 w-4' }),
    isVisible: ['admin', 'super_admin', 'owner', 'agent', 'manager'].includes(userRole || ''),
  },
  {
    title: 'Leases',
    href: '/leases',
    icon: React.createElement(FileText, { className: 'h-4 w-4' }),
    isVisible: false, // Hiding this link
  },
  {
    title: 'Documents',
    href: '/documents',
    icon: React.createElement(FileText, { className: 'h-4 w-4' }),
    isVisible: true,
  },
  {
    title: 'Settings',
    href: '/settings',
    icon: React.createElement(Settings, { className: 'h-4 w-4' }),
    isVisible: true,
  },
];
