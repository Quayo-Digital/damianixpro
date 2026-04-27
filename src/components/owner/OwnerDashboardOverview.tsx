import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  TrendingUp,
  TrendingDown,
  Home,
  Users,
  DollarSign,
  Calendar,
  Phone,
  Mail,
  MapPin,
  Star,
  Award,
  Target,
  BarChart3,
  Plus,
  Building,
  PiggyBank,
  AlertTriangle,
  CheckCircle,
} from 'lucide-react';
import { OwnerStats, OwnerPerformanceMetrics } from '@/hooks/useEnhancedOwnerData';

interface OwnerDashboardOverviewProps {
  ownerProfile: any;
  stats: OwnerStats | null;
  performanceMetrics: OwnerPerformanceMetrics | null;
  onAddProperty: () => void;
  onAddTenant: (tenantData: any) => void;
  onViewTenants: () => void;
  onViewFinances: () => void;
}

const OwnerDashboardOverview: React.FC<OwnerDashboardOverviewProps> = ({
  ownerProfile,
  stats,
  performanceMetrics,
  onAddProperty,
  onAddTenant,
  onViewTenants,
  onViewFinances,
}) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-NG').format(num);
  };

  if (!ownerProfile || !stats || !performanceMetrics) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="mb-2 h-4 rounded bg-muted"></div>
                <div className="h-8 rounded bg-muted"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const getRiskColor = (score: number) => {
    if (score <= 20) return 'text-green-600';
    if (score <= 40) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getRiskBadgeColor = (score: number) => {
    if (score <= 20) return 'bg-green-100 text-green-800';
    if (score <= 40) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  return (
    <div className="space-y-6">
      {/* Owner Profile Header */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-green-500 to-blue-600 text-xl font-bold text-white">
                {ownerProfile.name?.charAt(0) || 'O'}
              </div>
              <div>
                <h2 className="text-2xl font-bold text-foreground">{ownerProfile.name}</h2>
                <p className="text-muted-foreground">{ownerProfile.business_name}</p>
                <div className="mt-2 flex items-center space-x-4 text-sm text-muted-foreground">
                  <div className="flex items-center space-x-1">
                    <Mail className="h-4 w-4" />
                    <span>{ownerProfile.email}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Phone className="h-4 w-4" />
                    <span>{ownerProfile.phone}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Building className="h-4 w-4" />
                    <span>{ownerProfile.investment_strategy}</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="mb-2 flex items-center space-x-2">
                <Star className="h-5 w-5 fill-current text-yellow-500" />
                <span className="text-lg font-semibold text-foreground">
                  {ownerProfile.average_roi}%
                </span>
                <span className="text-sm text-muted-foreground">Avg ROI</span>
              </div>
              <Badge variant={ownerProfile.verified ? 'default' : 'secondary'}>
                {ownerProfile.verified ? 'Verified Owner' : 'Pending Verification'}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Key Performance Metrics */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Portfolio Value</p>
                <p className="text-2xl font-bold text-foreground">
                  {formatCurrency(stats.totalPortfolioValue)}
                </p>
                <p className="mt-1 text-sm text-green-600">
                  +{stats.portfolioAppreciation.toFixed(1)}% appreciation
                </p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                <Building className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Monthly Income</p>
                <p className="text-2xl font-bold text-foreground">
                  {formatCurrency(stats.monthlyRentIncome)}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {formatCurrency(stats.annualRentIncome)} annually
                </p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
                <DollarSign className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Occupancy Rate</p>
                <p className="text-2xl font-bold text-foreground">
                  {stats.occupancyRate.toFixed(1)}%
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {stats.occupiedProperties} of {stats.totalProperties} occupied
                </p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-purple-100">
                <Home className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Net Income YTD</p>
                <p className="text-2xl font-bold text-foreground">
                  {formatCurrency(stats.netIncomeYTD)}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {formatCurrency(stats.cashFlow)} monthly cash flow
                </p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-orange-100">
                <PiggyBank className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Calendar className="h-5 w-5" />
            <span>Quick Actions</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <Button onClick={onAddProperty} className="flex items-center space-x-2">
              <Plus className="h-4 w-4" />
              <span>Add New Property</span>
            </Button>
            <Button
              variant="outline"
              onClick={onViewTenants}
              className="flex items-center space-x-2"
            >
              <Users className="h-4 w-4" />
              <span>Manage Tenants</span>
            </Button>
            <Button
              variant="outline"
              onClick={onViewFinances}
              className="flex items-center space-x-2"
            >
              <BarChart3 className="h-4 w-4" />
              <span>View Finances</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Portfolio Performance Overview */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Financial Performance</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-foreground">Gross Rent Yield</span>
              <span className="text-lg font-bold text-green-600">
                {performanceMetrics.financialPerformance.grossRentYield.toFixed(1)}%
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-foreground">Net Rent Yield</span>
              <span className="text-lg font-bold text-blue-600">
                {performanceMetrics.financialPerformance.netRentYield.toFixed(1)}%
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-foreground">Capital Growth</span>
              <span className="text-lg font-bold text-purple-600">
                {performanceMetrics.financialPerformance.capitalGrowth.toFixed(1)}%
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-foreground">Cash-on-Cash Return</span>
              <span className="text-lg font-bold text-orange-600">
                {performanceMetrics.financialPerformance.cashOnCashReturn.toFixed(1)}%
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Tenant Metrics</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-foreground">Total Tenants</span>
              <span className="text-lg font-bold text-foreground">
                {performanceMetrics.tenantMetrics.totalTenants}
              </span>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-foreground">On-Time Payment Rate</span>
                <span className="text-lg font-bold text-green-600">
                  {performanceMetrics.tenantMetrics.onTimePaymentRate}%
                </span>
              </div>
              <Progress
                value={performanceMetrics.tenantMetrics.onTimePaymentRate}
                className="h-2"
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-foreground">Tenant Satisfaction</span>
                <div className="flex items-center space-x-1">
                  <Star className="h-4 w-4 fill-current text-yellow-500" />
                  <span className="text-lg font-bold text-foreground">
                    {performanceMetrics.tenantMetrics.averageTenantSatisfaction.toFixed(1)}
                  </span>
                </div>
              </div>
              <Progress
                value={(performanceMetrics.tenantMetrics.averageTenantSatisfaction / 5) * 100}
                className="h-2"
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Retention Rate</span>
                <span className="text-lg font-bold text-blue-600">
                  {performanceMetrics.tenantMetrics.tenantRetentionRate}%
                </span>
              </div>
              <Progress
                value={performanceMetrics.tenantMetrics.tenantRetentionRate}
                className="h-2"
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Risk Analysis */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <AlertTriangle className="h-5 w-5" />
            <span>Portfolio Risk Analysis</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            <div className="text-center">
              <div
                className={`text-2xl font-bold ${getRiskColor(performanceMetrics.riskAnalysis.overallRiskScore)}`}
              >
                {performanceMetrics.riskAnalysis.overallRiskScore}%
              </div>
              <p className="text-sm text-muted-foreground">Overall Risk Score</p>
              <Badge
                className={getRiskBadgeColor(performanceMetrics.riskAnalysis.overallRiskScore)}
              >
                {performanceMetrics.riskAnalysis.overallRiskScore <= 20
                  ? 'Low Risk'
                  : performanceMetrics.riskAnalysis.overallRiskScore <= 40
                    ? 'Medium Risk'
                    : 'High Risk'}
              </Badge>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {performanceMetrics.riskAnalysis.concentrationRisk}%
              </div>
              <p className="text-sm text-muted-foreground">Geographic Concentration</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {performanceMetrics.riskAnalysis.tenantCreditRisk}%
              </div>
              <p className="text-sm text-muted-foreground">Tenant Credit Risk</p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between rounded-lg bg-muted/50 p-3">
              <span className="text-sm font-medium text-foreground">Maintenance Risk</span>
              <div className="flex items-center space-x-2">
                <Progress
                  value={performanceMetrics.riskAnalysis.maintenanceRisk}
                  className="h-2 w-24"
                />
                <span className="text-sm font-bold text-foreground">
                  {performanceMetrics.riskAnalysis.maintenanceRisk}%
                </span>
              </div>
            </div>
            <div className="flex items-center justify-between rounded-lg bg-muted/50 p-3">
              <span className="text-sm font-medium text-foreground">Market Risk</span>
              <div className="flex items-center space-x-2">
                <Progress value={performanceMetrics.riskAnalysis.marketRisk} className="h-2 w-24" />
                <span className="text-sm font-bold text-foreground">
                  {performanceMetrics.riskAnalysis.marketRisk}%
                </span>
              </div>
            </div>
            <div className="flex items-center justify-between rounded-lg bg-muted/50 p-3">
              <span className="text-sm font-medium text-foreground">Liquidity Risk</span>
              <div className="flex items-center space-x-2">
                <Progress
                  value={performanceMetrics.riskAnalysis.liquidityRisk}
                  className="h-2 w-24"
                />
                <span className="text-sm font-bold text-foreground">
                  {performanceMetrics.riskAnalysis.liquidityRisk}%
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Achievements */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Award className="h-5 w-5" />
            <span>Recent Achievements</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            {performanceMetrics.achievements.map((achievement) => (
              <div
                key={achievement.id}
                className="flex items-center space-x-3 rounded-lg bg-muted/50 p-3"
              >
                <div className="text-2xl">{achievement.icon}</div>
                <div>
                  <h4 className="text-sm font-semibold text-foreground">{achievement.title}</h4>
                  <p className="text-xs text-muted-foreground">{achievement.description}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {new Date(achievement.earnedDate).toLocaleDateString('en-NG')}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Market Intelligence Preview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <BarChart3 className="h-5 w-5" />
            <span>Market Intelligence</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                +{performanceMetrics.marketIntelligence.portfolioVsMarket.toFixed(1)}%
              </div>
              <p className="text-sm text-muted-foreground">vs Market Performance</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                +{performanceMetrics.marketIntelligence.rentGrowthVsMarket.toFixed(1)}%
              </div>
              <p className="text-sm text-muted-foreground">Rent Growth vs Market</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                +{performanceMetrics.marketIntelligence.occupancyVsMarket.toFixed(1)}%
              </div>
              <p className="text-sm text-muted-foreground">Occupancy vs Market</p>
            </div>
          </div>

          <div className="text-center">
            <p className="mb-2 text-sm text-muted-foreground">
              Your portfolio is outperforming the market across key metrics
            </p>
            <div className="flex items-center justify-center space-x-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <span className="text-sm font-medium text-green-800">Strong Market Position</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default OwnerDashboardOverview;
