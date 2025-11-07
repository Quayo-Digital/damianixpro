// Predictive Maintenance AI Service

import { 
  EquipmentData, 
  MaintenanceRecord, 
  PredictiveAlert, 
  MaintenanceSchedule,
  PropertyMaintenanceProfile,
  MaintenanceInsight,
  MaintenanceAnalytics,
  PredictionFactor,
  RecommendedAction,
  RiskLevel,
  MaintenancePriority,
  MaintenanceCategory,
  SensorReading,
  SeasonalFactor
} from '@/types/predictiveMaintenance';

export class PredictiveMaintenanceService {
  private static readonly PREDICTION_WEIGHTS = {
    age: 0.25,
    usage: 0.20,
    maintenance_history: 0.20,
    environmental: 0.15,
    sensor_data: 0.15,
    seasonal: 0.05
  };

  private static readonly EQUIPMENT_LIFESPANS = {
    'hvac_system': 15,
    'water_heater': 10,
    'refrigerator': 12,
    'washing_machine': 10,
    'dishwasher': 9,
    'air_conditioner': 12,
    'generator': 8,
    'elevator': 25,
    'security_system': 7,
    'plumbing_fixtures': 20,
    'electrical_panel': 30,
    'roof': 25,
    'windows': 20,
    'doors': 15
  };

  private static readonly SEASONAL_RISK_FACTORS = {
    'rainy_season': {
      'plumbing': 1.4,
      'electrical': 1.3,
      'structural': 1.2,
      'exterior': 1.5
    },
    'dry_season': {
      'hvac': 1.3,
      'electrical': 1.1,
      'landscaping': 1.4
    },
    'harmattan': {
      'hvac': 1.2,
      'electrical': 1.1,
      'exterior': 1.1
    }
  };

  /**
   * Generate predictive maintenance alerts for a property
   */
  static async generatePredictiveAlerts(
    propertyId: string,
    equipment: EquipmentData[],
    maintenanceHistory: MaintenanceRecord[],
    propertyProfile: PropertyMaintenanceProfile
  ): Promise<PredictiveAlert[]> {
    const alerts: PredictiveAlert[] = [];
    const currentDate = new Date();
    const currentSeason = this.getCurrentSeason();

    for (const item of equipment) {
      const itemHistory = maintenanceHistory.filter(h => h.equipment_id === item.id);
      const riskAssessment = this.assessEquipmentRisk(item, itemHistory, currentSeason);
      
      if (riskAssessment.risk_level !== 'low') {
        const alert = await this.createPredictiveAlert(
          propertyId,
          item,
          riskAssessment,
          itemHistory
        );
        alerts.push(alert);
      }
    }

    // Add property-level alerts based on patterns
    const propertyLevelAlerts = this.generatePropertyLevelAlerts(
      propertyId,
      equipment,
      maintenanceHistory,
      propertyProfile
    );
    
    alerts.push(...propertyLevelAlerts);

    return alerts.sort((a, b) => {
      const priorityOrder = { 'critical': 4, 'high': 3, 'medium': 2, 'low': 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  }

  /**
   * Assess risk level for individual equipment
   */
  private static assessEquipmentRisk(
    equipment: EquipmentData,
    history: MaintenanceRecord[],
    season: SeasonalFactor
  ): {
    risk_level: RiskLevel;
    confidence_score: number;
    predicted_failure_date: Date;
    factors: PredictionFactor[];
  } {
    const factors: PredictionFactor[] = [];
    let riskScore = 0;

    // Age-based risk
    const installDate = new Date(equipment.installation_date);
    const ageYears = (Date.now() - installDate.getTime()) / (1000 * 60 * 60 * 24 * 365);
    const expectedLifespan = this.EQUIPMENT_LIFESPANS[equipment.equipment_type] || equipment.expected_lifespan_years;
    const ageRatio = ageYears / expectedLifespan;
    
    const ageRisk = Math.min(ageRatio * 0.8, 1);
    riskScore += ageRisk * this.PREDICTION_WEIGHTS.age;
    
    factors.push({
      factor: 'Equipment Age',
      impact_weight: ageRisk,
      description: `Equipment is ${ageYears.toFixed(1)} years old (${(ageRatio * 100).toFixed(1)}% of expected lifespan)`,
      data_source: 'historical'
    });

    // Usage intensity risk
    const usageRiskMap = { 'low': 0.2, 'medium': 0.5, 'high': 0.8 };
    const usageRisk = usageRiskMap[equipment.usage_intensity];
    riskScore += usageRisk * this.PREDICTION_WEIGHTS.usage;
    
    factors.push({
      factor: 'Usage Intensity',
      impact_weight: usageRisk,
      description: `Equipment has ${equipment.usage_intensity} usage intensity`,
      data_source: 'usage'
    });

    // Maintenance history risk
    const maintenanceRisk = this.calculateMaintenanceHistoryRisk(history);
    riskScore += maintenanceRisk * this.PREDICTION_WEIGHTS.maintenance_history;
    
    factors.push({
      factor: 'Maintenance History',
      impact_weight: maintenanceRisk,
      description: `Based on ${history.length} maintenance records`,
      data_source: 'historical'
    });

    // Condition-based risk
    const conditionRiskMap = { 'excellent': 0.1, 'good': 0.3, 'fair': 0.6, 'poor': 0.8, 'critical': 1.0 };
    const conditionRisk = conditionRiskMap[equipment.current_condition];
    riskScore += conditionRisk * 0.15;

    factors.push({
      factor: 'Current Condition',
      impact_weight: conditionRisk,
      description: `Equipment condition rated as ${equipment.current_condition}`,
      data_source: 'usage'
    });

    // Seasonal risk adjustment
    const category = this.getEquipmentCategory(equipment.equipment_type);
    const seasonalMultiplier = this.SEASONAL_RISK_FACTORS[season]?.[category] || 1.0;
    riskScore *= seasonalMultiplier;

    if (seasonalMultiplier > 1.0) {
      factors.push({
        factor: 'Seasonal Risk',
        impact_weight: seasonalMultiplier - 1,
        description: `${season} season increases risk for ${category} equipment`,
        data_source: 'environmental'
      });
    }

    // Sensor data risk (if available)
    if (equipment.sensor_data && equipment.sensor_data.length > 0) {
      const sensorRisk = this.calculateSensorRisk(equipment.sensor_data);
      riskScore += sensorRisk * this.PREDICTION_WEIGHTS.sensor_data;
      
      factors.push({
        factor: 'Sensor Anomalies',
        impact_weight: sensorRisk,
        description: `Sensor readings indicate potential issues`,
        data_source: 'sensor'
      });
    }

    // Calculate predicted failure date
    const daysToFailure = this.calculateDaysToFailure(riskScore, ageRatio, equipment);
    const predictedFailureDate = new Date();
    predictedFailureDate.setDate(predictedFailureDate.getDate() + daysToFailure);

    // Determine risk level
    let risk_level: RiskLevel;
    if (riskScore >= 0.8) risk_level = 'critical';
    else if (riskScore >= 0.6) risk_level = 'high';
    else if (riskScore >= 0.4) risk_level = 'moderate';
    else risk_level = 'low';

    // Calculate confidence score
    const dataQuality = this.calculateDataQuality(equipment, history);
    const confidence_score = Math.min(riskScore * dataQuality, 0.95);

    return {
      risk_level,
      confidence_score,
      predicted_failure_date: predictedFailureDate,
      factors
    };
  }

  /**
   * Create a predictive alert from risk assessment
   */
  private static async createPredictiveAlert(
    propertyId: string,
    equipment: EquipmentData,
    riskAssessment: any,
    history: MaintenanceRecord[]
  ): Promise<PredictiveAlert> {
    const category = this.getEquipmentCategory(equipment.equipment_type);
    const estimatedCost = this.estimateMaintenanceCost(equipment, riskAssessment.risk_level);
    const potentialSavings = this.calculatePotentialSavings(equipment, riskAssessment.risk_level);
    
    const recommendedActions = this.generateRecommendedActions(
      equipment,
      riskAssessment.risk_level,
      history
    );

    const priority = this.determinePriority(riskAssessment.risk_level, riskAssessment.confidence_score);

    return {
      id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      property_id: propertyId,
      equipment_id: equipment.id,
      category,
      title: `${equipment.equipment_type.replace('_', ' ').toUpperCase()} Maintenance Required`,
      description: this.generateAlertDescription(equipment, riskAssessment),
      predicted_failure_date: riskAssessment.predicted_failure_date.toISOString(),
      confidence_score: riskAssessment.confidence_score,
      risk_level: riskAssessment.risk_level,
      priority,
      estimated_cost: estimatedCost,
      potential_savings: potentialSavings,
      recommended_actions: recommendedActions,
      factors: riskAssessment.factors,
      status: 'predicted',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
  }

  /**
   * Generate property-level maintenance alerts
   */
  private static generatePropertyLevelAlerts(
    propertyId: string,
    equipment: EquipmentData[],
    history: MaintenanceRecord[],
    profile: PropertyMaintenanceProfile
  ): PredictiveAlert[] {
    const alerts: PredictiveAlert[] = [];

    // Budget overrun prediction
    if (this.predictBudgetOverrun(history, profile)) {
      alerts.push(this.createBudgetAlert(propertyId, history, profile));
    }

    // Seasonal maintenance alerts
    const seasonalAlerts = this.generateSeasonalAlerts(propertyId, equipment, profile);
    alerts.push(...seasonalAlerts);

    // System-wide risk alerts
    const systemAlerts = this.generateSystemRiskAlerts(propertyId, equipment, history);
    alerts.push(...systemAlerts);

    return alerts;
  }

  /**
   * Generate maintenance insights and recommendations
   */
  static generateMaintenanceInsights(
    propertyId: string,
    equipment: EquipmentData[],
    history: MaintenanceRecord[],
    profile: PropertyMaintenanceProfile
  ): MaintenanceInsight[] {
    const insights: MaintenanceInsight[] = [];

    // Cost optimization insights
    const costInsights = this.analyzeCostOptimization(history, equipment);
    insights.push(...costInsights);

    // Efficiency improvement insights
    const efficiencyInsights = this.analyzeEfficiencyOpportunities(equipment, history);
    insights.push(...efficiencyInsights);

    // Risk mitigation insights
    const riskInsights = this.analyzeRiskMitigation(equipment, profile);
    insights.push(...riskInsights);

    // Trend analysis insights
    const trendInsights = this.analyzeTrends(history, equipment);
    insights.push(...trendInsights);

    return insights.sort((a, b) => b.impact_score - a.impact_score);
  }

  /**
   * Generate optimized maintenance schedule
   */
  static generateOptimizedSchedule(
    propertyId: string,
    equipment: EquipmentData[],
    alerts: PredictiveAlert[],
    existingSchedule: MaintenanceSchedule[]
  ): MaintenanceSchedule[] {
    const schedule: MaintenanceSchedule[] = [];

    // Generate equipment-specific schedules
    for (const item of equipment) {
      const equipmentSchedule = this.createEquipmentSchedule(propertyId, item, alerts);
      schedule.push(...equipmentSchedule);
    }

    // Add property-level maintenance tasks
    const propertySchedule = this.createPropertySchedule(propertyId, equipment);
    schedule.push(...propertySchedule);

    // Optimize scheduling to minimize disruption and cost
    return this.optimizeSchedule(schedule);
  }

  /**
   * Calculate maintenance analytics
   */
  static calculateAnalytics(
    alerts: PredictiveAlert[],
    history: MaintenanceRecord[],
    equipment: EquipmentData[]
  ): MaintenanceAnalytics {
    const totalAlerts = alerts.length;
    const criticalAlerts = alerts.filter(a => a.priority === 'critical').length;
    const predictedSavings = alerts.reduce((sum, a) => sum + a.potential_savings, 0);
    
    // Calculate accuracy rate based on historical predictions vs actual outcomes
    const accuracyRate = this.calculateAccuracyRate(history);
    
    // Calculate average response time
    const averageResponseTime = this.calculateAverageResponseTime(history);

    // Generate cost trends
    const costTrends = this.generateCostTrends(history);

    // Category breakdown
    const categoryBreakdown = this.generateCategoryBreakdown(alerts);

    // Equipment health scores
    const equipmentHealth = equipment.map(eq => ({
      equipment_type: eq.equipment_type,
      health_score: this.calculateHealthScore(eq),
      risk_level: this.assessCurrentRiskLevel(eq)
    }));

    return {
      total_alerts: totalAlerts,
      critical_alerts: criticalAlerts,
      predicted_savings: predictedSavings,
      accuracy_rate: accuracyRate,
      average_response_time: averageResponseTime,
      cost_trends: costTrends,
      category_breakdown: categoryBreakdown,
      equipment_health: equipmentHealth
    };
  }

  // Helper methods
  private static getCurrentSeason(): SeasonalFactor {
    const month = new Date().getMonth() + 1;
    if (month >= 3 && month <= 5) return 'spring';
    if (month >= 6 && month <= 8) return 'summer';
    if (month >= 9 && month <= 11) return 'fall';
    if (month === 12 || month <= 2) return 'winter';
    return 'dry_season'; // Default for tropical climates
  }

  private static getEquipmentCategory(equipmentType: string): MaintenanceCategory {
    const categoryMap: Record<string, MaintenanceCategory> = {
      'hvac_system': 'hvac',
      'air_conditioner': 'hvac',
      'water_heater': 'plumbing',
      'plumbing_fixtures': 'plumbing',
      'electrical_panel': 'electrical',
      'security_system': 'security',
      'generator': 'electrical',
      'elevator': 'structural',
      'roof': 'structural',
      'windows': 'structural',
      'doors': 'structural',
      'refrigerator': 'appliances',
      'washing_machine': 'appliances',
      'dishwasher': 'appliances'
    };
    
    return categoryMap[equipmentType] || 'interior';
  }

  private static calculateMaintenanceHistoryRisk(history: MaintenanceRecord[]): number {
    if (history.length === 0) return 0.7; // Higher risk if no maintenance history

    const recentHistory = history.filter(h => {
      const recordDate = new Date(h.performed_date);
      const monthsAgo = (Date.now() - recordDate.getTime()) / (1000 * 60 * 60 * 24 * 30);
      return monthsAgo <= 24; // Last 2 years
    });

    const emergencyRepairs = recentHistory.filter(h => h.maintenance_type === 'emergency').length;
    const totalCost = recentHistory.reduce((sum, h) => sum + h.cost, 0);
    const avgCost = totalCost / Math.max(recentHistory.length, 1);

    // Higher risk if many emergency repairs or high costs
    const emergencyRisk = Math.min(emergencyRepairs * 0.2, 0.8);
    const costRisk = Math.min(avgCost / 100000, 0.6); // Normalize cost risk

    return Math.min(emergencyRisk + costRisk, 1.0);
  }

  private static calculateSensorRisk(sensorData: SensorReading[]): number {
    const recentReadings = sensorData.filter(reading => {
      const readingDate = new Date(reading.timestamp);
      const hoursAgo = (Date.now() - readingDate.getTime()) / (1000 * 60 * 60);
      return hoursAgo <= 168; // Last week
    });

    const anomalies = recentReadings.filter(r => r.is_anomaly).length;
    const anomalyRate = anomalies / Math.max(recentReadings.length, 1);

    return Math.min(anomalyRate * 1.5, 1.0);
  }

  private static calculateDaysToFailure(riskScore: number, ageRatio: number, equipment: EquipmentData): number {
    const baseLifespanDays = (this.EQUIPMENT_LIFESPANS[equipment.equipment_type] || equipment.expected_lifespan_years) * 365;
    const remainingLifespanDays = baseLifespanDays * (1 - ageRatio);
    
    // Adjust based on risk score
    const riskAdjustment = 1 - (riskScore * 0.8);
    
    return Math.max(Math.round(remainingLifespanDays * riskAdjustment), 1);
  }

  private static calculateDataQuality(equipment: EquipmentData, history: MaintenanceRecord[]): number {
    let quality = 0.5; // Base quality

    // Equipment data completeness
    if (equipment.installation_date) quality += 0.1;
    if (equipment.last_service_date) quality += 0.1;
    if (equipment.current_condition) quality += 0.1;
    if (equipment.sensor_data && equipment.sensor_data.length > 0) quality += 0.2;

    // Maintenance history quality
    if (history.length > 0) quality += 0.1;
    if (history.length > 5) quality += 0.1;

    return Math.min(quality, 1.0);
  }

  private static estimateMaintenanceCost(equipment: EquipmentData, riskLevel: RiskLevel): number {
    const baseCosts = {
      'hvac_system': 150000,
      'water_heater': 80000,
      'refrigerator': 60000,
      'washing_machine': 40000,
      'dishwasher': 35000,
      'air_conditioner': 100000,
      'generator': 120000,
      'elevator': 500000,
      'security_system': 75000,
      'plumbing_fixtures': 50000,
      'electrical_panel': 200000,
      'roof': 800000,
      'windows': 150000,
      'doors': 80000
    };

    const baseCost = baseCosts[equipment.equipment_type] || 50000;
    const riskMultipliers = { 'low': 0.5, 'moderate': 0.8, 'high': 1.2, 'critical': 2.0 };
    
    return Math.round(baseCost * riskMultipliers[riskLevel]);
  }

  private static calculatePotentialSavings(equipment: EquipmentData, riskLevel: RiskLevel): number {
    const estimatedCost = this.estimateMaintenanceCost(equipment, riskLevel);
    const emergencyMultiplier = 3; // Emergency repairs cost 3x more
    
    return Math.round(estimatedCost * (emergencyMultiplier - 1));
  }

  private static generateRecommendedActions(
    equipment: EquipmentData,
    riskLevel: RiskLevel,
    history: MaintenanceRecord[]
  ): RecommendedAction[] {
    const actions: RecommendedAction[] = [];

    if (riskLevel === 'critical') {
      actions.push({
        action: 'Schedule immediate professional inspection',
        urgency: 'immediate',
        estimated_cost: 25000,
        estimated_duration: '2-4 hours',
        required_expertise: 'professional'
      });
    }

    if (riskLevel === 'high' || riskLevel === 'critical') {
      actions.push({
        action: 'Order replacement parts proactively',
        urgency: 'within_week',
        estimated_cost: this.estimateMaintenanceCost(equipment, riskLevel) * 0.3,
        estimated_duration: '1-2 days',
        required_expertise: 'basic'
      });
    }

    // Add general maintenance action
    actions.push({
      action: 'Perform preventive maintenance',
      urgency: riskLevel === 'critical' ? 'immediate' : 'within_month',
      estimated_cost: this.estimateMaintenanceCost(equipment, riskLevel) * 0.6,
      estimated_duration: '4-8 hours',
      required_expertise: 'intermediate'
    });

    return actions;
  }

  private static determinePriority(riskLevel: RiskLevel, confidenceScore: number): MaintenancePriority {
    if (riskLevel === 'critical' && confidenceScore > 0.8) return 'critical';
    if (riskLevel === 'critical' || (riskLevel === 'high' && confidenceScore > 0.7)) return 'high';
    if (riskLevel === 'high' || riskLevel === 'moderate') return 'medium';
    return 'low';
  }

  private static generateAlertDescription(equipment: EquipmentData, riskAssessment: any): string {
    const daysToFailure = Math.round((new Date(riskAssessment.predicted_failure_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    
    return `${equipment.equipment_type.replace('_', ' ')} (${equipment.brand} ${equipment.model}) is predicted to require maintenance within ${daysToFailure} days. Current condition: ${equipment.current_condition}. Confidence: ${Math.round(riskAssessment.confidence_score * 100)}%`;
  }

  // Additional helper methods for property-level alerts, insights, scheduling, etc.
  private static predictBudgetOverrun(history: MaintenanceRecord[], profile: PropertyMaintenanceProfile): boolean {
    const currentYear = new Date().getFullYear();
    const currentYearCosts = history
      .filter(h => new Date(h.performed_date).getFullYear() === currentYear)
      .reduce((sum, h) => sum + h.cost, 0);
    
    return currentYearCosts > profile.annual_maintenance_cost * 1.2;
  }

  private static createBudgetAlert(propertyId: string, history: MaintenanceRecord[], profile: PropertyMaintenanceProfile): PredictiveAlert {
    const currentYear = new Date().getFullYear();
    const currentYearCosts = history
      .filter(h => new Date(h.performed_date).getFullYear() === currentYear)
      .reduce((sum, h) => sum + h.cost, 0);
    
    const overrun = currentYearCosts - profile.annual_maintenance_cost;

    return {
      id: `budget_alert_${Date.now()}`,
      property_id: propertyId,
      category: 'interior',
      title: 'Budget Overrun Alert',
      description: `Maintenance costs are ₦${overrun.toLocaleString()} over budget for this year`,
      predicted_failure_date: new Date(currentYear, 11, 31).toISOString(),
      confidence_score: 0.95,
      risk_level: 'high',
      priority: 'high',
      estimated_cost: overrun,
      potential_savings: overrun * 0.3,
      recommended_actions: [{
        action: 'Review and optimize maintenance spending',
        urgency: 'within_month',
        estimated_cost: 0,
        estimated_duration: '2-4 hours',
        required_expertise: 'basic'
      }],
      factors: [{
        factor: 'Budget Analysis',
        impact_weight: 1.0,
        description: 'Current year spending exceeds budget',
        data_source: 'historical'
      }],
      status: 'predicted',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
  }

  private static generateSeasonalAlerts(propertyId: string, equipment: EquipmentData[], profile: PropertyMaintenanceProfile): PredictiveAlert[] {
    // Implementation for seasonal maintenance alerts
    return [];
  }

  private static generateSystemRiskAlerts(propertyId: string, equipment: EquipmentData[], history: MaintenanceRecord[]): PredictiveAlert[] {
    // Implementation for system-wide risk alerts
    return [];
  }

  private static analyzeCostOptimization(history: MaintenanceRecord[], equipment: EquipmentData[]): MaintenanceInsight[] {
    // Implementation for cost optimization analysis
    return [];
  }

  private static analyzeEfficiencyOpportunities(equipment: EquipmentData[], history: MaintenanceRecord[]): MaintenanceInsight[] {
    // Implementation for efficiency analysis
    return [];
  }

  private static analyzeRiskMitigation(equipment: EquipmentData[], profile: PropertyMaintenanceProfile): MaintenanceInsight[] {
    // Implementation for risk mitigation analysis
    return [];
  }

  private static analyzeTrends(history: MaintenanceRecord[], equipment: EquipmentData[]): MaintenanceInsight[] {
    // Implementation for trend analysis
    return [];
  }

  private static createEquipmentSchedule(propertyId: string, equipment: EquipmentData, alerts: PredictiveAlert[]): MaintenanceSchedule[] {
    // Implementation for equipment-specific scheduling
    return [];
  }

  private static createPropertySchedule(propertyId: string, equipment: EquipmentData[]): MaintenanceSchedule[] {
    // Implementation for property-level scheduling
    return [];
  }

  private static optimizeSchedule(schedule: MaintenanceSchedule[]): MaintenanceSchedule[] {
    // Implementation for schedule optimization
    return schedule;
  }

  private static calculateAccuracyRate(history: MaintenanceRecord[]): number {
    // Implementation for accuracy calculation
    return 85; // Placeholder
  }

  private static calculateAverageResponseTime(history: MaintenanceRecord[]): number {
    // Implementation for response time calculation
    return 2.5; // Placeholder in days
  }

  private static generateCostTrends(history: MaintenanceRecord[]): any[] {
    // Implementation for cost trend generation
    return [];
  }

  private static generateCategoryBreakdown(alerts: PredictiveAlert[]): any[] {
    // Implementation for category breakdown
    return [];
  }

  private static calculateHealthScore(equipment: EquipmentData): number {
    const conditionScores = { 'excellent': 95, 'good': 80, 'fair': 60, 'poor': 40, 'critical': 20 };
    return conditionScores[equipment.current_condition];
  }

  private static assessCurrentRiskLevel(equipment: EquipmentData): RiskLevel {
    const conditionRiskMap = { 'excellent': 'low', 'good': 'low', 'fair': 'moderate', 'poor': 'high', 'critical': 'critical' };
    return conditionRiskMap[equipment.current_condition] as RiskLevel;
  }
}
