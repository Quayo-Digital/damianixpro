import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Calendar,
  Clock,
  DollarSign,
  Star,
  TrendingUp,
  Users,
  CheckCircle,
  AlertCircle,
  Briefcase,
} from 'lucide-react';

interface VendorStats {
  totalJobs: number;
  completedJobs: number;
  activeJobs: number;
  pendingJobs: number;
  totalEarnings: number;
  monthlyEarnings: number;
  averageRating: number;
  totalReviews: number;
  completionRate: number;
  responseTime: number; // in hours
}

interface VendorDashboardOverviewProps {
  stats: VendorStats;
  vendorName: string;
  vendorCategory: string;
  isLoading?: boolean;
}

export const VendorDashboardOverview: React.FC<VendorDashboardOverviewProps> = ({
  stats,
  vendorName,
  vendorCategory,
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

  const getCompletionRateColor = (rate: number) => {
    if (rate >= 90) return 'text-green-600';
    if (rate >= 75) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getRatingColor = (rating: number) => {
    if (rating >= 4.5) return 'text-green-600';
    if (rating >= 4.0) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(8)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="h-4 w-24 rounded bg-gray-200"></div>
              <div className="h-4 w-4 rounded bg-gray-200"></div>
            </CardHeader>
            <CardContent>
              <div className="mb-2 h-8 w-16 rounded bg-gray-200"></div>
              <div className="h-3 w-32 rounded bg-gray-200"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <Card className="border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50">
        <CardHeader>
          <CardTitle className="text-2xl text-blue-900">Welcome back, {vendorName}!</CardTitle>
          <CardDescription className="text-blue-700">
            <Badge variant="secondary" className="mr-2">
              <Briefcase className="mr-1 h-3 w-3" />
              {vendorCategory}
            </Badge>
            Here's your business performance overview
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Key Metrics Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Total Jobs */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Jobs</CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalJobs}</div>
            <p className="text-xs text-muted-foreground">All time assignments</p>
          </CardContent>
        </Card>

        {/* Active Jobs */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Jobs</CardTitle>
            <Clock className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.activeJobs}</div>
            <p className="text-xs text-muted-foreground">Currently in progress</p>
          </CardContent>
        </Card>

        {/* Monthly Earnings */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Month</CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(stats.monthlyEarnings)}
            </div>
            <p className="text-xs text-muted-foreground">Monthly earnings</p>
          </CardContent>
        </Card>

        {/* Average Rating */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rating</CardTitle>
            <Star className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getRatingColor(stats.averageRating)}`}>
              {stats.averageRating.toFixed(1)}
            </div>
            <p className="text-xs text-muted-foreground">{stats.totalReviews} reviews</p>
          </CardContent>
        </Card>
      </div>

      {/* Performance Metrics */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Completion Rate */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <CheckCircle className="h-5 w-5 text-green-600" />
              Job Completion Rate
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Completed Jobs</span>
              <span className="font-medium">
                {stats.completedJobs} / {stats.totalJobs}
              </span>
            </div>
            <Progress value={stats.completionRate} className="h-2" />
            <div className="flex items-center justify-between">
              <span className={`text-lg font-bold ${getCompletionRateColor(stats.completionRate)}`}>
                {stats.completionRate.toFixed(1)}%
              </span>
              <Badge
                variant={
                  stats.completionRate >= 90
                    ? 'default'
                    : stats.completionRate >= 75
                      ? 'secondary'
                      : 'destructive'
                }
              >
                {stats.completionRate >= 90
                  ? 'Excellent'
                  : stats.completionRate >= 75
                    ? 'Good'
                    : 'Needs Improvement'}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Job Status Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <TrendingUp className="h-5 w-5 text-blue-600" />
              Job Status Overview
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-blue-500"></div>
                  <span className="text-sm">Active</span>
                </div>
                <span className="font-medium">{stats.activeJobs}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-green-500"></div>
                  <span className="text-sm">Completed</span>
                </div>
                <span className="font-medium">{stats.completedJobs}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-yellow-500"></div>
                  <span className="text-sm">Pending</span>
                </div>
                <span className="font-medium">{stats.pendingJobs}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Quick Actions</CardTitle>
          <CardDescription>Common tasks and important information</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-3">
            <div className="flex items-center gap-3 rounded-lg border border-blue-200 bg-blue-50 p-3">
              <Calendar className="h-5 w-5 text-blue-600" />
              <div>
                <p className="font-medium text-blue-900">Update Schedule</p>
                <p className="text-xs text-blue-700">Manage your availability</p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-lg border border-green-200 bg-green-50 p-3">
              <DollarSign className="h-5 w-5 text-green-600" />
              <div>
                <p className="font-medium text-green-900">View Earnings</p>
                <p className="text-xs text-green-700">Track your income</p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-lg border border-purple-200 bg-purple-50 p-3">
              <Users className="h-5 w-5 text-purple-600" />
              <div>
                <p className="font-medium text-purple-900">Customer Reviews</p>
                <p className="text-xs text-purple-700">Manage feedback</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Performance Insights */}
      {stats.responseTime > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <AlertCircle className="h-5 w-5 text-orange-600" />
              Performance Insights
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between rounded-lg border border-orange-200 bg-orange-50 p-3">
                <div className="flex items-center gap-3">
                  <Clock className="h-4 w-4 text-orange-600" />
                  <div>
                    <p className="font-medium text-orange-900">Average Response Time</p>
                    <p className="text-xs text-orange-700">Time to respond to new jobs</p>
                  </div>
                </div>
                <Badge variant="outline" className="border-orange-300 text-orange-700">
                  {stats.responseTime}h
                </Badge>
              </div>

              <div className="text-sm text-muted-foreground">
                💡 <strong>Tip:</strong> Faster response times lead to more job assignments and
                better ratings!
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
