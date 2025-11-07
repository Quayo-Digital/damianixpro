import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, AlertCircle, BarChart3, Users, Home, User } from 'lucide-react';
import { useEnhancedAgentData } from '@/hooks/useEnhancedAgentData';
import AgentDashboardOverview from '@/components/agent/AgentDashboardOverview';
import AgentLeadManagement from '@/components/agent/AgentLeadManagement';
import AgentPerformanceAnalytics from '@/components/agent/AgentPerformanceAnalytics';

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
    addNewLead
  } = useEnhancedAgentData();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-96">
          <CardContent className="p-8 text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Loading Agent Dashboard</h3>
            <p className="text-gray-600">Fetching your business data and analytics...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <AlertCircle className="h-8 w-8 text-red-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Dashboard Error</h3>
            <p className="text-gray-600 mb-4">{error}</p>
            <button 
              onClick={() => window.location.reload()} 
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Agent Dashboard</h1>
              <p className="text-gray-600 mt-1">
                Welcome back, {agentProfile?.name || 'Agent'}! Here's your business overview.
              </p>
            </div>
            <div className="hidden md:flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm text-gray-500">Total Commission</p>
                <p className="text-xl font-bold text-green-600">
                  {stats ? new Intl.NumberFormat('en-NG', {
                    style: 'currency',
                    currency: 'NGN',
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 0,
                  }).format(stats.totalCommission) : '₦0'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Development Notice */}
        <Alert className="mb-6 border-blue-200 bg-blue-50">
          <AlertCircle className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-800">
            <strong>Enhanced Agent Dashboard</strong> - This is a comprehensive business management platform 
            with advanced analytics, lead tracking, and performance insights. Currently showing demo data 
            for development purposes.
          </AlertDescription>
        </Alert>

        {/* Main Dashboard Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 lg:w-auto lg:grid-cols-3">
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
            <AgentPerformanceAnalytics
              performanceMetrics={performanceMetrics}
            />
          </TabsContent>
        </Tabs>

        {/* Footer */}
        <div className="mt-12 pt-8 border-t border-gray-200">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <div className="text-sm text-gray-500">
              <p>Nigeria Homes - Enhanced Agent Dashboard</p>
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
