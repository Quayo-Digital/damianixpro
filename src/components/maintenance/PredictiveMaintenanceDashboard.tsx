// Predictive Maintenance Dashboard Component

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  AlertTriangle,
  Calendar,
  TrendingUp,
  TrendingDown,
  Wrench,
  Clock,
  DollarSign,
  Shield,
  Zap,
  CheckCircle,
  XCircle,
  AlertCircle,
  RefreshCw,
  Filter,
  BarChart3,
  Activity,
  Settings,
  Bell,
  Target,
  Lightbulb,
  Timer
} from 'lucide-react';
import { usePredictiveMaintenance } from '@/hooks/usePredictiveMaintenance';
import { MaintenanceCategory, MaintenancePriority, RiskLevel } from '@/types/predictiveMaintenance';

interface PredictiveMaintenanceDashboardProps {
  propertyId?: string;
  className?: string;
}

export const PredictiveMaintenanceDashboard: React.FC<PredictiveMaintenanceDashboardProps> = ({
  propertyId,
  className = ''
}) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedCategory, setSelectedCategory] = useState<MaintenanceCategory | 'all'>('all');
  const [selectedPriority, setSelectedPriority] = useState<MaintenancePriority | 'all'>('all');

  const {
    alerts,
    schedule,
    equipment,
    insights,
    analytics,
    isLoading,
    generatePredictions,
    isGeneratingPredictions,
    updateAlert,
    getTotalPredictedSavings,
    getCriticalAlertsCount,
    getAlertsByPriority,
    getUpcomingMaintenance,
    refreshAllData
  } = usePredictiveMaintenance({ propertyId });

  const filteredAlerts = alerts.filter(alert => {
    if (selectedCategory !== 'all' && alert.category !== selectedCategory) return false;
    if (selectedPriority !== 'all' && alert.priority !== selectedPriority) return false;
    return true;
  });

  const upcomingMaintenance = getUpcomingMaintenance(30);
  const criticalAlertsCount = getCriticalAlertsCount();
  const totalPredictedSavings = getTotalPredictedSavings();

  const getPriorityIcon = (priority: MaintenancePriority) => {
    switch (priority) {
      case 'critical': return <AlertTriangle className="h-4 w-4 text-red-600" />;
      case 'high': return <AlertCircle className="h-4 w-4 text-orange-600" />;
      case 'medium': return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'low': return <CheckCircle className="h-4 w-4 text-green-600" />;
    }
  };

  const getRiskLevelColor = (riskLevel: RiskLevel) => {
    switch (riskLevel) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'moderate': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
    }
  };

  const getCategoryIcon = (category: MaintenanceCategory) => {
    const iconMap = {
      'plumbing': '🔧',
      'electrical': '⚡',
      'hvac': '❄️',
      'structural': '🏗️',
      'appliances': '📱',
      'security': '🔒',
      'exterior': '🏠',
      'interior': '🛋️',
      'landscaping': '🌿'
    };
    return iconMap[category] || '🔧';
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-NG', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getDaysUntil = (dateString: string) => {
    const targetDate = new Date(dateString);
    const today = new Date();
    const diffTime = targetDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  if (isLoading) {
    return (
      <div className={`space-y-6 ${className}`}>
        <div className="grid gap-4 md:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-8 bg-gray-200 rounded w-1/2"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Predictive Maintenance</h2>
          <p className="text-muted-foreground">
            AI-powered maintenance insights and predictions
          </p>
        </div>
        <div className="flex space-x-2">
          <Button
            variant="outline"
            onClick={refreshAllData}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button
            onClick={() => propertyId && generatePredictions(propertyId)}
            disabled={isGeneratingPredictions || !propertyId}
          >
            <Zap className="h-4 w-4 mr-2" />
            {isGeneratingPredictions ? 'Generating...' : 'Generate Predictions'}
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Critical Alerts</p>
                <p className="text-2xl font-bold text-red-600">{criticalAlertsCount}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-600" />
            </div>
            <div className="mt-2 flex items-center text-xs text-muted-foreground">
              <TrendingUp className="h-3 w-3 mr-1" />
              Requires immediate attention
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Alerts</p>
                <p className="text-2xl font-bold">{alerts.length}</p>
              </div>
              <Bell className="h-8 w-8 text-blue-600" />
            </div>
            <div className="mt-2 flex items-center text-xs text-muted-foreground">
              <Activity className="h-3 w-3 mr-1" />
              Active predictions
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Predicted Savings</p>
                <p className="text-2xl font-bold text-green-600">
                  {formatCurrency(totalPredictedSavings)}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-green-600" />
            </div>
            <div className="mt-2 flex items-center text-xs text-muted-foreground">
              <TrendingUp className="h-3 w-3 mr-1" />
              Preventive maintenance savings
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Upcoming Tasks</p>
                <p className="text-2xl font-bold">{upcomingMaintenance.length}</p>
              </div>
              <Calendar className="h-8 w-8 text-purple-600" />
            </div>
            <div className="mt-2 flex items-center text-xs text-muted-foreground">
              <Timer className="h-3 w-3 mr-1" />
              Next 30 days
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="alerts">Alerts</TabsTrigger>
          <TabsTrigger value="schedule">Schedule</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Critical Alerts */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center text-lg">
                  <AlertTriangle className="h-5 w-5 mr-2 text-red-600" />
                  Critical Alerts
                </CardTitle>
                <CardDescription>
                  Issues requiring immediate attention
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {getAlertsByPriority('critical').slice(0, 3).map((alert) => (
                  <div key={alert.id} className="flex items-center justify-between p-3 border rounded-lg bg-red-50 border-red-200">
                    <div className="flex-1">
                      <p className="font-medium text-sm">{alert.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {getCategoryIcon(alert.category)} {alert.category} • Due in {getDaysUntil(alert.predicted_failure_date)} days
                      </p>
                    </div>
                    <Badge variant="destructive" className="ml-2">
                      {Math.round(alert.confidence_score * 100)}%
                    </Badge>
                  </div>
                ))}
                {getAlertsByPriority('critical').length === 0 && (
                  <div className="text-center py-4 text-muted-foreground">
                    <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-600" />
                    <p>No critical alerts</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Upcoming Maintenance */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center text-lg">
                  <Calendar className="h-5 w-5 mr-2 text-blue-600" />
                  Upcoming Maintenance
                </CardTitle>
                <CardDescription>
                  Scheduled tasks for the next 30 days
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {upcomingMaintenance.slice(0, 3).map((task) => (
                  <div key={task.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex-1">
                      <p className="font-medium text-sm">{task.task_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {getCategoryIcon(task.category)} {task.category} • {formatDate(task.next_due)}
                      </p>
                    </div>
                    <Badge variant="outline">
                      {task.priority}
                    </Badge>
                  </div>
                ))}
                {upcomingMaintenance.length === 0 && (
                  <div className="text-center py-4 text-muted-foreground">
                    <Calendar className="h-8 w-8 mx-auto mb-2" />
                    <p>No upcoming maintenance</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Equipment Health Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Activity className="h-5 w-5 mr-2 text-green-600" />
                Equipment Health Overview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                {equipment.slice(0, 6).map((item) => (
                  <div key={item.id} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-sm">{item.equipment_type.replace('_', ' ')}</h4>
                      <Badge 
                        variant="outline" 
                        className={getRiskLevelColor(
                          item.current_condition === 'critical' ? 'critical' :
                          item.current_condition === 'poor' ? 'high' :
                          item.current_condition === 'fair' ? 'moderate' : 'low'
                        )}
                      >
                        {item.current_condition}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mb-2">
                      {item.brand} {item.model}
                    </p>
                    <Progress 
                      value={
                        item.current_condition === 'excellent' ? 95 :
                        item.current_condition === 'good' ? 80 :
                        item.current_condition === 'fair' ? 60 :
                        item.current_condition === 'poor' ? 40 : 20
                      } 
                      className="h-2"
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="alerts" className="space-y-4">
          {/* Filters */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4" />
              <span className="text-sm font-medium">Filters:</span>
            </div>
            <Select value={selectedCategory} onValueChange={(value) => setSelectedCategory(value as any)}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="plumbing">Plumbing</SelectItem>
                <SelectItem value="electrical">Electrical</SelectItem>
                <SelectItem value="hvac">HVAC</SelectItem>
                <SelectItem value="structural">Structural</SelectItem>
                <SelectItem value="appliances">Appliances</SelectItem>
                <SelectItem value="security">Security</SelectItem>
              </SelectContent>
            </Select>
            <Select value={selectedPriority} onValueChange={(value) => setSelectedPriority(value as any)}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priorities</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Alerts List */}
          <div className="space-y-4">
            {filteredAlerts.map((alert) => (
              <Card key={alert.id}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        {getPriorityIcon(alert.priority)}
                        <h3 className="font-semibold">{alert.title}</h3>
                        <Badge className={getRiskLevelColor(alert.risk_level)}>
                          {alert.risk_level} risk
                        </Badge>
                        <Badge variant="outline">
                          {Math.round(alert.confidence_score * 100)}% confidence
                        </Badge>
                      </div>
                      
                      <p className="text-sm text-muted-foreground mb-3">
                        {alert.description}
                      </p>
                      
                      <div className="grid md:grid-cols-3 gap-4 mb-4">
                        <div className="flex items-center space-x-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">
                            Due: {formatDate(alert.predicted_failure_date)}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <DollarSign className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">
                            Cost: {formatCurrency(alert.estimated_cost)}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <TrendingUp className="h-4 w-4 text-green-600" />
                          <span className="text-sm text-green-600">
                            Saves: {formatCurrency(alert.potential_savings)}
                          </span>
                        </div>
                      </div>

                      {/* Recommended Actions */}
                      <div className="space-y-2">
                        <h4 className="text-sm font-medium">Recommended Actions:</h4>
                        {alert.recommended_actions.map((action, index) => (
                          <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                            <span className="text-sm">{action.action}</span>
                            <div className="flex items-center space-x-2">
                              <Badge variant="outline" className="text-xs">
                                {action.urgency.replace('_', ' ')}
                              </Badge>
                              <span className="text-xs text-muted-foreground">
                                {formatCurrency(action.estimated_cost)}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <div className="ml-4 space-y-2">
                      <Button
                        size="sm"
                        onClick={() => updateAlert({ 
                          alertId: alert.id, 
                          status: 'scheduled' 
                        })}
                      >
                        Schedule
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updateAlert({ 
                          alertId: alert.id, 
                          status: 'completed' 
                        })}
                      >
                        Mark Complete
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            
            {filteredAlerts.length === 0 && (
              <Card>
                <CardContent className="p-12 text-center">
                  <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-600" />
                  <h3 className="text-lg font-semibold mb-2">No Alerts Found</h3>
                  <p className="text-muted-foreground">
                    {alerts.length === 0 
                      ? "No maintenance alerts at this time. Your equipment is in good condition!"
                      : "No alerts match your current filters."
                    }
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="schedule" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Maintenance Schedule</CardTitle>
              <CardDescription>
                Planned maintenance tasks and their schedules
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {schedule.map((task) => (
                  <div key={task.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <h4 className="font-medium">{task.task_name}</h4>
                        <Badge variant="outline">{task.priority}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">
                        {task.description}
                      </p>
                      <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                        <span>Category: {getCategoryIcon(task.category)} {task.category}</span>
                        <span>Frequency: {task.frequency_type}</span>
                        <span>Duration: {task.estimated_duration}</span>
                        <span>Cost: {formatCurrency(task.estimated_cost)}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">
                        Next Due: {formatDate(task.next_due)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {getDaysUntil(task.next_due)} days
                      </p>
                    </div>
                  </div>
                ))}
                
                {schedule.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <Calendar className="h-12 w-12 mx-auto mb-4" />
                    <p>No scheduled maintenance tasks</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="insights" className="space-y-4">
          <div className="space-y-4">
            {insights.map((insight) => (
              <Card key={insight.id}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <Lightbulb className="h-5 w-5 text-yellow-600" />
                        <h3 className="font-semibold">{insight.title}</h3>
                        <Badge variant="outline">
                          Impact: {insight.impact_score}/100
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-3">
                        {insight.description}
                      </p>
                      <div className="flex items-center space-x-4 text-sm">
                        <span className="flex items-center text-green-600">
                          <DollarSign className="h-4 w-4 mr-1" />
                          Potential Savings: {formatCurrency(insight.potential_savings)}
                        </span>
                        <span>
                          Effort: {insight.implementation_effort}
                        </span>
                        <span>
                          Timeline: {insight.recommended_timeline}
                        </span>
                      </div>
                    </div>
                    <Badge 
                      variant={insight.insight_type === 'cost_optimization' ? 'default' : 'secondary'}
                    >
                      {insight.insight_type.replace('_', ' ')}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
            
            {insights.length === 0 && (
              <Card>
                <CardContent className="p-12 text-center">
                  <Lightbulb className="h-12 w-12 mx-auto mb-4 text-yellow-600" />
                  <h3 className="text-lg font-semibold mb-2">No Insights Available</h3>
                  <p className="text-muted-foreground">
                    Insights will be generated as more maintenance data becomes available.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          {analytics ? (
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <BarChart3 className="h-5 w-5 mr-2" />
                    Performance Metrics
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between">
                    <span>Prediction Accuracy</span>
                    <span className="font-semibold">{analytics.accuracy_rate}%</span>
                  </div>
                  <Progress value={analytics.accuracy_rate} className="h-2" />
                  
                  <div className="flex justify-between">
                    <span>Avg Response Time</span>
                    <span className="font-semibold">{analytics.average_response_time} days</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span>Total Predicted Savings</span>
                    <span className="font-semibold text-green-600">
                      {formatCurrency(analytics.predicted_savings)}
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Equipment Health</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {analytics.equipment_health.map((item, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <span className="text-sm">{item.equipment_type.replace('_', ' ')}</span>
                        <div className="flex items-center space-x-2">
                          <Progress value={item.health_score} className="w-20 h-2" />
                          <Badge 
                            variant="outline" 
                            className={getRiskLevelColor(item.risk_level)}
                          >
                            {item.risk_level}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card>
              <CardContent className="p-12 text-center">
                <BarChart3 className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">Analytics Loading</h3>
                <p className="text-muted-foreground">
                  Analytics will be available once data is processed.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PredictiveMaintenanceDashboard;
