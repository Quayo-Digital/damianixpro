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
  CheckCircle
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
  onViewFinances
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-8 bg-gray-200 rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  };

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
              <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-blue-600 rounded-full flex items-center justify-center text-white text-xl font-bold">
                {ownerProfile.name?.charAt(0) || 'O'}
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">{ownerProfile.name}</h2>
                <p className="text-gray-600">{ownerProfile.business_name}</p>
                <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
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
              <div className="flex items-center space-x-2 mb-2">
                <Star className="h-5 w-5 text-yellow-500 fill-current" />
                <span className="text-lg font-semibold">{ownerProfile.average_roi}%</span>
                <span className="text-sm text-gray-500">Avg ROI</span>
              </div>
              <Badge variant={ownerProfile.verified ? "default" : "secondary"}>
                {ownerProfile.verified ? "Verified Owner" : "Pending Verification"}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Key Performance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Portfolio Value</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(stats.totalPortfolioValue)}
                </p>
                <p className="text-sm text-green-600 mt-1">
                  +{stats.portfolioAppreciation.toFixed(1)}% appreciation
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <Building className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Monthly Income</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(stats.monthlyRentIncome)}
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  {formatCurrency(stats.annualRentIncome)} annually
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <DollarSign className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Occupancy Rate</p>
                <p className="text-2xl font-bold text-gray-900">{stats.occupancyRate.toFixed(1)}%</p>
                <p className="text-sm text-gray-500 mt-1">
                  {stats.occupiedProperties} of {stats.totalProperties} occupied
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                <Home className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Net Income YTD</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(stats.netIncomeYTD)}
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  {formatCurrency(stats.cashFlow)} monthly cash flow
                </p>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button onClick={onAddProperty} className="flex items-center space-x-2">
              <Plus className="h-4 w-4" />
              <span>Add New Property</span>
            </Button>
            <Button variant="outline" onClick={onViewTenants} className="flex items-center space-x-2">
              <Users className="h-4 w-4" />
              <span>Manage Tenants</span>
            </Button>
            <Button variant="outline" onClick={onViewFinances} className="flex items-center space-x-2">
              <BarChart3 className="h-4 w-4" />
              <span>View Finances</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Portfolio Performance Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Financial Performance</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Gross Rent Yield</span>
              <span className="text-lg font-bold text-green-600">
                {performanceMetrics.financialPerformance.grossRentYield.toFixed(1)}%
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Net Rent Yield</span>
              <span className="text-lg font-bold text-blue-600">
                {performanceMetrics.financialPerformance.netRentYield.toFixed(1)}%
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Capital Growth</span>
              <span className="text-lg font-bold text-purple-600">
                {performanceMetrics.financialPerformance.capitalGrowth.toFixed(1)}%
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Cash-on-Cash Return</span>
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
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Total Tenants</span>
              <span className="text-lg font-bold">{performanceMetrics.tenantMetrics.totalTenants}</span>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">On-Time Payment Rate</span>
                <span className="text-lg font-bold text-green-600">
                  {performanceMetrics.tenantMetrics.onTimePaymentRate}%
                </span>
              </div>
              <Progress value={performanceMetrics.tenantMetrics.onTimePaymentRate} className="h-2" />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Tenant Satisfaction</span>
                <div className="flex items-center space-x-1">
                  <Star className="h-4 w-4 text-yellow-500 fill-current" />
                  <span className="text-lg font-bold">
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
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Retention Rate</span>
                <span className="text-lg font-bold text-blue-600">
                  {performanceMetrics.tenantMetrics.tenantRetentionRate}%
                </span>
              </div>
              <Progress value={performanceMetrics.tenantMetrics.tenantRetentionRate} className="h-2" />
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
            <div className="text-center">
              <div className={`text-2xl font-bold ${getRiskColor(performanceMetrics.riskAnalysis.overallRiskScore)}`}>
                {performanceMetrics.riskAnalysis.overallRiskScore}%
              </div>
              <p className="text-sm text-gray-600">Overall Risk Score</p>
              <Badge className={getRiskBadgeColor(performanceMetrics.riskAnalysis.overallRiskScore)}>
                {performanceMetrics.riskAnalysis.overallRiskScore <= 20 ? 'Low Risk' : 
                 performanceMetrics.riskAnalysis.overallRiskScore <= 40 ? 'Medium Risk' : 'High Risk'}
              </Badge>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {performanceMetrics.riskAnalysis.concentrationRisk}%
              </div>
              <p className="text-sm text-gray-600">Geographic Concentration</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {performanceMetrics.riskAnalysis.tenantCreditRisk}%
              </div>
              <p className="text-sm text-gray-600">Tenant Credit Risk</p>
            </div>
          </div>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-sm font-medium">Maintenance Risk</span>
              <div className="flex items-center space-x-2">
                <Progress value={performanceMetrics.riskAnalysis.maintenanceRisk} className="w-24 h-2" />
                <span className="text-sm font-bold">{performanceMetrics.riskAnalysis.maintenanceRisk}%</span>
              </div>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-sm font-medium">Market Risk</span>
              <div className="flex items-center space-x-2">
                <Progress value={performanceMetrics.riskAnalysis.marketRisk} className="w-24 h-2" />
                <span className="text-sm font-bold">{performanceMetrics.riskAnalysis.marketRisk}%</span>
              </div>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-sm font-medium">Liquidity Risk</span>
              <div className="flex items-center space-x-2">
                <Progress value={performanceMetrics.riskAnalysis.liquidityRisk} className="w-24 h-2" />
                <span className="text-sm font-bold">{performanceMetrics.riskAnalysis.liquidityRisk}%</span>
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {performanceMetrics.achievements.map((achievement) => (
              <div key={achievement.id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                <div className="text-2xl">{achievement.icon}</div>
                <div>
                  <h4 className="font-semibold text-sm">{achievement.title}</h4>
                  <p className="text-xs text-gray-600">{achievement.description}</p>
                  <p className="text-xs text-gray-500 mt-1">
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                +{performanceMetrics.marketIntelligence.portfolioVsMarket.toFixed(1)}%
              </div>
              <p className="text-sm text-gray-600">vs Market Performance</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                +{performanceMetrics.marketIntelligence.rentGrowthVsMarket.toFixed(1)}%
              </div>
              <p className="text-sm text-gray-600">Rent Growth vs Market</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                +{performanceMetrics.marketIntelligence.occupancyVsMarket.toFixed(1)}%
              </div>
              <p className="text-sm text-gray-600">Occupancy vs Market</p>
            </div>
          </div>
          
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-2">Your portfolio is outperforming the market across key metrics</p>
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
