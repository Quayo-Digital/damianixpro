export type CrmDealStage = 'lead' | 'inspection' | 'negotiation' | 'closed';
export type CrmDealOutcome = 'won' | 'lost' | null;

export interface CrmLead {
  id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  source: string | null;
  notes: string | null;
  property_id: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface CrmDeal {
  id: string;
  lead_id: string | null;
  property_id: string | null;
  title: string;
  stage: CrmDealStage;
  outcome: CrmDealOutcome;
  assigned_agent_id: string | null;
  created_by: string;
  budget_min: number | null;
  budget_max: number | null;
  currency: string;
  next_follow_up_at: string | null;
  created_at: string;
  updated_at: string;
  lead?: CrmLead | null;
}

export interface CrmInspection {
  id: string;
  deal_id: string;
  scheduled_start: string;
  scheduled_end: string | null;
  status: string;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface CrmReminder {
  id: string;
  deal_id: string;
  remind_at: string;
  body: string | null;
  completed_at: string | null;
  created_by: string | null;
  created_at: string;
  deal?: { id: string; title: string; stage: string } | null;
}

export type KanbanColumnId = 'lead' | 'inspection' | 'negotiation' | 'won' | 'lost';

export type CrmPropertySummary = {
  id: string;
  name: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
};

export type CrmLeadDetailResponse = {
  lead: CrmLead;
  deals: CrmDeal[];
  inspections: CrmInspection[];
  property: CrmPropertySummary | null;
};

export type CrmAgentOption = { id: string; label: string };
