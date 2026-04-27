import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  TrendingUp,
  TrendingDown,
  Star,
  Clock,
  DollarSign,
  Target,
  Award,
  Calendar,
  BarChart3,
  PieChart,
} from 'lucide-react';

interface PerformanceMetrics {
  monthlyEarnings: {
    current: number;
    previous: number;
    trend: 'up' | 'down' | 'stable';
  };
  completionRate: {
    current: number;
    target: number;
    trend: 'up' | 'down' | 'stable';
  };
  averageRating: {
    current: number;
    previous: number;
    totalReviews: number;
  };
  responseTime: {
    current: number; // in hours
    target: number;
    trend: 'up' | 'down' | 'stable';
  };
  jobsCompleted: {
    thisMonth: number;
    lastMonth: number;
    trend: 'up' | 'down' | 'stable';
  };
  customerSatisfaction: {
    score: number;
    breakdown: {
      excellent: number;
      good: number;
      average: number;
      poor: number;
    };
  };
  earningsBreakdown: {
    byCategory: Array<{
      category: string;
      amount: number;
      percentage: number;
    }>;
    byMonth: Array<{
      month: string;
      amount: number;
    }>;
  };
  achievements: Array<{
    id: string;
    title: string;
    description: string;
    icon: string;
    earnedDate: string;
    type: 'milestone' | 'performance' | 'customer_service';
  }>;
}

interface VendorPerformanceAnalyticsProps {
  metrics: PerformanceMetrics;
  vendorName: string;
  isLoading?: boolean;
}

export const VendorPerformanceAnalytics: React.FC<VendorPerformanceAnalyticsProps> = ({
  metrics,
  vendorName,
  isLoading = false,
}) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
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

  const getPerformanceLevel = (score: number, max: number = 100) => {
    const percentage = (score / max) * 100;
    if (percentage >= 90)
      return { level: 'Excellent', color: 'text-green-600', bgColor: 'bg-green-50' };
    if (percentage >= 75) return { level: 'Good', color: 'text-blue-600', bgColor: 'bg-blue-50' };
    if (percentage >= 60)
      return { level: 'Average', color: 'text-yellow-600', bgColor: 'bg-yellow-50' };
    return { level: 'Needs Improvement', color: 'text-red-600', bgColor: 'bg-red-50' };
  };

  const getAchievementIcon = (type: string) => {
    switch (type) {
      case 'milestone':
        return <Target className="h-5 w-5 text-blue-600" />;
      case 'performance':
        return <Award className="h-5 w-5 text-green-600" />;
      case 'customer_service':
        return <Star className="h-5 w-5 text-yellow-600" />;
      default:
        return <Award className="h-5 w-5 text-gray-600" />;
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-6 w-48 rounded bg-gray-200"></div>
              <div className="h-4 w-64 rounded bg-gray-200"></div>
            </CardHeader>
            <CardContent>
              <div className="h-32 rounded bg-gray-200"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const completionPerformance = getPerformanceLevel(metrics.completionRate.current);
  const ratingPerformance = getPerformanceLevel(metrics.averageRating.current, 5);

  return (
    <div className="space-y-6">
      {/* Performance Overview */}
      <Card className="border-purple-200 bg-gradient-to-r from-purple-50 to-pink-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-2xl text-purple-900">
            <BarChart3 className="h-6 w-6" />
            Performance Analytics
          </CardTitle>
          <CardDescription className="text-purple-700">
            Comprehensive insights into your business performance and growth
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Key Performance Indicators */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Monthly Earnings Trend */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Earnings</CardTitle>
            <div className="flex items-center gap-1">
              {getTrendIcon(metrics.monthlyEarnings.trend)}
              <DollarSign className="h-4 w-4 text-green-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(metrics.monthlyEarnings.current)}
            </div>
            <div className="flex items-center gap-1 text-xs">
              <span className="text-muted-foreground">vs last month:</span>
              <span className={getTrendColor(metrics.monthlyEarnings.trend)}>
                {metrics.monthlyEarnings.previous > 0
                  ? `${(((metrics.monthlyEarnings.current - metrics.monthlyEarnings.previous) / metrics.monthlyEarnings.previous) * 100).toFixed(1)}%`
                  : 'N/A'}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Completion Rate */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
            <div className="flex items-center gap-1">
              {getTrendIcon(metrics.completionRate.trend)}
              <Target className="h-4 w-4 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${completionPerformance.color}`}>
              {metrics.completionRate.current.toFixed(1)}%
            </div>
            <div className="mt-1 flex items-center justify-between text-xs">
              <span className="text-muted-foreground">
                Target: {metrics.completionRate.target}%
              </span>
              <Badge variant="outline" className={completionPerformance.color}>
                {completionPerformance.level}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Average Rating */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Rating</CardTitle>
            <Star className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${ratingPerformance.color}`}>
              {metrics.averageRating.current.toFixed(1)}
            </div>
            <div className="mt-1 flex items-center justify-between text-xs">
              <span className="text-muted-foreground">
                {metrics.averageRating.totalReviews} reviews
              </span>
              <Badge variant="outline" className={ratingPerformance.color}>
                {ratingPerformance.level}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Response Time */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Response Time</CardTitle>
            <div className="flex items-center gap-1">
              {getTrendIcon(metrics.responseTime.trend)}
              <Clock className="h-4 w-4 text-orange-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {metrics.responseTime.current}h
            </div>
            <div className="text-xs text-muted-foreground">
              Target: {metrics.responseTime.target}h
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Analytics */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Customer Satisfaction Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="h-5 w-5 text-purple-600" />
              Customer Satisfaction
            </CardTitle>
            <CardDescription>Breakdown of customer feedback ratings</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600">
                {metrics.customerSatisfaction.score.toFixed(1)}
              </div>
              <p className="text-sm text-muted-foreground">Overall Score</p>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-green-500"></div>
                  <span className="text-sm">Excellent (5★)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">
                    {metrics.customerSatisfaction.breakdown.excellent}
                  </span>
                  <div className="h-2 w-16 rounded-full bg-gray-200">
                    <div
                      className="h-2 rounded-full bg-green-500"
                      style={{
                        width: `${(metrics.customerSatisfaction.breakdown.excellent / metrics.averageRating.totalReviews) * 100}%`,
                      }}
                    ></div>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-blue-500"></div>
                  <span className="text-sm">Good (4★)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">
                    {metrics.customerSatisfaction.breakdown.good}
                  </span>
                  <div className="h-2 w-16 rounded-full bg-gray-200">
                    <div
                      className="h-2 rounded-full bg-blue-500"
                      style={{
                        width: `${(metrics.customerSatisfaction.breakdown.good / metrics.averageRating.totalReviews) * 100}%`,
                      }}
                    ></div>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-yellow-500"></div>
                  <span className="text-sm">Average (3★)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">
                    {metrics.customerSatisfaction.breakdown.average}
                  </span>
                  <div className="h-2 w-16 rounded-full bg-gray-200">
                    <div
                      className="h-2 rounded-full bg-yellow-500"
                      style={{
                        width: `${(metrics.customerSatisfaction.breakdown.average / metrics.averageRating.totalReviews) * 100}%`,
                      }}
                    ></div>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-red-500"></div>
                  <span className="text-sm">Poor (≤2★)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">
                    {metrics.customerSatisfaction.breakdown.poor}
                  </span>
                  <div className="h-2 w-16 rounded-full bg-gray-200">
                    <div
                      className="h-2 rounded-full bg-red-500"
                      style={{
                        width: `${(metrics.customerSatisfaction.breakdown.poor / metrics.averageRating.totalReviews) * 100}%`,
                      }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Earnings by Category */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-green-600" />
              Earnings by Category
            </CardTitle>
            <CardDescription>Revenue breakdown by service type</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {metrics.earningsBreakdown.byCategory.map((category, index) => (
              <div key={category.category} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{category.category}</span>
                  <div className="text-right">
                    <div className="text-sm font-bold text-green-600">
                      {formatCurrency(category.amount)}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {category.percentage.toFixed(1)}%
                    </div>
                  </div>
                </div>
                <Progress value={category.percentage} className="h-2" />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Achievements */}
      {metrics.achievements.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5 text-yellow-600" />
              Recent Achievements
            </CardTitle>
            <CardDescription>Your latest milestones and accomplishments</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {metrics.achievements.slice(0, 6).map((achievement) => (
                <div
                  key={achievement.id}
                  className="flex items-start gap-3 rounded-lg border border-yellow-200 bg-gradient-to-br from-yellow-50 to-orange-50 p-4"
                >
                  <div className="flex-shrink-0">{getAchievementIcon(achievement.type)}</div>
                  <div className="space-y-1">
                    <h4 className="text-sm font-medium">{achievement.title}</h4>
                    <p className="text-xs text-muted-foreground">{achievement.description}</p>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-3 w-3 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">
                        {new Date(achievement.earnedDate).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Performance Insights */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-blue-600" />
            Performance Insights
          </CardTitle>
          <CardDescription>AI-powered recommendations to improve your business</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {metrics.completionRate.current < metrics.completionRate.target && (
              <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
                <div className="flex items-start gap-3">
                  <Target className="mt-0.5 h-5 w-5 text-blue-600" />
                  <div>
                    <h4 className="font-medium text-blue-900">Improve Completion Rate</h4>
                    <p className="mt-1 text-sm text-blue-700">
                      Your completion rate is {metrics.completionRate.current.toFixed(1)}%, which is
                      below the target of {metrics.completionRate.target}%. Focus on better time
                      management and communication with clients.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {metrics.responseTime.current > metrics.responseTime.target && (
              <div className="rounded-lg border border-orange-200 bg-orange-50 p-4">
                <div className="flex items-start gap-3">
                  <Clock className="mt-0.5 h-5 w-5 text-orange-600" />
                  <div>
                    <h4 className="font-medium text-orange-900">Faster Response Time</h4>
                    <p className="mt-1 text-sm text-orange-700">
                      Your average response time is {metrics.responseTime.current}h, which exceeds
                      the target of {metrics.responseTime.target}h. Quicker responses lead to more
                      job assignments!
                    </p>
                  </div>
                </div>
              </div>
            )}

            {metrics.averageRating.current >= 4.5 && (
              <div className="rounded-lg border border-green-200 bg-green-50 p-4">
                <div className="flex items-start gap-3">
                  <Star className="mt-0.5 h-5 w-5 text-green-600" />
                  <div>
                    <h4 className="font-medium text-green-900">Excellent Customer Service!</h4>
                    <p className="mt-1 text-sm text-green-700">
                      Your {metrics.averageRating.current.toFixed(1)}-star rating shows exceptional
                      service quality. Keep up the great work to maintain premium pricing!
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
