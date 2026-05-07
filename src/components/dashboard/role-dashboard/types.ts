import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';

export type RoleDashboardStat = {
  title: string;
  value: string;
  icon: ReactNode;
  description?: string;
  trend?: { value: number; isPositive: boolean };
};

export type RoleDashboardQuickAction = {
  label: string;
  to: string;
  icon?: LucideIcon;
  variant?: 'default' | 'outline';
};

export type RoleDashboardActivity = {
  id: string;
  title: string;
  meta?: string;
  time?: string;
  icon?: ReactNode;
};
