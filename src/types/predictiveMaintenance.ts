// Predictive Maintenance System Types

export type MaintenanceCategory =
  | 'plumbing'
  | 'electrical'
  | 'hvac'
  | 'structural'
  | 'appliances'
  | 'security'
  | 'exterior'
  | 'interior'
  | 'landscaping';

export type MaintenancePriority = 'low' | 'medium' | 'high' | 'critical';

export type MaintenanceStatus = 'predicted' | 'scheduled' | 'in_progress' | 'completed' | 'overdue';

export type RiskLevel = 'low' | 'moderate' | 'high' | 'critical';

export type SeasonalFactor =
  | 'spring'
  | 'summer'
  | 'fall'
  | 'winter'
  | 'rainy_season'
  | 'dry_season';

export interface EquipmentData {
  id: string;
  property_id: string;
  equipment_type: string;
  brand: string;
  model: string;
  installation_date: string;
  last_service_date?: string;
  warranty_expiry?: string;
  expected_lifespan_years: number;
  current_condition: 'excellent' | 'good' | 'fair' | 'poor' | 'critical';
  usage_intensity: 'low' | 'medium' | 'high';
  maintenance_history: MaintenanceRecord[];
  sensor_data?: SensorReading[];
  created_at: string;
  updated_at: string;
}

export interface MaintenanceRecord {
  id: string;
  equipment_id: string;
  property_id: string;
  maintenance_type: 'preventive' | 'corrective' | 'emergency' | 'inspection';
  category: MaintenanceCategory;
  description: string;
  cost: number;
  performed_date: string;
  performed_by: string;
  parts_replaced?: string[];
  notes?: string;
  before_photos?: string[];
  after_photos?: string[];
  created_at: string;
}

export interface SensorReading {
  id: string;
  equipment_id: string;
  sensor_type:
    | 'temperature'
    | 'humidity'
    | 'pressure'
    | 'vibration'
    | 'current'
    | 'voltage'
    | 'flow_rate';
  value: number;
  unit: string;
  timestamp: string;
  is_anomaly: boolean;
  threshold_min?: number;
  threshold_max?: number;
}

export interface PredictiveAlert {
  id: string;
  property_id: string;
  equipment_id?: string;
  category: MaintenanceCategory;
  title: string;
  description: string;
  predicted_failure_date: string;
  confidence_score: number; // 0-1
  risk_level: RiskLevel;
  priority: MaintenancePriority;
  estimated_cost: number;
  potential_savings: number;
  recommended_actions: RecommendedAction[];
  factors: PredictionFactor[];
  status: MaintenanceStatus;
  created_at: string;
  updated_at: string;
  resolved_at?: string;
}

export interface RecommendedAction {
  action: string;
  urgency: 'immediate' | 'within_week' | 'within_month' | 'within_quarter';
  estimated_cost: number;
  estimated_duration: string;
  required_expertise: 'basic' | 'intermediate' | 'professional' | 'specialist';
  parts_needed?: string[];
  tools_needed?: string[];
}

export interface PredictionFactor {
  factor: string;
  impact_weight: number; // 0-1
  description: string;
  data_source: 'historical' | 'sensor' | 'environmental' | 'usage' | 'age';
}

export interface MaintenanceSchedule {
  id: string;
  property_id: string;
  equipment_id?: string;
  category: MaintenanceCategory;
  task_name: string;
  description: string;
  frequency_type:
    | 'daily'
    | 'weekly'
    | 'monthly'
    | 'quarterly'
    | 'semi_annual'
    | 'annual'
    | 'conditional';
  frequency_value: number;
  last_completed?: string;
  next_due: string;
  estimated_duration: string;
  estimated_cost: number;
  assigned_to?: string;
  priority: MaintenancePriority;
  seasonal_adjustments?: SeasonalAdjustment[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface SeasonalAdjustment {
  season: SeasonalFactor;
  frequency_multiplier: number;
  priority_adjustment: number;
  notes?: string;
}

export interface MaintenanceBudget {
  id: string;
  property_id: string;
  year: number;
  quarter?: number;
  category: MaintenanceCategory;
  budgeted_amount: number;
  spent_amount: number;
  predicted_amount: number;
  variance: number;
  last_updated: string;
}

export interface PropertyMaintenanceProfile {
  property_id: string;
  property_age: number;
  property_type: string;
  square_footage: number;
  occupancy_rate: number;
  climate_zone: string;
  maintenance_history_score: number; // 0-100
  equipment_condition_score: number; // 0-100
  risk_factors: string[];
  maintenance_complexity: 'low' | 'medium' | 'high';
  annual_maintenance_cost: number;
  predictive_accuracy: number; // 0-100
  last_assessment: string;
}

export interface MaintenanceInsight {
  id: string;
  property_id: string;
  insight_type:
    | 'cost_optimization'
    | 'efficiency_improvement'
    | 'risk_mitigation'
    | 'trend_analysis';
  title: string;
  description: string;
  impact_score: number; // 0-100
  potential_savings: number;
  implementation_effort: 'low' | 'medium' | 'high';
  recommended_timeline: string;
  supporting_data: any;
  created_at: string;
}

export interface PredictiveMaintenanceSettings {
  property_id: string;
  prediction_horizon_days: number;
  confidence_threshold: number;
  alert_preferences: {
    email_notifications: boolean;
    sms_notifications: boolean;
    push_notifications: boolean;
    dashboard_alerts: boolean;
  };
  budget_alert_threshold: number;
  seasonal_adjustments_enabled: boolean;
  sensor_integration_enabled: boolean;
  auto_scheduling_enabled: boolean;
  preferred_maintenance_window: {
    start_time: string;
    end_time: string;
    preferred_days: string[];
  };
}

// API Response Types
export interface PredictiveMaintenanceResponse {
  alerts: PredictiveAlert[];
  schedule: MaintenanceSchedule[];
  insights: MaintenanceInsight[];
  budget_status: MaintenanceBudget[];
  property_profile: PropertyMaintenanceProfile;
}

export interface MaintenanceAnalytics {
  total_alerts: number;
  critical_alerts: number;
  predicted_savings: number;
  accuracy_rate: number;
  average_response_time: number;
  cost_trends: {
    period: string;
    budgeted: number;
    actual: number;
    predicted: number;
  }[];
  category_breakdown: {
    category: MaintenanceCategory;
    alert_count: number;
    cost_percentage: number;
  }[];
  equipment_health: {
    equipment_type: string;
    health_score: number;
    risk_level: RiskLevel;
  }[];
}

// Utility Types
export interface MaintenanceFilters {
  categories?: MaintenanceCategory[];
  priorities?: MaintenancePriority[];
  risk_levels?: RiskLevel[];
  date_range?: {
    start: string;
    end: string;
  };
  status?: MaintenanceStatus[];
  property_ids?: string[];
}

export interface MaintenanceSortOptions {
  field:
    | 'predicted_failure_date'
    | 'priority'
    | 'risk_level'
    | 'estimated_cost'
    | 'confidence_score';
  direction: 'asc' | 'desc';
}
