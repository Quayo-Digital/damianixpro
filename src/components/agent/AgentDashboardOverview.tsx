import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  TrendingUp,
  TrendingDown,
  Users,
  Home,
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
} from 'lucide-react';
import { AgentStats, AgentPerformanceMetrics } from '@/hooks/useEnhancedAgentData';

interface AgentDashboardOverviewProps {
  agentProfile: any;
  stats: AgentStats | null;
  performanceMetrics: AgentPerformanceMetrics | null;
  onAddLead: () => void;
  onViewProperties: () => void;
  onViewClients: () => void;
}

const AgentDashboardOverview: React.FC<AgentDashboardOverviewProps> = ({
  agentProfile,
  stats,
  performanceMetrics,
  onAddLead,
  onViewProperties,
  onViewClients,
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

  if (!agentProfile || !stats || !performanceMetrics) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="mb-2 h-4 rounded bg-gray-200"></div>
                <div className="h-8 rounded bg-gray-200"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

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

  return (
    <div className="space-y-6">
      {/* Agent Profile Header */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-xl font-bold text-white">
                {agentProfile.name?.charAt(0) || 'A'}
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">{agentProfile.name}</h2>
                <p className="text-gray-600">{agentProfile.specialization}</p>
                <div className="mt-2 flex items-center space-x-4 text-sm text-gray-500">
                  <div className="flex items-center space-x-1">
                    <Mail className="h-4 w-4" />
                    <span>{agentProfile.email}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Phone className="h-4 w-4" />
                    <span>{agentProfile.phone}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <MapPin className="h-4 w-4" />
                    <span>{agentProfile.service_areas?.join(', ')}</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="mb-2 flex items-center space-x-2">
                <Star className="h-5 w-5 fill-current text-yellow-500" />
                <span className="text-lg font-semibold">{agentProfile.average_rating}</span>
                <span className="text-sm text-gray-500">
                  ({agentProfile.total_reviews} reviews)
                </span>
              </div>
              <Badge variant={agentProfile.verified ? 'default' : 'secondary'}>
                {agentProfile.verified ? 'Verified Agent' : 'Pending Verification'}
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
                <p className="text-sm font-medium text-gray-600">Total Commission</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(stats.totalCommission)}
                </p>
                <p className="mt-1 text-sm text-gray-500">
                  {formatCurrency(stats.monthlyCommission)} this month
                </p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                <DollarSign className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Leads</p>
                <p className="text-2xl font-bold text-gray-900">{stats.activeLeads}</p>
                <div className="mt-1 flex items-center space-x-1">
                  {getTrendIcon(performanceMetrics.leadGeneration.trend)}
                  <p
                    className={`text-sm ${getTrendColor(performanceMetrics.leadGeneration.trend)}`}
                  >
                    {performanceMetrics.leadGeneration.thisMonth} this month
                  </p>
                </div>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Listings</p>
                <p className="text-2xl font-bold text-gray-900">{stats.activeListings}</p>
                <p className="mt-1 text-sm text-gray-500">
                  {stats.totalProperties} total properties
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
                <p className="text-sm font-medium text-gray-600">Conversion Rate</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.conversionRate.toFixed(1)}%
                </p>
                <p className="mt-1 text-sm text-gray-500">
                  {stats.convertedLeads} of {stats.totalLeads} leads
                </p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-orange-100">
                <Target className="h-6 w-6 text-orange-600" />
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
            <Button onClick={onAddLead} className="flex items-center space-x-2">
              <Plus className="h-4 w-4" />
              <span>Add New Lead</span>
            </Button>
            <Button
              variant="outline"
              onClick={onViewProperties}
              className="flex items-center space-x-2"
            >
              <Home className="h-4 w-4" />
              <span>Manage Properties</span>
            </Button>
            <Button
              variant="outline"
              onClick={onViewClients}
              className="flex items-center space-x-2"
            >
              <Users className="h-4 w-4" />
              <span>View Clients</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Performance Overview */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Sales Performance</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Properties Sold</span>
              <span className="text-lg font-bold">
                {performanceMetrics.salesPerformance.propertiesSold}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Properties Rented</span>
              <span className="text-lg font-bold">
                {performanceMetrics.salesPerformance.propertiesRented}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Total Volume</span>
              <span className="text-lg font-bold">
                {formatCurrency(performanceMetrics.salesPerformance.totalVolume)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Market Share</span>
              <span className="text-lg font-bold">
                {performanceMetrics.salesPerformance.marketShare}%
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Client Metrics</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Total Clients</span>
              <span className="text-lg font-bold">
                {performanceMetrics.clientMetrics.totalClients}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Active Clients</span>
              <span className="text-lg font-bold">
                {performanceMetrics.clientMetrics.activeClients}
              </span>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Client Satisfaction</span>
                <span className="text-lg font-bold">
                  {performanceMetrics.clientMetrics.averageSatisfactionScore.toFixed(1)}/5.0
                </span>
              </div>
              <Progress
                value={(performanceMetrics.clientMetrics.averageSatisfactionScore / 5) * 100}
                className="h-2"
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Retention Rate</span>
                <span className="text-lg font-bold">
                  {performanceMetrics.clientMetrics.clientRetentionRate}%
                </span>
              </div>
              <Progress
                value={performanceMetrics.clientMetrics.clientRetentionRate}
                className="h-2"
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Achievements */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Award className="h-5 w-5" />
            <span>Recent Achievements</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {performanceMetrics.achievements.map((achievement) => (
              <div
                key={achievement.id}
                className="flex items-center space-x-3 rounded-lg bg-gray-50 p-3"
              >
                <div className="text-2xl">{achievement.icon}</div>
                <div>
                  <h4 className="text-sm font-semibold">{achievement.title}</h4>
                  <p className="text-xs text-gray-600">{achievement.description}</p>
                  <p className="mt-1 text-xs text-gray-500">
                    {new Date(achievement.earnedDate).toLocaleDateString('en-NG')}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AgentDashboardOverview;
