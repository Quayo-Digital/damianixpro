import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  TrendingUp, 
  TrendingDown, 
  BarChart3,
  DollarSign,
  PiggyBank,
  Target,
  MapPin,
  Calendar,
  Award,
  AlertTriangle,
  CheckCircle,
  Building,
  Users
} from 'lucide-react';
import { OwnerPerformanceMetrics } from '@/hooks/useEnhancedOwnerData';

interface OwnerFinancialAnalyticsProps {
  performanceMetrics: OwnerPerformanceMetrics | null;
}

const OwnerFinancialAnalytics: React.FC<OwnerFinancialAnalyticsProps> = ({
  performanceMetrics
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

  const getTrendIcon = (value: number) => {
    return value >= 0 ? <TrendingUp className="h-4 w-4 text-green-600" /> : <TrendingDown className="h-4 w-4 text-red-600" />;
  };

  const getTrendColor = (value: number) => {
    return value >= 0 ? 'text-green-600' : 'text-red-600';
  };

  const getPerformanceColor = (value: number, benchmark: number) => {
    if (value >= benchmark * 1.1) return 'text-green-600';
    if (value >= benchmark * 0.9) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getMarketActivityColor = (level: 'low' | 'medium' | 'high') => {
    switch (level) {
      case 'high':
        return 'bg-green-100 text-green-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (!performanceMetrics) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-8 bg-gray-200 rounded mb-2"></div>
                <div className="h-4 bg-gray-200 rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Financial Analytics</h2>
        <p className="text-gray-600">Comprehensive insights into your property investment performance</p>
      </div>

      {/* Portfolio Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Building className="h-5 w-5" />
            <span>Portfolio Overview</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600 mb-2">
                {formatCurrency(performanceMetrics.portfolioOverview.totalValue)}
              </div>
              <p className="text-sm text-gray-600">Total Portfolio Value</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600 mb-2">
                {formatCurrency(performanceMetrics.portfolioOverview.monthlyIncome)}
              </div>
              <p className="text-sm text-gray-600">Monthly Income</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600 mb-2">
                {formatCurrency(performanceMetrics.portfolioOverview.annualIncome)}
              </div>
              <p className="text-sm text-gray-600">Annual Income</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600 mb-2">
                {formatCurrency(performanceMetrics.portfolioOverview.netWorth)}
              </div>
              <p className="text-sm text-gray-600">Net Worth</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center space-x-2 mb-2">
                {getTrendIcon(performanceMetrics.portfolioOverview.portfolioGrowth)}
                <span className={`text-2xl font-bold ${getTrendColor(performanceMetrics.portfolioOverview.portfolioGrowth)}`}>
                  {performanceMetrics.portfolioOverview.portfolioGrowth >= 0 ? '+' : ''}{performanceMetrics.portfolioOverview.portfolioGrowth.toFixed(1)}%
                </span>
              </div>
              <p className="text-sm text-gray-600">Portfolio Growth</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Financial Performance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <DollarSign className="h-5 w-5" />
            <span>Financial Performance</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="space-y-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600 mb-2">
                  {performanceMetrics.financialPerformance.grossRentYield.toFixed(1)}%
                </div>
                <p className="text-sm text-gray-600">Gross Rent Yield</p>
                <Progress value={Math.min(performanceMetrics.financialPerformance.grossRentYield, 15) / 15 * 100} className="h-2 mt-2" />
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600 mb-2">
                  {performanceMetrics.financialPerformance.netRentYield.toFixed(1)}%
                </div>
                <p className="text-sm text-gray-600">Net Rent Yield</p>
                <Progress value={Math.min(performanceMetrics.financialPerformance.netRentYield, 12) / 12 * 100} className="h-2 mt-2" />
              </div>
            </div>
            <div className="space-y-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600 mb-2">
                  {performanceMetrics.financialPerformance.capitalGrowth.toFixed(1)}%
                </div>
                <p className="text-sm text-gray-600">Capital Growth</p>
                <Progress value={Math.min(performanceMetrics.financialPerformance.capitalGrowth, 20) / 20 * 100} className="h-2 mt-2" />
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600 mb-2">
                  {performanceMetrics.financialPerformance.totalReturn.toFixed(1)}%
                </div>
                <p className="text-sm text-gray-600">Total Return</p>
                <Progress value={Math.min(performanceMetrics.financialPerformance.totalReturn, 25) / 25 * 100} className="h-2 mt-2" />
              </div>
            </div>
            <div className="space-y-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-indigo-600 mb-2">
                  {performanceMetrics.financialPerformance.cashOnCashReturn.toFixed(1)}%
                </div>
                <p className="text-sm text-gray-600">Cash-on-Cash Return</p>
                <Progress value={Math.min(performanceMetrics.financialPerformance.cashOnCashReturn, 20) / 20 * 100} className="h-2 mt-2" />
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600 mb-2">
                  {performanceMetrics.financialPerformance.operatingExpenseRatio.toFixed(1)}%
                </div>
                <p className="text-sm text-gray-600">Operating Expense Ratio</p>
                <Progress value={performanceMetrics.financialPerformance.operatingExpenseRatio} className="h-2 mt-2" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Property Metrics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <BarChart3 className="h-5 w-5" />
            <span>Property Performance Metrics</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-600">Average Occupancy Rate</span>
                <span className="text-lg font-bold text-green-600">{performanceMetrics.propertyMetrics.averageOccupancyRate.toFixed(1)}%</span>
              </div>
              <Progress value={performanceMetrics.propertyMetrics.averageOccupancyRate} className="h-2" />
              
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-600">Average Rent per m²</span>
                <span className="text-lg font-bold text-blue-600">
                  {formatCurrency(performanceMetrics.propertyMetrics.averageRentPerSqm)}
                </span>
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-600">Maintenance Cost Ratio</span>
                <span className="text-lg font-bold text-orange-600">{performanceMetrics.propertyMetrics.maintenanceCostRatio.toFixed(1)}%</span>
              </div>
              <Progress value={performanceMetrics.propertyMetrics.maintenanceCostRatio} className="h-2" />
              
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-600">Tenant Turnover Rate</span>
                <span className="text-lg font-bold text-red-600">{performanceMetrics.propertyMetrics.tenantTurnoverRate}%</span>
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-600">Average Tenancy Length</span>
                <span className="text-lg font-bold text-purple-600">{performanceMetrics.propertyMetrics.averageTenancyLength} months</span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-600">Property Appreciation Rate</span>
                <span className={`text-lg font-bold ${getTrendColor(performanceMetrics.propertyMetrics.propertyAppreciationRate)}`}>
                  {performanceMetrics.propertyMetrics.propertyAppreciationRate >= 0 ? '+' : ''}{performanceMetrics.propertyMetrics.propertyAppreciationRate.toFixed(1)}%
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tenant Metrics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Users className="h-5 w-5" />
            <span>Tenant Relationship Metrics</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-600">Total Tenants</span>
                <span className="text-lg font-bold">{performanceMetrics.tenantMetrics.totalTenants}</span>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-600">On-Time Payment Rate</span>
                  <span className="text-lg font-bold text-green-600">{performanceMetrics.tenantMetrics.onTimePaymentRate}%</span>
                </div>
                <Progress value={performanceMetrics.tenantMetrics.onTimePaymentRate} className="h-2" />
              </div>
            </div>
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-600">Tenant Satisfaction</span>
                  <span className="text-lg font-bold text-blue-600">{performanceMetrics.tenantMetrics.averageTenantSatisfaction.toFixed(1)}/5.0</span>
                </div>
                <Progress value={(performanceMetrics.tenantMetrics.averageTenantSatisfaction / 5) * 100} className="h-2" />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-600">Tenant Retention Rate</span>
                  <span className="text-lg font-bold text-purple-600">{performanceMetrics.tenantMetrics.tenantRetentionRate}%</span>
                </div>
                <Progress value={performanceMetrics.tenantMetrics.tenantRetentionRate} className="h-2" />
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-600">Average Rent Increase</span>
                <span className="text-lg font-bold text-orange-600">{performanceMetrics.tenantMetrics.averageRentIncrease}%</span>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-600">Collection Efficiency</span>
                  <span className="text-lg font-bold text-indigo-600">{performanceMetrics.tenantMetrics.collectionEfficiency}%</span>
                </div>
                <Progress value={performanceMetrics.tenantMetrics.collectionEfficiency} className="h-2" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Market Intelligence */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <MapPin className="h-5 w-5" />
            <span>Market Intelligence</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="text-center">
              <div className="flex items-center justify-center space-x-2 mb-2">
                <TrendingUp className="h-5 w-5 text-green-600" />
                <span className="text-2xl font-bold text-green-600">
                  +{performanceMetrics.marketIntelligence.portfolioVsMarket.toFixed(1)}%
                </span>
              </div>
              <p className="text-sm text-gray-600">Portfolio vs Market Performance</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center space-x-2 mb-2">
                <TrendingUp className="h-5 w-5 text-blue-600" />
                <span className="text-2xl font-bold text-blue-600">
                  +{performanceMetrics.marketIntelligence.rentGrowthVsMarket.toFixed(1)}%
                </span>
              </div>
              <p className="text-sm text-gray-600">Rent Growth vs Market</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center space-x-2 mb-2">
                <TrendingUp className="h-5 w-5 text-purple-600" />
                <span className="text-2xl font-bold text-purple-600">
                  +{performanceMetrics.marketIntelligence.occupancyVsMarket.toFixed(1)}%
                </span>
              </div>
              <p className="text-sm text-gray-600">Occupancy vs Market</p>
            </div>
          </div>

          <div>
            <h4 className="font-semibold text-gray-900 mb-4">Market Trends by Area</h4>
            <div className="space-y-3">
              {performanceMetrics.marketIntelligence.marketTrends.map((trend, index) => (
                <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <h5 className="font-medium text-gray-900">{trend.area}</h5>
                    <p className="text-sm text-gray-600">
                      Avg Rent: {formatCurrency(trend.averageRent)}/m² • Occupancy: {trend.occupancyRate}%
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center space-x-2 mb-1">
                      <Badge className={getMarketActivityColor(trend.marketActivity)}>
                        {trend.marketActivity.toUpperCase()} ACTIVITY
                      </Badge>
                    </div>
                    <p className={`text-sm font-medium ${trend.rentGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {trend.rentGrowth >= 0 ? '+' : ''}{trend.rentGrowth.toFixed(1)}% rent growth
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Risk Analysis */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <AlertTriangle className="h-5 w-5" />
            <span>Portfolio Risk Analysis</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-orange-600 mb-2">
                {performanceMetrics.riskAnalysis.overallRiskScore}%
              </div>
              <p className="text-sm text-gray-600 mb-2">Overall Risk Score</p>
              <Badge className={
                performanceMetrics.riskAnalysis.overallRiskScore <= 20 ? 'bg-green-100 text-green-800' :
                performanceMetrics.riskAnalysis.overallRiskScore <= 40 ? 'bg-yellow-100 text-yellow-800' :
                'bg-red-100 text-red-800'
              }>
                {performanceMetrics.riskAnalysis.overallRiskScore <= 20 ? 'Low Risk' :
                 performanceMetrics.riskAnalysis.overallRiskScore <= 40 ? 'Medium Risk' : 'High Risk'}
              </Badge>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Concentration Risk</span>
                <span className="text-sm font-bold">{performanceMetrics.riskAnalysis.concentrationRisk}%</span>
              </div>
              <Progress value={performanceMetrics.riskAnalysis.concentrationRisk} className="h-2" />
              
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Tenant Credit Risk</span>
                <span className="text-sm font-bold">{performanceMetrics.riskAnalysis.tenantCreditRisk}%</span>
              </div>
              <Progress value={performanceMetrics.riskAnalysis.tenantCreditRisk} className="h-2" />
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Market Risk</span>
                <span className="text-sm font-bold">{performanceMetrics.riskAnalysis.marketRisk}%</span>
              </div>
              <Progress value={performanceMetrics.riskAnalysis.marketRisk} className="h-2" />
              
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Liquidity Risk</span>
                <span className="text-sm font-bold">{performanceMetrics.riskAnalysis.liquidityRisk}%</span>
              </div>
              <Progress value={performanceMetrics.riskAnalysis.liquidityRisk} className="h-2" />
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {performanceMetrics.achievements.map((achievement) => (
              <div key={achievement.id} className="flex items-start space-x-3 p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                <div className="text-2xl">{achievement.icon}</div>
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900">{achievement.title}</h4>
                  <p className="text-sm text-gray-600 mt-1">{achievement.description}</p>
                  <div className="flex items-center justify-between mt-2">
                    <Badge variant="outline" className="text-xs">
                      {achievement.type.replace('_', ' ').toUpperCase()}
                    </Badge>
                    <span className="text-xs text-gray-500">
                      {new Date(achievement.earnedDate).toLocaleDateString('en-NG')}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default OwnerFinancialAnalytics;
