import { MaintenanceRequest, MaintenanceUpdate } from './maintenance-data';

export type StatusType = 'open' | 'in_progress' | 'completed';
export type UrgencyType = 'low' | 'medium' | 'high';

// Re-export the types to ensure consistency
export type { MaintenanceRequest, MaintenanceUpdate };
