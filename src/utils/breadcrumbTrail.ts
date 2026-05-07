/** Human-readable labels for common path segments (first segment match). */
const SEGMENT_LABELS: Record<string, string> = {
  dashboard: 'Dashboard',
  admin: 'Admin',
  owner: 'Owner',
  tenant: 'Tenant',
  agent: 'Agent',
  manager: 'Manager',
  vendor: 'Vendor',
  properties: 'Properties',
  settings: 'Settings',
  finance: 'Finance',
  maintenance: 'Maintenance',
  documents: 'Documents',
  notifications: 'Notifications',
  profile: 'Profile',
  accounting: 'Accounting',
  crm: 'CRM',
  pipeline: 'Pipeline',
  leads: 'Leads',
  organization: 'Organization',
  setup: 'Setup',
  'maintenance-tickets': 'Service tickets',
  'service-tickets': 'Service tickets',
  'facility-manager': 'Facility',
  tickets: 'Tickets',
  payments: 'Payments',
  subscription: 'Subscription',
  reports: 'Reports',
  templates: 'Templates',
  inspections: 'Inspections',
  history: 'History',
  database: 'Database',
  messages: 'Messages',
  onboarding: 'Onboarding',
  'tenant-management': 'Tenant management',
  verification: 'Verification',
  hub: 'Hub',
  analytics: 'Analytics',
  executive: 'Executive',
  billing: 'Billing',
  users: 'Users',
  roles: 'Roles',
  support: 'Support',
  features: 'Features',
  'tour-requests': 'Tour requests',
  'white-label-preview': 'White label',
  shortlets: 'Short-lets',
  rent: 'Rent',
  tenants: 'Tenants',
  community: 'Community',
  announcements: 'Announcements',
};

function looksLikeId(segment: string): boolean {
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(segment))
    return true;
  if (/^[0-9a-f]{24,}$/i.test(segment)) return true;
  return false;
}

function formatSegment(segment: string): string {
  if (looksLikeId(segment)) return 'Details';
  if (SEGMENT_LABELS[segment]) return SEGMENT_LABELS[segment];
  return segment
    .split('-')
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');
}

export type BreadcrumbTrailItem = { label: string; href?: string };

/**
 * Builds a trail: Home → …intermediate path segments… → current page title (no href on last).
 */
export function buildBreadcrumbTrail(
  pathname: string,
  pageTitle: string,
  homeHref: string
): BreadcrumbTrailItem[] {
  const pathOnly = pathname.split('?')[0] || '/';
  const segments = pathOnly.split('/').filter(Boolean);

  const items: BreadcrumbTrailItem[] = [{ label: 'Home', href: homeHref }];

  if (segments.length === 0) {
    items.push({ label: pageTitle });
    return items;
  }

  let acc = '';
  for (let i = 0; i < segments.length - 1; i++) {
    acc += `/${segments[i]}`;
    items.push({
      label: formatSegment(segments[i]),
      href: acc,
    });
  }

  items.push({ label: pageTitle });
  return items;
}
