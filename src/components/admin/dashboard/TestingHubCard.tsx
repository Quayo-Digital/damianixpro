/**
 * Testing Hub Card Component
 * Centralized access to all testing pages in the application
 */

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  TestTube, 
  BarChart3, 
  Globe, 
  Shield, 
  Smartphone, 
  Zap, 
  CreditCard, 
  Users, 
  Building,
  ExternalLink,
  Activity
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface TestingPage {
  title: string;
  description: string;
  path: string;
  icon: React.ReactNode;
  category: 'Core' | 'Analytics' | 'Performance' | 'Security' | 'Features';
  status: 'Active' | 'New' | 'Updated';
}

const TestingHubCard: React.FC = () => {
  const navigate = useNavigate();

  const testingPages: TestingPage[] = [
    // Core Testing
    {
      title: 'Main Testing Suite',
      description: 'Comprehensive platform testing including AI, vendor workflows, and dashboards',
      path: '/testing',
      icon: <TestTube className="h-4 w-4" />,
      category: 'Core',
      status: 'Active'
    },
    {
      title: 'Minimal Testing',
      description: 'Lightweight testing interface for quick validations',
      path: '/testing-minimal',
      icon: <Activity className="h-4 w-4" />,
      category: 'Core',
      status: 'Active'
    },

    // Analytics Testing
    {
      title: 'Analytics System Test',
      description: 'Test real estate analytics engine and market intelligence features',
      path: '/analytics-testing',
      icon: <BarChart3 className="h-4 w-4" />,
      category: 'Analytics',
      status: 'Active'
    },
    {
      title: 'Live Data Demo',
      description: 'Real-time Nigerian property listings and market data showcase',
      path: '/live-data-demo',
      icon: <Globe className="h-4 w-4" />,
      category: 'Analytics',
      status: 'New'
    },
    {
      title: 'Production Testing',
      description: 'Production readiness validation and performance benchmarking',
      path: '/production-testing',
      icon: <Zap className="h-4 w-4" />,
      category: 'Analytics',
      status: 'New'
    },

    // Performance & Security
    {
      title: 'Security & Performance',
      description: 'Security audits, performance monitoring, and optimization testing',
      path: '/security-performance',
      icon: <Shield className="h-4 w-4" />,
      category: 'Security',
      status: 'Active'
    },
    {
      title: 'Platform Optimization',
      description: 'Comprehensive platform optimization and quality assurance',
      path: '/platform-optimization',
      icon: <Zap className="h-4 w-4" />,
      category: 'Performance',
      status: 'Active'
    },
    {
      title: 'Optimization QA',
      description: 'Advanced optimization testing and performance validation',
      path: '/comprehensive-optimization-qa',
      icon: <Activity className="h-4 w-4" />,
      category: 'Performance',
      status: 'Updated'
    },

    // Feature Testing
    {
      title: 'Payment Testing',
      description: 'Payment processing, Paystack integration, and transaction testing',
      path: '/payment-testing',
      icon: <CreditCard className="h-4 w-4" />,
      category: 'Features',
      status: 'Active'
    },
    {
      title: 'Mobile Demo',
      description: 'Mobile responsiveness and touch interaction testing',
      path: '/mobile-demo',
      icon: <Smartphone className="h-4 w-4" />,
      category: 'Performance',
      status: 'Active'
    },
    {
      title: 'Mobile Demo Simple',
      description: 'Simplified mobile interface testing',
      path: '/mobile-demo-simple',
      icon: <Smartphone className="h-4 w-4" />,
      category: 'Performance',
      status: 'Active'
    }
  ];

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'Core': return 'bg-blue-100 text-blue-800';
      case 'Analytics': return 'bg-green-100 text-green-800';
      case 'Performance': return 'bg-purple-100 text-purple-800';
      case 'Security': return 'bg-red-100 text-red-800';
      case 'Features': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'New': return 'bg-green-500';
      case 'Updated': return 'bg-blue-500';
      case 'Active': return 'bg-gray-400';
      default: return 'bg-gray-400';
    }
  };

  const groupedPages = testingPages.reduce((acc, page) => {
    if (!acc[page.category]) {
      acc[page.category] = [];
    }
    acc[page.category].push(page);
    return acc;
  }, {} as Record<string, TestingPage[]>);

  const handleNavigate = (path: string) => {
    navigate(path);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TestTube className="h-5 w-5" />
          Testing Hub
        </CardTitle>
        <CardDescription>
          Centralized access to all testing and QA pages across the platform
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {Object.entries(groupedPages).map(([category, pages]) => (
            <div key={category} className="space-y-3">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-sm">{category} Testing</h3>
                <Badge variant="outline" className={getCategoryColor(category)}>
                  {pages.length} {pages.length === 1 ? 'test' : 'tests'}
                </Badge>
              </div>
              
              <div className="grid gap-2">
                {pages.map((page, index) => (
                  <div 
                    key={index}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <div className="flex items-center gap-2">
                        {page.icon}
                        <div className="relative">
                          <span className="font-medium text-sm">{page.title}</span>
                          {page.status !== 'Active' && (
                            <div 
                              className={`absolute -top-1 -right-1 w-2 h-2 rounded-full ${getStatusColor(page.status)}`}
                              title={page.status}
                            />
                          )}
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-1 flex-1">
                        {page.description}
                      </p>
                    </div>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleNavigate(page.path)}
                      className="flex items-center gap-1 text-xs"
                    >
                      Open
                      <ExternalLink className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Quick Stats */}
        <div className="mt-6 pt-4 border-t">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-center">
            {Object.entries(groupedPages).map(([category, pages]) => (
              <div key={category} className="space-y-1">
                <div className="text-lg font-bold">{pages.length}</div>
                <div className="text-xs text-muted-foreground">{category}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-4 flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleNavigate('/testing')}
            className="flex items-center gap-1"
          >
            <TestTube className="h-3 w-3" />
            Main Tests
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleNavigate('/production-testing')}
            className="flex items-center gap-1"
          >
            <Zap className="h-3 w-3" />
            Production
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleNavigate('/live-data-demo')}
            className="flex items-center gap-1"
          >
            <Globe className="h-3 w-3" />
            Live Data
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default TestingHubCard;
