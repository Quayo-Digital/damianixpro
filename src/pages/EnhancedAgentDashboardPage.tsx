import React, { useMemo, useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import {
  Loader2,
  AlertCircle,
  BarChart3,
  Users,
  Sparkles,
  Home,
  TrendingUp,
  Target,
  LayoutGrid,
} from 'lucide-react';
import { useEnhancedAgentData } from '@/hooks/useEnhancedAgentData';
import AgentDashboardOverview from '@/components/agent/AgentDashboardOverview';
import AgentLeadManagement from '@/components/agent/AgentLeadManagement';
import AgentPerformanceAnalytics from '@/components/agent/AgentPerformanceAnalytics';
import { RoleScreeningBanner } from '@/components/screening/RoleScreeningBanner';
import { DamianixProAssistantChat } from '@/components/assistant/DamianixProAssistantChat';
import { RoleDashboardInsights } from '@/components/dashboard/role-dashboard/RoleDashboardInsights';
import type {
  RoleDashboardActivity,
  RoleDashboardQuickAction,
  RoleDashboardStat,
} from '@/components/dashboard/role-dashboard/types';
import { formatDistanceToNow } from 'date-fns';

const EnhancedAgentDashboardPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const {
    agentProfile,
    leads,
    properties,
    clients,
    stats,
    performanceMetrics,
    isLoading,
    error,
    updateLeadStatus,
    addNewLead,
  } = useEnhancedAgentData();

  const fmtNgn = (n: number) =>
    new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(n);

  const agentPulse = useMemo(() => {
    const s = stats;
    const statsRow: RoleDashboardStat[] = [
      {
        title: 'Pipeline leads',
        value: String(s?.totalLeads ?? 0),
        icon: <Users className="h-4 w-4" />,
        description: `${s?.activeLeads ?? 0} active`,
      },
      {
        title: 'Conversion rate',
        value: s != null ? `${Math.round(s.conversionRate)}%` : '—',
        icon: <Target className="h-4 w-4" />,
        description: 'Closed ÷ total leads',
      },
      {
        title: 'Active listings',
        value: String(s?.activeListings ?? 0),
        icon: <Home className="h-4 w-4" />,
        description: `${s?.totalProperties ?? 0} properties tracked`,
      },
      {
        title: 'Commission (total)',
        value: s != null ? fmtNgn(s.totalCommission) : '—',
        icon: <TrendingUp className="h-4 w-4" />,
        description: s != null ? `${fmtNgn(s.monthlyCommission)} this month` : '',
      },
    ];

    const quickActions: RoleDashboardQuickAction[] = [
      { label: 'CRM pipeline', to: '/crm/pipeline', icon: LayoutGrid },
      { label: 'Properties', to: '/properties', icon: Home },
      { label: 'Service tickets', to: '/maintenance/service-tickets', icon: BarChart3 },
      { label: 'Executive analytics', to: '/analytics/executive', icon: TrendingUp },
    ];

    const activities: RoleDashboardActivity[] = [...(leads || [])]
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 8)
      .map((lead) => ({
        id: lead.id,
        title: `${lead.client_name} · ${lead.status.replace(/_/g, ' ')}`,
        meta: lead.preferred_location || lead.lead_source,
        time: lead.created_at
          ? formatDistanceToNow(new Date(lead.created_at), { addSuffix: true })
          : undefined,
        icon: '📇',
      }));

    return { statsRow, quickActions, activities };
  }, [leads, stats]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <Card className="w-96">
          <CardContent className="p-8 text-center">
            <Loader2 className="mx-auto mb-4 h-8 w-8 animate-spin text-blue-600" />
            <h3 className="mb-2 text-lg font-semibold text-gray-900">Loading Agent Dashboard</h3>
            <p className="text-gray-600">Fetching your business data and analytics...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <AlertCircle className="mx-auto mb-4 h-8 w-8 text-red-600" />
            <h3 className="mb-2 text-lg font-semibold text-gray-900">Dashboard Error</h3>
            <p className="mb-4 text-gray-600">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="rounded-lg bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700"
            >
              Retry Loading
            </button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleAddLead = () => {
    setActiveTab('leads');
  };

  const handleViewProperties = () => {
    // In a full implementation, this would navigate to properties tab
    // For now, we'll show an alert since we haven't implemented property management yet
    alert('Property management will be available in the next update!');
  };

  const handleViewClients = () => {
    // In a full implementation, this would navigate to clients tab
    // For now, we'll show an alert since we haven't implemented client management yet
    alert('Client management will be available in the next update!');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <RoleScreeningBanner />

        <RoleDashboardInsights
          sectionTitle="Agency pulse"
          stats={agentPulse.statsRow}
          quickActions={agentPulse.quickActions}
          activities={agentPulse.activities}
          activityTitle="Recent leads"
          activityEmptyMessage="No leads in your workspace yet."
        />

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Agent Dashboard</h1>
              <p className="mt-1 text-gray-600">
                Welcome back, {agentProfile?.name || 'Agent'}! Here's your business overview.
              </p>
            </div>
            <div className="hidden items-center space-x-4 md:flex">
              <div className="text-right">
                <p className="text-sm text-gray-500">Total Commission</p>
                <p className="text-xl font-bold text-green-600">
                  {stats
                    ? new Intl.NumberFormat('en-NG', {
                        style: 'currency',
                        currency: 'NGN',
                        minimumFractionDigits: 0,
                        maximumFractionDigits: 0,
                      }).format(stats.totalCommission)
                    : '₦0'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Main Dashboard Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 lg:inline-flex lg:w-auto">
            <TabsTrigger value="overview" className="flex items-center space-x-2">
              <BarChart3 className="h-4 w-4" />
              <span>Overview</span>
            </TabsTrigger>
            <TabsTrigger value="leads" className="flex items-center space-x-2">
              <Users className="h-4 w-4" />
              <span>Lead Management</span>
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center space-x-2">
              <BarChart3 className="h-4 w-4" />
              <span>Analytics</span>
            </TabsTrigger>
            <TabsTrigger value="assistant" className="flex items-center space-x-2">
              <Sparkles className="h-4 w-4" />
              <span>Assistant</span>
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <AgentDashboardOverview
              agentProfile={agentProfile}
              stats={stats}
              performanceMetrics={performanceMetrics}
              onAddLead={handleAddLead}
              onViewProperties={handleViewProperties}
              onViewClients={handleViewClients}
            />
          </TabsContent>

          {/* Lead Management Tab */}
          <TabsContent value="leads" className="space-y-6">
            <AgentLeadManagement
              leads={leads}
              onUpdateLeadStatus={updateLeadStatus}
              onAddNewLead={addNewLead}
            />
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            <AgentPerformanceAnalytics performanceMetrics={performanceMetrics} />
          </TabsContent>

          <TabsContent value="assistant" className="space-y-6">
            <DamianixProAssistantChat />
          </TabsContent>
        </Tabs>

        {/* Footer */}
        <div className="mt-12 border-t border-gray-200 pt-8">
          <div className="flex flex-col items-center justify-between space-y-4 md:flex-row md:space-y-0">
            <div className="text-sm text-gray-500">
              <p>DamianixPro - Enhanced Agent Dashboard</p>
              <p>Professional property management platform for Nigerian real estate agents</p>
            </div>
            <div className="flex items-center space-x-4 text-sm text-gray-500">
              <span>Last updated: {new Date().toLocaleString('en-NG')}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnhancedAgentDashboardPage;
