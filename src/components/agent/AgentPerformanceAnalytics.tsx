import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  TrendingUp,
  TrendingDown,
  BarChart3,
  DollarSign,
  Users,
  Home,
  Target,
  MapPin,
  Calendar,
  Award,
  Star,
  Briefcase,
} from 'lucide-react';
import { AgentPerformanceMetrics } from '@/hooks/useEnhancedAgentData';

interface AgentPerformanceAnalyticsProps {
  performanceMetrics: AgentPerformanceMetrics | null;
}

const AgentPerformanceAnalytics: React.FC<AgentPerformanceAnalyticsProps> = ({
  performanceMetrics,
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

  const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'down':
        return <TrendingDown className="h-4 w-4 text-red-600" />;
      default:
        return <BarChart3 className="h-4 w-4 text-gray-600" />;
    }
  };

  const getTrendColor = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up':
        return 'text-green-600';
      case 'down':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const getDemandLevelColor = (level: 'low' | 'medium' | 'high') => {
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
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="mb-2 h-4 rounded bg-gray-200"></div>
                <div className="mb-2 h-8 rounded bg-gray-200"></div>
                <div className="h-4 rounded bg-gray-200"></div>
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
        <h2 className="text-2xl font-bold text-gray-900">Performance Analytics</h2>
        <p className="text-gray-600">Comprehensive insights into your business performance</p>
      </div>

      {/* Lead Generation Analytics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Users className="h-5 w-5" />
            <span>Lead Generation Performance</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
            <div className="text-center">
              <div className="mb-2 flex items-center justify-center space-x-2">
                {getTrendIcon(performanceMetrics.leadGeneration.trend)}
                <span className="text-2xl font-bold">
                  {performanceMetrics.leadGeneration.thisMonth}
                </span>
              </div>
              <p className="text-sm text-gray-600">Leads This Month</p>
              <p className={`text-xs ${getTrendColor(performanceMetrics.leadGeneration.trend)}`}>
                vs {performanceMetrics.leadGeneration.lastMonth} last month
              </p>
            </div>
            <div className="text-center">
              <div className="mb-2 text-2xl font-bold text-purple-600">
                {performanceMetrics.leadGeneration.conversionRate.toFixed(1)}%
              </div>
              <p className="text-sm text-gray-600">Conversion Rate</p>
              <Progress
                value={performanceMetrics.leadGeneration.conversionRate}
                className="mt-2 h-2"
              />
            </div>
            <div className="text-center">
              <div className="mb-2 text-2xl font-bold text-green-600">
                {formatCurrency(performanceMetrics.leadGeneration.averageLeadValue)}
              </div>
              <p className="text-sm text-gray-600">Avg Lead Value</p>
            </div>
            <div className="text-center">
              <div className="mb-2 text-2xl font-bold text-blue-600">
                {formatCurrency(
                  performanceMetrics.leadGeneration.averageLeadValue *
                    performanceMetrics.leadGeneration.thisMonth
                )}
              </div>
              <p className="text-sm text-gray-600">Pipeline Value</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Sales Performance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Home className="h-5 w-5" />
            <span>Sales Performance</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
            <div className="text-center">
              <div className="mb-2 text-2xl font-bold text-blue-600">
                {performanceMetrics.salesPerformance.propertiesSold}
              </div>
              <p className="text-sm text-gray-600">Properties Sold</p>
            </div>
            <div className="text-center">
              <div className="mb-2 text-2xl font-bold text-purple-600">
                {performanceMetrics.salesPerformance.propertiesRented}
              </div>
              <p className="text-sm text-gray-600">Properties Rented</p>
            </div>
            <div className="text-center">
              <div className="mb-2 text-2xl font-bold text-green-600">
                {formatCurrency(performanceMetrics.salesPerformance.totalVolume)}
              </div>
              <p className="text-sm text-gray-600">Total Volume</p>
            </div>
            <div className="text-center">
              <div className="mb-2 text-2xl font-bold text-orange-600">
                {performanceMetrics.salesPerformance.marketShare.toFixed(1)}%
              </div>
              <p className="text-sm text-gray-600">Market Share</p>
              <Progress
                value={performanceMetrics.salesPerformance.marketShare}
                className="mt-2 h-2"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Commission Analytics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <DollarSign className="h-5 w-5" />
            <span>Commission Analytics</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
            <div>
              <p className="mb-1 text-sm font-medium text-gray-600">Total Earnings</p>
              <p className="text-2xl font-bold text-green-600">
                {formatCurrency(performanceMetrics.commissionAnalytics.totalEarnings)}
              </p>
            </div>
            <div>
              <p className="mb-1 text-sm font-medium text-gray-600">Monthly Earnings</p>
              <p className="text-2xl font-bold text-blue-600">
                {formatCurrency(performanceMetrics.commissionAnalytics.monthlyEarnings)}
              </p>
            </div>
            <div>
              <p className="mb-1 text-sm font-medium text-gray-600">Projected Annual</p>
              <p className="text-2xl font-bold text-purple-600">
                {formatCurrency(performanceMetrics.commissionAnalytics.projectedAnnual)}
              </p>
            </div>
            <div>
              <p className="mb-1 text-sm font-medium text-gray-600">Average Commission</p>
              <p className="text-2xl font-bold text-orange-600">
                {formatCurrency(performanceMetrics.commissionAnalytics.averageCommission)}
              </p>
            </div>
          </div>
          <div className="mt-6 rounded-lg bg-green-50 p-4">
            <div className="flex items-center space-x-2">
              <Award className="h-5 w-5 text-green-600" />
              <span className="font-medium text-green-800">Top Performing Category</span>
            </div>
            <p className="mt-1 text-green-700">
              {performanceMetrics.commissionAnalytics.topPerformingCategory}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Client Metrics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Briefcase className="h-5 w-5" />
            <span>Client Relationship Metrics</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-600">Total Clients</span>
                <span className="text-lg font-bold">
                  {performanceMetrics.clientMetrics.totalClients}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-600">Active Clients</span>
                <span className="text-lg font-bold text-blue-600">
                  {performanceMetrics.clientMetrics.activeClients}
                </span>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-600">Client Retention Rate</span>
                  <span className="text-lg font-bold text-green-600">
                    {performanceMetrics.clientMetrics.clientRetentionRate}%
                  </span>
                </div>
                <Progress
                  value={performanceMetrics.clientMetrics.clientRetentionRate}
                  className="h-2"
                />
              </div>
            </div>
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-600">Satisfaction Score</span>
                  <div className="flex items-center space-x-1">
                    <Star className="h-4 w-4 fill-current text-yellow-500" />
                    <span className="text-lg font-bold">
                      {performanceMetrics.clientMetrics.averageSatisfactionScore.toFixed(1)}
                    </span>
                  </div>
                </div>
                <Progress
                  value={(performanceMetrics.clientMetrics.averageSatisfactionScore / 5) * 100}
                  className="h-2"
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-600">Referral Rate</span>
                  <span className="text-lg font-bold text-purple-600">
                    {performanceMetrics.clientMetrics.referralRate}%
                  </span>
                </div>
                <Progress value={performanceMetrics.clientMetrics.referralRate} className="h-2" />
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
          <div className="mb-6 grid grid-cols-1 gap-6 md:grid-cols-2">
            <div className="text-center">
              <div className="mb-2 text-2xl font-bold text-blue-600">
                {performanceMetrics.marketIntelligence.averageDaysOnMarket.toFixed(0)} days
              </div>
              <p className="text-sm text-gray-600">Average Days on Market</p>
            </div>
            <div className="text-center">
              <div className="mb-2 text-2xl font-bold text-green-600">
                {performanceMetrics.marketIntelligence.priceAccuracy.toFixed(1)}%
              </div>
              <p className="text-sm text-gray-600">Price Accuracy</p>
              <Progress
                value={performanceMetrics.marketIntelligence.priceAccuracy}
                className="mt-2 h-2"
              />
            </div>
          </div>

          <div>
            <h4 className="mb-4 font-semibold text-gray-900">Market Trends by Area</h4>
            <div className="space-y-3">
              {performanceMetrics.marketIntelligence.marketTrends.map((trend, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between rounded-lg bg-gray-50 p-3"
                >
                  <div>
                    <h5 className="font-medium text-gray-900">{trend.area}</h5>
                    <p className="text-sm text-gray-600">
                      Avg Price: {formatCurrency(trend.averagePrice)}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center space-x-2">
                      <Badge className={getDemandLevelColor(trend.demandLevel)}>
                        {trend.demandLevel.toUpperCase()} DEMAND
                      </Badge>
                    </div>
                    <p
                      className={`text-sm font-medium ${trend.priceChange >= 0 ? 'text-green-600' : 'text-red-600'}`}
                    >
                      {trend.priceChange >= 0 ? '+' : ''}
                      {trend.priceChange.toFixed(1)}% change
                    </p>
                  </div>
                </div>
              ))}
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
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {performanceMetrics.achievements.map((achievement) => (
              <div
                key={achievement.id}
                className="flex items-start space-x-3 rounded-lg border p-4 transition-colors hover:bg-gray-50"
              >
                <div className="text-2xl">{achievement.icon}</div>
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900">{achievement.title}</h4>
                  <p className="mt-1 text-sm text-gray-600">{achievement.description}</p>
                  <div className="mt-2 flex items-center justify-between">
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

export default AgentPerformanceAnalytics;
