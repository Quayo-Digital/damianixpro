import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Globe,
  Play,
  CheckCircle2,
  AlertTriangle,
  Clock,
  MapPin,
  TrendingUp,
  Eye,
  Activity,
  Server,
  Settings,
  Target,
} from 'lucide-react';
import { useCDNDeployment, CDNProvider, CDNConfiguration } from '@/utils/cdn-deployment-automation';

export const CDNDeploymentDashboard = () => {
  const {
    isDeploying,
    deploymentSteps,
    deploymentResult,
    error,
    deployCD,
    generateConfiguration,
    testPerformance,
    providers,
  } = useCDNDeployment();

  const [activeTab, setActiveTab] = useState('overview');
  const [selectedProvider, setSelectedProvider] = useState<CDNProvider | null>(null);
  const [deploymentConfig, setDeploymentConfig] = useState<CDNConfiguration | null>(null);
  const [requirements, setRequirements] = useState({
    budget: 'medium' as 'low' | 'medium' | 'high',
    performance: 'standard' as 'basic' | 'standard' | 'premium',
    security: 'standard' as 'basic' | 'standard' | 'enterprise',
    nigerianFocus: true,
  });
  const [performanceResults, setPerformanceResults] = useState<any>(null);

  // Auto-generate optimal configuration
  useEffect(() => {
    const generateConfig = async () => {
      const config = await generateConfiguration(requirements);
      if (config) {
        setSelectedProvider(config.recommendedProvider);
        setDeploymentConfig(config.configuration);
      }
    };
    generateConfig();
  }, [requirements]);

  const handleDeploy = async () => {
    if (!deploymentConfig) return;
    await deployCD(deploymentConfig);
  };

  const handleTestPerformance = async () => {
    if (!deploymentResult?.cdnUrl) return;
    const results = await testPerformance(deploymentResult.cdnUrl);
    setPerformanceResults(results);
  };

  const getStepIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case 'running':
        return <Activity className="h-4 w-4 animate-spin text-blue-600" />;
      case 'failed':
        return <AlertTriangle className="h-4 w-4 text-red-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5 text-blue-600" />
                CDN Deployment Dashboard
              </CardTitle>
              <CardDescription>
                Deploy and manage CDN infrastructure optimized for Nigerian users
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              {deploymentResult && (
                <Badge variant="default" className="flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" />
                  CDN Active
                </Badge>
              )}
              {isDeploying && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  <Activity className="h-3 w-3 animate-spin" />
                  Deploying...
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Alerts */}
      {error && (
        <Alert className="border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertTitle className="text-red-800">Deployment Error</AlertTitle>
          <AlertDescription className="text-red-700">{error}</AlertDescription>
        </Alert>
      )}

      {deploymentResult?.success && (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertTitle className="text-green-800">CDN Deployed Successfully!</AlertTitle>
          <AlertDescription className="text-green-700">
            CDN active at {deploymentResult.cdnUrl} with {deploymentResult.performanceImprovement}%
            improvement
          </AlertDescription>
        </Alert>
      )}

      {/* Quick Stats */}
      {deploymentResult && (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium">Performance</span>
              </div>
              <div className="mt-1 text-2xl font-bold text-green-600">
                +{deploymentResult.performanceImprovement}%
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium">Edge Locations</span>
              </div>
              <div className="mt-1 text-2xl font-bold">{deploymentResult.edgeLocations.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Target className="h-4 w-4 text-purple-600" />
                <span className="text-sm font-medium">Lagos Latency</span>
              </div>
              <div className="mt-1 text-2xl font-bold text-green-600">
                {deploymentResult.nigerianTestResults.lagos.latency}ms
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-orange-600" />
                <span className="text-sm font-medium">Throughput</span>
              </div>
              <div className="mt-1 text-lg font-bold">
                {deploymentResult.nigerianTestResults.lagos.throughput}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="deploy">Deploy</TabsTrigger>
          <TabsTrigger value="test">Test</TabsTrigger>
          <TabsTrigger value="monitor">Monitor</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Current Status */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Server className="h-5 w-5" />
                  CDN Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                {deploymentResult ? (
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span>Status</span>
                      <Badge variant="default">Active</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>Provider</span>
                      <span className="font-medium">{selectedProvider?.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Performance</span>
                      <span className="font-bold text-green-600">
                        +{deploymentResult.performanceImprovement}%
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="py-8 text-center text-gray-500">
                    <Globe className="mx-auto mb-4 h-12 w-12" />
                    <p>No CDN deployed yet</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  onClick={handleDeploy}
                  className="w-full"
                  disabled={!deploymentConfig || isDeploying}
                >
                  <Play className="mr-2 h-4 w-4" />
                  {isDeploying ? 'Deploying...' : 'Deploy CDN'}
                </Button>
                <Button
                  onClick={handleTestPerformance}
                  variant="outline"
                  className="w-full"
                  disabled={!deploymentResult}
                >
                  <Eye className="mr-2 h-4 w-4" />
                  Test Performance
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Provider Selection */}
          <Card>
            <CardHeader>
              <CardTitle>Recommended CDN Provider</CardTitle>
            </CardHeader>
            <CardContent>
              {selectedProvider ? (
                <div className="flex items-center justify-between rounded-lg border p-4">
                  <div>
                    <h3 className="font-medium">{selectedProvider.name}</h3>
                    <p className="text-sm text-gray-600">{selectedProvider.description}</p>
                    <div className="mt-2 flex gap-2">
                      {selectedProvider.nigerianEdgeLocations.map((location) => (
                        <Badge key={location} variant="outline" className="text-xs">
                          {location}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <Badge variant="default">⭐ Recommended</Badge>
                </div>
              ) : (
                <p className="text-gray-500">Generating recommendation...</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="deploy" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Play className="h-5 w-5" />
                Deployment Progress
              </CardTitle>
            </CardHeader>
            <CardContent>
              {deploymentSteps.length > 0 ? (
                <div className="space-y-4">
                  {deploymentSteps.map((step) => (
                    <div key={step.id} className="flex items-center gap-4 rounded-lg border p-3">
                      {getStepIcon(step.status)}
                      <div className="flex-1">
                        <div className="flex justify-between">
                          <h4 className="font-medium">{step.title}</h4>
                          {step.nigerianSpecific && (
                            <Badge variant="outline" className="text-xs">
                              🇳🇬
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-gray-600">{step.description}</p>
                        {step.status === 'running' && (
                          <Progress value={step.progress} className="mt-2 w-full" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-12 text-center">
                  <Play className="mx-auto mb-4 h-16 w-16 text-gray-400" />
                  <h3 className="mb-2 text-lg font-medium">Ready to Deploy</h3>
                  <p className="mb-4 text-gray-600">Deploy your CDN with Nigerian optimizations</p>
                  <Button onClick={handleDeploy} disabled={!deploymentConfig || isDeploying}>
                    Start Deployment
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="test" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Eye className="h-5 w-5" />
                    Performance Testing
                  </CardTitle>
                  <CardDescription>Test CDN performance across Nigerian cities</CardDescription>
                </div>
                <Button onClick={handleTestPerformance} disabled={!deploymentResult}>
                  Run Tests
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {performanceResults ? (
                <div className="space-y-6">
                  <div className="text-center">
                    <div className="mb-2 text-3xl font-bold text-green-600">
                      {performanceResults.overallScore}/100
                    </div>
                    <div className="text-gray-600">Overall Performance Score</div>
                  </div>

                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {Object.entries(performanceResults.cityResults).map(
                      ([city, result]: [string, any]) => (
                        <Card key={city}>
                          <CardContent className="p-4">
                            <div className="mb-2 flex justify-between">
                              <h4 className="font-medium capitalize">{city}</h4>
                              <Badge variant={result.score >= 80 ? 'default' : 'secondary'}>
                                {result.score}/100
                              </Badge>
                            </div>
                            <div className="space-y-1 text-sm">
                              <div className="flex justify-between">
                                <span>Latency:</span>
                                <span className="font-medium">{result.latency}ms</span>
                              </div>
                              <div className="flex justify-between">
                                <span>Speed:</span>
                                <span className="font-medium">{result.throughput}</span>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      )
                    )}
                  </div>
                </div>
              ) : (
                <div className="py-12 text-center">
                  <Eye className="mx-auto mb-4 h-16 w-16 text-gray-400" />
                  <h3 className="mb-2 text-lg font-medium">Performance Testing</h3>
                  <p className="text-gray-600">Deploy your CDN first to run performance tests</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="monitor" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Nigerian Cities Performance
              </CardTitle>
            </CardHeader>
            <CardContent>
              {deploymentResult ? (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {Object.entries(deploymentResult.nigerianTestResults).map(
                    ([city, result]: [string, any]) => (
                      <Card key={city}>
                        <CardContent className="p-4">
                          <div className="mb-2 flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-blue-600" />
                            <h5 className="font-medium capitalize">{city}</h5>
                          </div>
                          <div className="space-y-1 text-sm">
                            <div className="flex justify-between">
                              <span>Latency:</span>
                              <span className="font-medium">{result.latency}ms</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Speed:</span>
                              <span className="font-medium">{result.throughput}</span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )
                  )}
                </div>
              ) : (
                <div className="py-12 text-center">
                  <Activity className="mx-auto mb-4 h-16 w-16 text-gray-400" />
                  <h3 className="mb-2 text-lg font-medium">No Monitoring Data</h3>
                  <p className="text-gray-600">Deploy your CDN to start monitoring</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
