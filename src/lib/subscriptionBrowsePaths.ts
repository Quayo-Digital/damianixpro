import type { UserRole } from '@/contexts/auth/types';

/** Public pricing for agents, vendors, tenants, and other non–portfolio-owner roles. */
export const PRICING_AGENTS_PATH = '/pricing/agents';

/** Compare or purchase plans: owners use in-app subscription; others use dedicated agent/partner pricing. */
export function subscriptionBrowsePath(userRole: UserRole | null | undefined): string {
  if (userRole === 'owner') return '/owner/subscription';
  return PRICING_AGENTS_PATH;
}
