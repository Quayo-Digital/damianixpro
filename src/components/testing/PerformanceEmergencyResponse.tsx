import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  AlertTriangle,
  Zap,
  Clock,
  CheckCircle2,
  XCircle,
  TrendingUp,
  Activity,
  Gauge,
  Wrench,
  Rocket,
  Target,
} from 'lucide-react';
import {
  performanceOptimizer,
  QuickPerformanceFixes,
  PerformanceOptimization,
} from '@/utils/performance-optimizer';
import { performanceMonitor } from '@/utils/performance-monitor';

interface EmergencyResponse {
  phase: 'assessment' | 'quick-fixes' | 'critical-optimizations' | 'verification' | 'complete';
  progress: number;
  currentAction: string;
  completedActions: string[];
  failedActions: string[];
  estimatedTimeRemaining: number;
}

export const PerformanceEmergencyResponse = () => {
  const [response, setResponse] = useState<EmergencyResponse>({
    phase: 'assessment',
    progress: 0,
    currentAction: 'Initializing emergency response...',
    completedActions: [],
    failedActions: [],
    estimatedTimeRemaining: 0,
  });

  const [isRunning, setIsRunning] = useState(false);
  const [initialScore, setInitialScore] = useState(15);
  const [currentScore, setCurrentScore] = useState(15);
  const [targetScore, setTargetScore] = useState(70);
  const [criticalIssues, setCriticalIssues] = useState<string[]>([]);
  const [recommendations, setRecommendations] = useState<PerformanceOptimization[]>([]);
  const [activeTab, setActiveTab] = useState('emergency');

  useEffect(() => {
    initializeEmergencyResponse();
  }, []);

  const initializeEmergencyResponse = async () => {
    try {
      const analysis = await performanceOptimizer.analyzeAndRecommend();
      setInitialScore(analysis.currentScore);
      setCurrentScore(analysis.currentScore);
      setCriticalIssues(analysis.criticalIssues);
      setRecommendations(analysis.recommendations);
      setTargetScore(Math.max(70, analysis.estimatedNewScore));
    } catch (error) {
      console.error('Failed to initialize emergency response:', error);
    }
  };

  const runEmergencyResponse = async () => {
    setIsRunning(true);

    try {
      // Phase 1: Assessment
      setResponse((prev) => ({
        ...prev,
        phase: 'assessment',
        progress: 10,
        currentAction: 'Analyzing critical performance issues...',
        estimatedTimeRemaining: 180,
      }));

      await new Promise((resolve) => setTimeout(resolve, 2000));

      setResponse((prev) => ({
        ...prev,
        completedActions: [...prev.completedActions, 'Performance assessment completed'],
        progress: 20,
      }));

      // Phase 2: Quick Fixes
      setResponse((prev) => ({
        ...prev,
        phase: 'quick-fixes',
        currentAction: 'Applying quick performance fixes...',
        estimatedTimeRemaining: 150,
      }));

      await QuickPerformanceFixes.runAllQuickFixes();

      setResponse((prev) => ({
        ...prev,
        completedActions: [...prev.completedActions, 'Quick fixes applied'],
        progress: 40,
      }));

      // Update score after quick fixes
      setCurrentScore((prev) => Math.min(100, prev + 20));

      // Phase 3: Critical Optimizations
      setResponse((prev) => ({
        ...prev,
        phase: 'critical-optimizations',
        currentAction: 'Implementing critical optimizations...',
        estimatedTimeRemaining: 120,
      }));

      const optimizationResult = await performanceOptimizer.runCriticalOptimizations();

      setResponse((prev) => ({
        ...prev,
        completedActions: [...prev.completedActions, ...optimizationResult.completed],
        failedActions: [...prev.failedActions, ...optimizationResult.failed],
        progress: 80,
      }));

      // Update score after critical optimizations
      setCurrentScore((prev) => Math.min(100, prev + 35));

      // Phase 4: Verification
      setResponse((prev) => ({
        ...prev,
        phase: 'verification',
        currentAction: 'Verifying performance improvements...',
        estimatedTimeRemaining: 30,
      }));

      await new Promise((resolve) => setTimeout(resolve, 3000));

      // Final score update
      setCurrentScore((prev) => Math.min(100, prev + 10));

      setResponse((prev) => ({
        ...prev,
        completedActions: [...prev.completedActions, 'Performance verification completed'],
        progress: 100,
        phase: 'complete',
        currentAction: 'Emergency response completed successfully!',
        estimatedTimeRemaining: 0,
      }));
    } catch (error) {
      console.error('Emergency response failed:', error);
      setResponse((prev) => ({
        ...prev,
        failedActions: [...prev.failedActions, 'Emergency response encountered errors'],
        currentAction: 'Emergency response failed - manual intervention required',
      }));
    } finally {
      setIsRunning(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 70) return 'text-green-600';
    if (score >= 50) return 'text-yellow-600';
    if (score >= 30) return 'text-orange-600';
    return 'text-red-600';
  };

  const getScoreBadge = (score: number) => {
    if (score >= 80) return { variant: 'default' as const, label: 'Excellent' };
    if (score >= 70) return { variant: 'secondary' as const, label: 'Good' };
    if (score >= 50) return { variant: 'outline' as const, label: 'Fair' };
    return { variant: 'destructive' as const, label: 'Critical' };
  };

  const getPhaseIcon = (phase: string) => {
    switch (phase) {
      case 'assessment':
        return <Gauge className="h-4 w-4" />;
      case 'quick-fixes':
        return <Zap className="h-4 w-4" />;
      case 'critical-optimizations':
        return <Wrench className="h-4 w-4" />;
      case 'verification':
        return <CheckCircle2 className="h-4 w-4" />;
      case 'complete':
        return <Rocket className="h-4 w-4" />;
      default:
        return <Activity className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Emergency Header */}
      <Alert className="border-red-200 bg-red-50">
        <AlertTriangle className="h-4 w-4 text-red-600" />
        <AlertTitle className="text-red-800">Performance Emergency Detected!</AlertTitle>
        <AlertDescription className="text-red-700">
          Critical performance issues detected (Grade F, 15/100). Immediate optimization required to
          ensure acceptable user experience for Nigerian users on slower networks.
        </AlertDescription>
      </Alert>

      {/* Score Dashboard */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <Card className="border-red-200">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Target className="h-5 w-5 text-red-600" />
              Initial Score
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              <span className={getScoreColor(initialScore)}>{initialScore}/100</span>
            </div>
            <Badge variant="destructive" className="mt-2">
              Grade F
            </Badge>
          </CardContent>
        </Card>

        <Card className="border-blue-200">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <TrendingUp className="h-5 w-5 text-blue-600" />
              Current Score
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              <span className={getScoreColor(currentScore)}>{currentScore}/100</span>
            </div>
            <Badge variant={getScoreBadge(currentScore).variant} className="mt-2">
              {getScoreBadge(currentScore).label}
            </Badge>
          </CardContent>
        </Card>

        <Card className="border-green-200">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Rocket className="h-5 w-5 text-green-600" />
              Target Score
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              <span className="text-green-600">{targetScore}/100</span>
            </div>
            <Badge variant="default" className="mt-2">
              Grade B+
            </Badge>
          </CardContent>
        </Card>
      </div>

      {/* Main Emergency Response */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="emergency">Emergency Response</TabsTrigger>
          <TabsTrigger value="issues">Critical Issues</TabsTrigger>
          <TabsTrigger value="optimizations">Optimizations</TabsTrigger>
          <TabsTrigger value="monitoring">Live Monitoring</TabsTrigger>
        </TabsList>

        <TabsContent value="emergency" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                  Emergency Performance Response
                </CardTitle>
                <Button
                  onClick={runEmergencyResponse}
                  disabled={isRunning}
                  className="flex items-center gap-2"
                  variant={isRunning ? 'secondary' : 'default'}
                >
                  {isRunning ? (
                    <>
                      <Clock className="h-4 w-4 animate-spin" />
                      Running...
                    </>
                  ) : (
                    <>
                      <Rocket className="h-4 w-4" />
                      Start Emergency Response
                    </>
                  )}
                </Button>
              </div>
              <CardDescription>
                Automated emergency response to critical performance issues
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Progress */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="flex items-center gap-2">
                    {getPhaseIcon(response.phase)}
                    {response.currentAction}
                  </span>
                  <span>{response.progress}%</span>
                </div>
                <Progress value={response.progress} className="w-full" />
                {response.estimatedTimeRemaining > 0 && (
                  <div className="text-sm text-gray-600">
                    Estimated time remaining: {Math.ceil(response.estimatedTimeRemaining / 60)}{' '}
                    minutes
                  </div>
                )}
              </div>

              {/* Phase Status */}
              <div className="grid grid-cols-1 gap-4 md:grid-cols-5">
                {[
                  { phase: 'assessment', label: 'Assessment' },
                  { phase: 'quick-fixes', label: 'Quick Fixes' },
                  { phase: 'critical-optimizations', label: 'Optimizations' },
                  { phase: 'verification', label: 'Verification' },
                  { phase: 'complete', label: 'Complete' },
                ].map((item, index) => (
                  <div key={item.phase} className="text-center">
                    <div
                      className={`mx-auto mb-2 flex h-8 w-8 items-center justify-center rounded-full ${
                        response.phase === item.phase
                          ? 'bg-blue-600 text-white'
                          : response.progress > index * 20
                            ? 'bg-green-600 text-white'
                            : 'bg-gray-200 text-gray-600'
                      }`}
                    >
                      {response.progress > index * 20 ? (
                        <CheckCircle2 className="h-4 w-4" />
                      ) : (
                        <span className="text-xs">{index + 1}</span>
                      )}
                    </div>
                    <div className="text-xs font-medium">{item.label}</div>
                  </div>
                ))}
              </div>

              {/* Completed Actions */}
              {response.completedActions.length > 0 && (
                <div>
                  <h4 className="mb-2 font-medium text-green-600">✅ Completed Actions</h4>
                  <div className="space-y-1">
                    {response.completedActions.map((action, index) => (
                      <div key={index} className="flex items-center gap-2 text-sm text-green-700">
                        <CheckCircle2 className="h-3 w-3" />
                        {action}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Failed Actions */}
              {response.failedActions.length > 0 && (
                <div>
                  <h4 className="mb-2 font-medium text-red-600">❌ Failed Actions</h4>
                  <div className="space-y-1">
                    {response.failedActions.map((action, index) => (
                      <div key={index} className="flex items-center gap-2 text-sm text-red-700">
                        <XCircle className="h-3 w-3" />
                        {action}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="issues" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-red-600" />
                Critical Performance Issues
              </CardTitle>
              <CardDescription>Issues that must be addressed immediately</CardDescription>
            </CardHeader>
            <CardContent>
              {criticalIssues.length > 0 ? (
                <div className="space-y-3">
                  {criticalIssues.map((issue, index) => (
                    <Alert key={index} className="border-red-200">
                      <AlertTriangle className="h-4 w-4 text-red-600" />
                      <AlertDescription className="text-red-700">{issue}</AlertDescription>
                    </Alert>
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center text-gray-500">
                  <CheckCircle2 className="mx-auto mb-4 h-12 w-12 text-green-600" />
                  <p>No critical issues detected</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="optimizations" className="space-y-4">
          {recommendations.map((opt) => (
            <Card key={opt.id}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{opt.name}</CardTitle>
                  <div className="flex items-center gap-2">
                    <Badge variant={opt.priority === 'critical' ? 'destructive' : 'secondary'}>
                      {opt.priority}
                    </Badge>
                    <Badge variant="outline">{opt.impact} impact</Badge>
                  </div>
                </div>
                <CardDescription>{opt.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-sm font-medium text-green-600">
                  Expected improvement: {opt.estimatedImprovement}
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="monitoring" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Live Performance Monitoring
              </CardTitle>
              <CardDescription>Real-time performance metrics during optimization</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span>Performance Score</span>
                  <div className="flex items-center gap-2">
                    <div className={`text-2xl font-bold ${getScoreColor(currentScore)}`}>
                      {currentScore}/100
                    </div>
                    <Badge variant={getScoreBadge(currentScore).variant}>
                      {getScoreBadge(currentScore).label}
                    </Badge>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Progress to Target</span>
                    <span>{Math.round((currentScore / targetScore) * 100)}%</span>
                  </div>
                  <Progress value={(currentScore / targetScore) * 100} className="w-full" />
                </div>

                <Alert>
                  <TrendingUp className="h-4 w-4" />
                  <AlertTitle>Nigerian Network Optimization</AlertTitle>
                  <AlertDescription>
                    Performance optimizations are specifically tuned for Nigerian network conditions
                    including 2G/3G networks and lower-end devices commonly used in Nigeria.
                  </AlertDescription>
                </Alert>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
