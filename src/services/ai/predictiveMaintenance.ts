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
  SeasonalFactor,
} from '@/types/predictiveMaintenance';

export class PredictiveMaintenanceService {
  private static readonly PREDICTION_WEIGHTS = {
    age: 0.25,
    usage: 0.2,
    maintenance_history: 0.2,
    environmental: 0.15,
    sensor_data: 0.15,
    seasonal: 0.05,
  };

  private static readonly EQUIPMENT_LIFESPANS = {
    hvac_system: 15,
    water_heater: 10,
    refrigerator: 12,
    washing_machine: 10,
    dishwasher: 9,
    air_conditioner: 12,
    generator: 8,
    elevator: 25,
    security_system: 7,
    plumbing_fixtures: 20,
    electrical_panel: 30,
    roof: 25,
    windows: 20,
    doors: 15,
  };

  private static readonly SEASONAL_RISK_FACTORS = {
    rainy_season: {
      plumbing: 1.4,
      electrical: 1.3,
      structural: 1.2,
      exterior: 1.5,
    },
    dry_season: {
      hvac: 1.3,
      electrical: 1.1,
      landscaping: 1.4,
    },
    harmattan: {
      hvac: 1.2,
      electrical: 1.1,
      exterior: 1.1,
    },
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
      const itemHistory = maintenanceHistory.filter((h) => h.equipment_id === item.id);
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
      const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
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
    const expectedLifespan =
      this.EQUIPMENT_LIFESPANS[equipment.equipment_type] || equipment.expected_lifespan_years;
    const ageRatio = ageYears / expectedLifespan;

    const ageRisk = Math.min(ageRatio * 0.8, 1);
    riskScore += ageRisk * this.PREDICTION_WEIGHTS.age;

    factors.push({
      factor: 'Equipment Age',
      impact_weight: ageRisk,
      description: `Equipment is ${ageYears.toFixed(1)} years old (${(ageRatio * 100).toFixed(1)}% of expected lifespan)`,
      data_source: 'historical',
    });

    // Usage intensity risk
    const usageRiskMap = { low: 0.2, medium: 0.5, high: 0.8 };
    const usageRisk = usageRiskMap[equipment.usage_intensity];
    riskScore += usageRisk * this.PREDICTION_WEIGHTS.usage;

    factors.push({
      factor: 'Usage Intensity',
      impact_weight: usageRisk,
      description: `Equipment has ${equipment.usage_intensity} usage intensity`,
      data_source: 'usage',
    });

    // Maintenance history risk
    const maintenanceRisk = this.calculateMaintenanceHistoryRisk(history);
    riskScore += maintenanceRisk * this.PREDICTION_WEIGHTS.maintenance_history;

    factors.push({
      factor: 'Maintenance History',
      impact_weight: maintenanceRisk,
      description: `Based on ${history.length} maintenance records`,
      data_source: 'historical',
    });

    // Condition-based risk
    const conditionRiskMap = { excellent: 0.1, good: 0.3, fair: 0.6, poor: 0.8, critical: 1.0 };
    const conditionRisk = conditionRiskMap[equipment.current_condition];
    riskScore += conditionRisk * 0.15;

    factors.push({
      factor: 'Current Condition',
      impact_weight: conditionRisk,
      description: `Equipment condition rated as ${equipment.current_condition}`,
      data_source: 'usage',
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
        data_source: 'environmental',
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
        data_source: 'sensor',
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
      factors,
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

    const priority = this.determinePriority(
      riskAssessment.risk_level,
      riskAssessment.confidence_score
    );

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
      updated_at: new Date().toISOString(),
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
    const criticalAlerts = alerts.filter((a) => a.priority === 'critical').length;
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
    const equipmentHealth = equipment.map((eq) => ({
      equipment_type: eq.equipment_type,
      health_score: this.calculateHealthScore(eq),
      risk_level: this.assessCurrentRiskLevel(eq),
    }));

    return {
      total_alerts: totalAlerts,
      critical_alerts: criticalAlerts,
      predicted_savings: predictedSavings,
      accuracy_rate: accuracyRate,
      average_response_time: averageResponseTime,
      cost_trends: costTrends,
      category_breakdown: categoryBreakdown,
      equipment_health: equipmentHealth,
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
      hvac_system: 'hvac',
      air_conditioner: 'hvac',
      water_heater: 'plumbing',
      plumbing_fixtures: 'plumbing',
      electrical_panel: 'electrical',
      security_system: 'security',
      generator: 'electrical',
      elevator: 'structural',
      roof: 'structural',
      windows: 'structural',
      doors: 'structural',
      refrigerator: 'appliances',
      washing_machine: 'appliances',
      dishwasher: 'appliances',
    };

    return categoryMap[equipmentType] || 'interior';
  }

  private static calculateMaintenanceHistoryRisk(history: MaintenanceRecord[]): number {
    if (history.length === 0) return 0.7; // Higher risk if no maintenance history

    const recentHistory = history.filter((h) => {
      const recordDate = new Date(h.performed_date);
      const monthsAgo = (Date.now() - recordDate.getTime()) / (1000 * 60 * 60 * 24 * 30);
      return monthsAgo <= 24; // Last 2 years
    });

    const emergencyRepairs = recentHistory.filter((h) => h.maintenance_type === 'emergency').length;
    const totalCost = recentHistory.reduce((sum, h) => sum + h.cost, 0);
    const avgCost = totalCost / Math.max(recentHistory.length, 1);

    // Higher risk if many emergency repairs or high costs
    const emergencyRisk = Math.min(emergencyRepairs * 0.2, 0.8);
    const costRisk = Math.min(avgCost / 100000, 0.6); // Normalize cost risk

    return Math.min(emergencyRisk + costRisk, 1.0);
  }

  private static calculateSensorRisk(sensorData: SensorReading[]): number {
    const recentReadings = sensorData.filter((reading) => {
      const readingDate = new Date(reading.timestamp);
      const hoursAgo = (Date.now() - readingDate.getTime()) / (1000 * 60 * 60);
      return hoursAgo <= 168; // Last week
    });

    const anomalies = recentReadings.filter((r) => r.is_anomaly).length;
    const anomalyRate = anomalies / Math.max(recentReadings.length, 1);

    return Math.min(anomalyRate * 1.5, 1.0);
  }

  private static calculateDaysToFailure(
    riskScore: number,
    ageRatio: number,
    equipment: EquipmentData
  ): number {
    const baseLifespanDays =
      (this.EQUIPMENT_LIFESPANS[equipment.equipment_type] || equipment.expected_lifespan_years) *
      365;
    const remainingLifespanDays = baseLifespanDays * (1 - ageRatio);

    // Adjust based on risk score
    const riskAdjustment = 1 - riskScore * 0.8;

    return Math.max(Math.round(remainingLifespanDays * riskAdjustment), 1);
  }

  private static calculateDataQuality(
    equipment: EquipmentData,
    history: MaintenanceRecord[]
  ): number {
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
      hvac_system: 150000,
      water_heater: 80000,
      refrigerator: 60000,
      washing_machine: 40000,
      dishwasher: 35000,
      air_conditioner: 100000,
      generator: 120000,
      elevator: 500000,
      security_system: 75000,
      plumbing_fixtures: 50000,
      electrical_panel: 200000,
      roof: 800000,
      windows: 150000,
      doors: 80000,
    };

    const baseCost = baseCosts[equipment.equipment_type] || 50000;
    const riskMultipliers = { low: 0.5, moderate: 0.8, high: 1.2, critical: 2.0 };

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
        required_expertise: 'professional',
      });
    }

    if (riskLevel === 'high' || riskLevel === 'critical') {
      actions.push({
        action: 'Order replacement parts proactively',
        urgency: 'within_week',
        estimated_cost: this.estimateMaintenanceCost(equipment, riskLevel) * 0.3,
        estimated_duration: '1-2 days',
        required_expertise: 'basic',
      });
    }

    // Add general maintenance action
    actions.push({
      action: 'Perform preventive maintenance',
      urgency: riskLevel === 'critical' ? 'immediate' : 'within_month',
      estimated_cost: this.estimateMaintenanceCost(equipment, riskLevel) * 0.6,
      estimated_duration: '4-8 hours',
      required_expertise: 'intermediate',
    });

    return actions;
  }

  private static determinePriority(
    riskLevel: RiskLevel,
    confidenceScore: number
  ): MaintenancePriority {
    if (riskLevel === 'critical' && confidenceScore > 0.8) return 'critical';
    if (riskLevel === 'critical' || (riskLevel === 'high' && confidenceScore > 0.7)) return 'high';
    if (riskLevel === 'high' || riskLevel === 'moderate') return 'medium';
    return 'low';
  }

  private static generateAlertDescription(equipment: EquipmentData, riskAssessment: any): string {
    const daysToFailure = Math.round(
      (new Date(riskAssessment.predicted_failure_date).getTime() - Date.now()) /
        (1000 * 60 * 60 * 24)
    );

    return `${equipment.equipment_type.replace('_', ' ')} (${equipment.brand} ${equipment.model}) is predicted to require maintenance within ${daysToFailure} days. Current condition: ${equipment.current_condition}. Confidence: ${Math.round(riskAssessment.confidence_score * 100)}%`;
  }

  // Additional helper methods for property-level alerts, insights, scheduling, etc.
  private static predictBudgetOverrun(
    history: MaintenanceRecord[],
    profile: PropertyMaintenanceProfile
  ): boolean {
    const currentYear = new Date().getFullYear();
    const currentYearCosts = history
      .filter((h) => new Date(h.performed_date).getFullYear() === currentYear)
      .reduce((sum, h) => sum + h.cost, 0);

    return currentYearCosts > profile.annual_maintenance_cost * 1.2;
  }

  private static createBudgetAlert(
    propertyId: string,
    history: MaintenanceRecord[],
    profile: PropertyMaintenanceProfile
  ): PredictiveAlert {
    const currentYear = new Date().getFullYear();
    const currentYearCosts = history
      .filter((h) => new Date(h.performed_date).getFullYear() === currentYear)
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
      recommended_actions: [
        {
          action: 'Review and optimize maintenance spending',
          urgency: 'within_month',
          estimated_cost: 0,
          estimated_duration: '2-4 hours',
          required_expertise: 'basic',
        },
      ],
      factors: [
        {
          factor: 'Budget Analysis',
          impact_weight: 1.0,
          description: 'Current year spending exceeds budget',
          data_source: 'historical',
        },
      ],
      status: 'predicted',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
  }

  /**
   * Seasonal alerts: emit a "category-x in season-y" alert when the season's risk
   * multiplier (`SEASONAL_RISK_FACTORS`) is elevated for any equipment category
   * with at least one item in that category installed at the property.
   */
  private static generateSeasonalAlerts(
    propertyId: string,
    equipment: EquipmentData[],
    _profile: PropertyMaintenanceProfile
  ): PredictiveAlert[] {
    const season = this.getCurrentSeason();
    const seasonFactors =
      this.SEASONAL_RISK_FACTORS[season as keyof typeof this.SEASONAL_RISK_FACTORS] ?? null;
    if (!seasonFactors) return [];

    const categoriesPresent = new Set(
      equipment.map((eq) => this.getEquipmentCategory(eq.equipment_type))
    );

    const alerts: PredictiveAlert[] = [];
    for (const [category, multiplier] of Object.entries(seasonFactors)) {
      if (!categoriesPresent.has(category as MaintenanceCategory)) continue;
      if (Number(multiplier) < 1.2) continue;

      alerts.push({
        id: `seasonal_${propertyId}_${category}_${season}_${Date.now()}`,
        property_id: propertyId,
        category: category as MaintenanceCategory,
        title: `Seasonal risk: ${category} (${season.replace('_', ' ')})`,
        description: `${category} systems have ${Math.round((Number(multiplier) - 1) * 100)}% elevated risk during ${season.replace('_', ' ')}. Schedule a preventive inspection now.`,
        predicted_failure_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        confidence_score: Math.min(0.85, 0.6 + (Number(multiplier) - 1)),
        risk_level: Number(multiplier) >= 1.4 ? 'high' : 'moderate',
        priority: Number(multiplier) >= 1.4 ? 'high' : 'medium',
        estimated_cost: 25000,
        potential_savings: 75000,
        recommended_actions: [
          {
            action: `Run a seasonal ${category} inspection`,
            urgency: 'within_month',
            estimated_cost: 25000,
            estimated_duration: '1-2 hours',
            required_expertise: 'professional',
          },
        ],
        factors: [
          {
            factor: 'Seasonal risk',
            impact_weight: Math.min(1, Number(multiplier) - 1),
            description: `${season} multiplier ${Number(multiplier).toFixed(2)} for ${category}`,
            data_source: 'environmental',
          },
        ],
        status: 'predicted',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
    }

    return alerts;
  }

  /**
   * System-wide risk: when an equipment category has ≥3 emergency repairs in the
   * last 12 months, the category itself is unhealthy regardless of any single unit.
   */
  private static generateSystemRiskAlerts(
    propertyId: string,
    equipment: EquipmentData[],
    history: MaintenanceRecord[]
  ): PredictiveAlert[] {
    const oneYearAgo = Date.now() - 365 * 24 * 60 * 60 * 1000;
    const recentEmergency = history.filter(
      (h) =>
        h.maintenance_type === 'emergency' && new Date(h.performed_date).getTime() >= oneYearAgo
    );
    const byCategory = new Map<MaintenanceCategory, MaintenanceRecord[]>();
    for (const r of recentEmergency) {
      const list = byCategory.get(r.category) || [];
      list.push(r);
      byCategory.set(r.category, list);
    }

    const alerts: PredictiveAlert[] = [];
    for (const [category, records] of byCategory.entries()) {
      if (records.length < 3) continue;
      const totalCost = records.reduce((sum, r) => sum + (r.cost || 0), 0);
      const equipmentInCat = equipment.filter(
        (eq) => this.getEquipmentCategory(eq.equipment_type) === category
      );
      alerts.push({
        id: `system_${propertyId}_${category}_${Date.now()}`,
        property_id: propertyId,
        category,
        title: `${category} system: chronic emergency repairs`,
        description: `${records.length} emergency ${category} repairs in the last 12 months (₦${totalCost.toLocaleString()}). Consider a system-level overhaul or replacing aging units.`,
        predicted_failure_date: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
        confidence_score: Math.min(0.95, 0.6 + records.length * 0.05),
        risk_level: records.length >= 5 ? 'critical' : 'high',
        priority: records.length >= 5 ? 'critical' : 'high',
        estimated_cost: Math.round(totalCost * 0.5),
        potential_savings: Math.round(totalCost * 1.5),
        recommended_actions: [
          {
            action: `Audit all ${category} equipment (${equipmentInCat.length} unit${equipmentInCat.length === 1 ? '' : 's'})`,
            urgency: 'within_week',
            estimated_cost: 50000,
            estimated_duration: '1-2 days',
            required_expertise: 'professional',
          },
        ],
        factors: [
          {
            factor: 'Emergency repair frequency',
            impact_weight: Math.min(1, records.length / 5),
            description: `${records.length} emergency events in the last 12 months`,
            data_source: 'historical',
          },
        ],
        status: 'predicted',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
    }

    return alerts;
  }

  /** Cost-optimization insights: flag categories where spend is concentrated. */
  private static analyzeCostOptimization(
    history: MaintenanceRecord[],
    _equipment: EquipmentData[]
  ): MaintenanceInsight[] {
    if (history.length === 0) return [];
    const totalCost = history.reduce((sum, h) => sum + (h.cost || 0), 0);
    if (totalCost === 0) return [];

    const byCategory = new Map<MaintenanceCategory, number>();
    for (const h of history) {
      byCategory.set(h.category, (byCategory.get(h.category) || 0) + (h.cost || 0));
    }
    const top = Array.from(byCategory.entries()).sort((a, b) => b[1] - a[1])[0];
    if (!top) return [];
    const [topCategory, topCost] = top;
    const share = topCost / totalCost;
    if (share < 0.4) return [];

    const propertyId = history[0]?.property_id ?? '';
    return [
      {
        id: `insight_cost_${propertyId}_${topCategory}_${Date.now()}`,
        property_id: propertyId,
        insight_type: 'cost_optimization',
        title: `${topCategory} drives ${Math.round(share * 100)}% of maintenance spend`,
        description: `₦${topCost.toLocaleString()} of ₦${totalCost.toLocaleString()} maintenance spend is concentrated in ${topCategory}. A category-level review or vendor switch could meaningfully reduce ongoing costs.`,
        impact_score: Math.min(100, Math.round(share * 120)),
        potential_savings: Math.round(topCost * 0.2),
        implementation_effort: 'medium',
        recommended_timeline: 'Within 60 days',
        supporting_data: { topCategory, topCost, totalCost, share },
        created_at: new Date().toISOString(),
      },
    ];
  }

  /** Efficiency: equipment past 80% of expected lifespan is a replace/upgrade target. */
  private static analyzeEfficiencyOpportunities(
    equipment: EquipmentData[],
    _history: MaintenanceRecord[]
  ): MaintenanceInsight[] {
    const aged = equipment.filter((eq) => {
      const installed = new Date(eq.installation_date).getTime();
      if (Number.isNaN(installed)) return false;
      const ageYears = (Date.now() - installed) / (1000 * 60 * 60 * 24 * 365);
      const lifespan =
        this.EQUIPMENT_LIFESPANS[eq.equipment_type as keyof typeof this.EQUIPMENT_LIFESPANS] ??
        eq.expected_lifespan_years;
      return ageYears / lifespan >= 0.8;
    });
    if (aged.length === 0) return [];

    const propertyId = equipment[0]?.property_id ?? '';
    return [
      {
        id: `insight_efficiency_${propertyId}_${Date.now()}`,
        property_id: propertyId,
        insight_type: 'efficiency_improvement',
        title: `${aged.length} unit${aged.length === 1 ? '' : 's'} near end of useful life`,
        description: `Replacing aging ${aged
          .map((e) => e.equipment_type.replace('_', ' '))
          .join(', ')} preempts emergency repairs and typically reduces energy use 10–20%.`,
        impact_score: Math.min(95, 50 + aged.length * 10),
        potential_savings: aged.length * 80000,
        implementation_effort: aged.length > 3 ? 'high' : 'medium',
        recommended_timeline: 'Within 6 months',
        supporting_data: { aged_equipment_ids: aged.map((e) => e.id) },
        created_at: new Date().toISOString(),
      },
    ];
  }

  /** Risk mitigation: equipment in poor/critical condition needs immediate attention. */
  private static analyzeRiskMitigation(
    equipment: EquipmentData[],
    profile: PropertyMaintenanceProfile
  ): MaintenanceInsight[] {
    const atRisk = equipment.filter(
      (eq) => eq.current_condition === 'poor' || eq.current_condition === 'critical'
    );
    if (atRisk.length === 0) return [];

    return [
      {
        id: `insight_risk_${profile.property_id}_${Date.now()}`,
        property_id: profile.property_id,
        insight_type: 'risk_mitigation',
        title: `${atRisk.length} unit${atRisk.length === 1 ? '' : 's'} in poor or critical condition`,
        description: `Address: ${atRisk
          .map((e) => `${e.equipment_type.replace('_', ' ')} (${e.current_condition})`)
          .join(', ')}. Each is a candidate for emergency failure within the next 90 days.`,
        impact_score: Math.min(100, 60 + atRisk.length * 12),
        potential_savings: atRisk.reduce(
          (sum, eq) => sum + this.calculatePotentialSavings(eq, this.assessCurrentRiskLevel(eq)),
          0
        ),
        implementation_effort: 'medium',
        recommended_timeline: 'Within 30 days',
        supporting_data: { at_risk_equipment_ids: atRisk.map((e) => e.id) },
        created_at: new Date().toISOString(),
      },
    ];
  }

  /** Trend insight: rising maintenance spend month-over-month signals deferred work catching up. */
  private static analyzeTrends(
    history: MaintenanceRecord[],
    _equipment: EquipmentData[]
  ): MaintenanceInsight[] {
    if (history.length < 4) return [];

    const byMonth = new Map<string, number>();
    for (const h of history) {
      const key = h.performed_date.slice(0, 7);
      byMonth.set(key, (byMonth.get(key) || 0) + (h.cost || 0));
    }
    const months = Array.from(byMonth.keys()).sort();
    if (months.length < 4) return [];

    const recent3 = months.slice(-3).reduce((sum, m) => sum + (byMonth.get(m) ?? 0), 0) / 3;
    const prior3 =
      months.slice(-6, -3).reduce((sum, m) => sum + (byMonth.get(m) ?? 0), 0) /
      Math.max(1, Math.min(3, Math.max(0, months.length - 3)));
    if (prior3 === 0) return [];
    const delta = (recent3 - prior3) / prior3;
    if (delta < 0.25) return [];

    const propertyId = history[0]?.property_id ?? '';
    return [
      {
        id: `insight_trend_${propertyId}_${Date.now()}`,
        property_id: propertyId,
        insight_type: 'trend_analysis',
        title: `Maintenance spend up ${Math.round(delta * 100)}% over the last 3 months`,
        description: `Average monthly spend climbed from ₦${Math.round(prior3).toLocaleString()} to ₦${Math.round(recent3).toLocaleString()}. Consider whether deferred work is now coming due, or if a particular system is failing repeatedly.`,
        impact_score: Math.min(100, Math.round(50 + delta * 60)),
        potential_savings: Math.round((recent3 - prior3) * 3 * 0.4),
        implementation_effort: 'low',
        recommended_timeline: 'Within 14 days',
        supporting_data: { recent3, prior3, delta },
        created_at: new Date().toISOString(),
      },
    ];
  }

  /**
   * Equipment schedule: drive the next preventive maintenance date from the
   * equipment's matching alerts (most urgent first) when present, otherwise
   * fall back to a quarterly cadence from `last_service_date`.
   */
  private static createEquipmentSchedule(
    propertyId: string,
    equipment: EquipmentData,
    alerts: PredictiveAlert[]
  ): MaintenanceSchedule[] {
    const matchingAlerts = alerts
      .filter((a) => a.equipment_id === equipment.id)
      .sort(
        (a, b) =>
          new Date(a.predicted_failure_date).getTime() -
          new Date(b.predicted_failure_date).getTime()
      );
    const category = this.getEquipmentCategory(equipment.equipment_type);
    const lastServiced = equipment.last_service_date
      ? new Date(equipment.last_service_date).getTime()
      : Date.now();

    const nextDueMs = matchingAlerts[0]
      ? new Date(matchingAlerts[0].predicted_failure_date).getTime() - 14 * 24 * 60 * 60 * 1000
      : lastServiced + 90 * 24 * 60 * 60 * 1000;

    const priority: MaintenancePriority =
      matchingAlerts[0]?.priority ??
      (equipment.current_condition === 'poor' || equipment.current_condition === 'critical'
        ? 'high'
        : 'medium');

    return [
      {
        id: `sched_${propertyId}_${equipment.id}_${Date.now()}`,
        property_id: propertyId,
        equipment_id: equipment.id,
        category,
        task_name: `Preventive ${equipment.equipment_type.replace('_', ' ')} service`,
        description: `Routine inspection, cleaning, and parts check for ${equipment.brand} ${equipment.model}.`,
        frequency_type: 'quarterly',
        frequency_value: 1,
        last_completed: equipment.last_service_date,
        next_due: new Date(Math.max(nextDueMs, Date.now())).toISOString(),
        estimated_duration: '2-4 hours',
        estimated_cost: this.estimateMaintenanceCost(
          equipment,
          this.assessCurrentRiskLevel(equipment)
        ),
        priority,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ];
  }

  /** Property-level recurring tasks (annual roof, semi-annual exterior, etc.). */
  private static createPropertySchedule(
    propertyId: string,
    _equipment: EquipmentData[]
  ): MaintenanceSchedule[] {
    const now = Date.now();
    const yearMs = 365 * 24 * 60 * 60 * 1000;
    const halfYearMs = yearMs / 2;
    return [
      {
        id: `sched_${propertyId}_roof_${Date.now()}`,
        property_id: propertyId,
        category: 'structural',
        task_name: 'Annual roof inspection',
        description: 'Visual check for missing shingles, leaks, drainage, and structural issues.',
        frequency_type: 'annual',
        frequency_value: 1,
        next_due: new Date(now + yearMs).toISOString(),
        estimated_duration: '2 hours',
        estimated_cost: 30000,
        priority: 'medium',
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: `sched_${propertyId}_exterior_${Date.now()}`,
        property_id: propertyId,
        category: 'exterior',
        task_name: 'Bi-annual exterior maintenance',
        description: 'Pressure wash, paint touch-up, gutter cleaning, perimeter check.',
        frequency_type: 'semi_annual',
        frequency_value: 1,
        next_due: new Date(now + halfYearMs).toISOString(),
        estimated_duration: '1 day',
        estimated_cost: 80000,
        priority: 'low',
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ];
  }

  /**
   * Schedule optimization: sort by `next_due` ASC, then `priority` DESC,
   * dedupe identical (equipment_id, task_name) entries (keep earliest), and
   * cap concurrent same-day tasks to 3 by sliding extras a day later.
   */
  private static optimizeSchedule(schedule: MaintenanceSchedule[]): MaintenanceSchedule[] {
    const priorityOrder: Record<MaintenancePriority, number> = {
      critical: 0,
      high: 1,
      medium: 2,
      low: 3,
    };

    const seen = new Map<string, MaintenanceSchedule>();
    for (const item of schedule) {
      const key = `${item.equipment_id ?? 'property'}::${item.task_name}`;
      const existing = seen.get(key);
      if (!existing || new Date(item.next_due).getTime() < new Date(existing.next_due).getTime()) {
        seen.set(key, item);
      }
    }

    const sorted = Array.from(seen.values()).sort((a, b) => {
      const dueDelta = new Date(a.next_due).getTime() - new Date(b.next_due).getTime();
      if (dueDelta !== 0) return dueDelta;
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });

    const perDay = new Map<string, number>();
    return sorted.map((item) => {
      let due = new Date(item.next_due);
      for (let attempt = 0; attempt < 7; attempt += 1) {
        const dayKey = due.toISOString().slice(0, 10);
        const count = perDay.get(dayKey) || 0;
        if (count < 3) {
          perDay.set(dayKey, count + 1);
          return { ...item, next_due: due.toISOString() };
        }
        due = new Date(due.getTime() + 24 * 60 * 60 * 1000);
      }
      return item;
    });
  }

  /**
   * Accuracy proxy: fraction of completed-or-corrective records that did NOT
   * become emergencies — a conservative stand-in until predicted_vs_actual
   * outcome tracking is available.
   */
  private static calculateAccuracyRate(history: MaintenanceRecord[]): number {
    if (history.length === 0) return 0;
    const planned = history.filter(
      (h) => h.maintenance_type === 'preventive' || h.maintenance_type === 'inspection'
    ).length;
    const total = history.length;
    return Math.round((planned / total) * 100);
  }

  /**
   * Average response time in days, derived from gaps between consecutive
   * records on the same equipment when one of them is an emergency repair.
   * If history is empty/insufficient, returns 0.
   */
  private static calculateAverageResponseTime(history: MaintenanceRecord[]): number {
    if (history.length < 2) return 0;
    const byEquipment = new Map<string, MaintenanceRecord[]>();
    for (const h of history) {
      const list = byEquipment.get(h.equipment_id) || [];
      list.push(h);
      byEquipment.set(h.equipment_id, list);
    }

    const gaps: number[] = [];
    for (const records of byEquipment.values()) {
      const sorted = [...records].sort(
        (a, b) => new Date(a.performed_date).getTime() - new Date(b.performed_date).getTime()
      );
      for (let i = 1; i < sorted.length; i += 1) {
        if (sorted[i].maintenance_type === 'emergency') {
          const days =
            (new Date(sorted[i].performed_date).getTime() -
              new Date(sorted[i - 1].performed_date).getTime()) /
            (1000 * 60 * 60 * 24);
          if (days >= 0) gaps.push(days);
        }
      }
    }

    if (gaps.length === 0) return 0;
    const avg = gaps.reduce((sum, n) => sum + n, 0) / gaps.length;
    return Math.round(avg * 10) / 10;
  }

  /**
   * Last 6 months of cost trend (oldest first).
   * Conforms to MaintenanceAnalytics.cost_trends — `actual` reflects spend in
   * that period, `predicted` projects the next-period mean from the prior trend,
   * and `budgeted` is left at 0 until a budget feed is available.
   */
  private static generateCostTrends(history: MaintenanceRecord[]): Array<{
    period: string;
    budgeted: number;
    actual: number;
    predicted: number;
  }> {
    if (history.length === 0) return [];
    const byMonth = new Map<string, number>();
    for (const h of history) {
      const key = h.performed_date.slice(0, 7);
      byMonth.set(key, (byMonth.get(key) || 0) + (h.cost || 0));
    }
    const ordered = Array.from(byMonth.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .slice(-6);

    return ordered.map(([period, actual], idx) => {
      const window = ordered.slice(Math.max(0, idx - 2), idx + 1).map(([, v]) => v);
      const predicted =
        window.length === 0
          ? actual
          : Math.round(window.reduce((s, v) => s + v, 0) / window.length);
      return { period, budgeted: 0, actual: Math.round(actual), predicted };
    });
  }

  /** Counts + cost share by category, conforming to MaintenanceAnalytics.category_breakdown. */
  private static generateCategoryBreakdown(alerts: PredictiveAlert[]): Array<{
    category: MaintenanceCategory;
    alert_count: number;
    cost_percentage: number;
  }> {
    if (alerts.length === 0) return [];
    const totalCost = alerts.reduce((sum, a) => sum + (a.estimated_cost || 0), 0);
    const map = new Map<MaintenanceCategory, { alert_count: number; cost: number }>();
    for (const a of alerts) {
      const cur = map.get(a.category) || { alert_count: 0, cost: 0 };
      cur.alert_count += 1;
      cur.cost += a.estimated_cost || 0;
      map.set(a.category, cur);
    }
    return Array.from(map.entries())
      .sort((a, b) => b[1].alert_count - a[1].alert_count)
      .map(([category, vals]) => ({
        category,
        alert_count: vals.alert_count,
        cost_percentage: totalCost > 0 ? Math.round((vals.cost / totalCost) * 1000) / 10 : 0,
      }));
  }

  private static calculateHealthScore(equipment: EquipmentData): number {
    const conditionScores = { excellent: 95, good: 80, fair: 60, poor: 40, critical: 20 };
    return conditionScores[equipment.current_condition];
  }

  private static assessCurrentRiskLevel(equipment: EquipmentData): RiskLevel {
    const conditionRiskMap = {
      excellent: 'low',
      good: 'low',
      fair: 'moderate',
      poor: 'high',
      critical: 'critical',
    };
    return conditionRiskMap[equipment.current_condition] as RiskLevel;
  }
}
