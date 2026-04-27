/**
 * Legacy `/tenant-portal#...` URLs redirect to the enhanced dashboard (query tabs)
 * or dedicated tenant routes. Keep this map in sync with `TenantPortalRedirect`.
 */
export function pathForTenantPortalHash(hash: string): string {
  const key = hash.replace(/^#/, '').trim().toLowerCase();
  switch (key) {
    case '':
    case 'dashboard':
      return '/tenant/dashboard?tab=overview';
    case 'messages':
      return '/messages';
    case 'announcements':
      return '/tenant/announcements';
    case 'community':
      return '/tenant/community';
    case 'payments':
      return '/tenant/dashboard?tab=payments';
    case 'maintenance':
      return '/tenant/dashboard?tab=maintenance';
    case 'inspections':
      return '/tenant/inspections';
    case 'financial':
      return '/tenant/financial';
    case 'templates':
      return '/tenant/templates';
    case 'documents':
      return '/tenant/dashboard?tab=documents';
    default:
      return '/tenant/dashboard?tab=overview';
  }
}

/** Maps old portal section keys to app paths (for programmatic navigation). */
export const TENANT_SECTION_PATH: Record<string, string> = {
  dashboard: '/tenant/dashboard?tab=overview',
  messages: '/messages',
  announcements: '/tenant/announcements',
  community: '/tenant/community',
  payments: '/tenant/dashboard?tab=payments',
  maintenance: '/tenant/dashboard?tab=maintenance',
  inspections: '/tenant/inspections',
  financial: '/tenant/financial',
  templates: '/tenant/templates',
  documents: '/tenant/dashboard?tab=documents',
};

export function pathForTenantSection(section: string): string {
  const key = section.trim().toLowerCase();
  return TENANT_SECTION_PATH[key] ?? '/tenant/dashboard?tab=overview';
}
