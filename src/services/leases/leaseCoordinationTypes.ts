export type CoordinationTaskStatus = 'pending' | 'in_progress' | 'done' | 'skipped';

export type CoordinationPhase = 'post_executed' | 'pre_move_in' | 'move_in_week' | 'stabilization';

export interface CoordinationTask {
  id: string;
  key: string;
  title: string;
  description?: string;
  /** Suggested owning function: leasing, ops, finance, etc. */
  owner_team?: string;
  status: CoordinationTaskStatus;
  sort_order: number;
  due_at?: string | null;
  completed_at?: string | null;
}

export interface LeaseCoordinationChecklistRow {
  id: string;
  lease_id: string;
  property_id: string;
  tenant_id: string;
  phase: CoordinationPhase;
  tasks: CoordinationTask[];
  ai_coordination_hint: string | null;
  created_at: string;
  updated_at: string;
}
