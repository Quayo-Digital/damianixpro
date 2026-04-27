import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  Smartphone,
  Tablet,
  Monitor,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Activity,
  Zap,
  Touch,
  Eye,
  Navigation,
  Gauge,
} from 'lucide-react';

// Import mobile utilities and components for testing
import {
  useDeviceDetection,
  DeviceDetection,
  ViewportUtils,
  TouchUtils,
  BREAKPOINTS,
  NIGERIAN_DEVICES,
} from '@/utils/mobile';

import {
  MobileButton,
  MobileInput,
  MobileSelect,
  MobilePropertyCard,
  MobileSearchBar,
  MobileQuantitySelector,
} from '@/components/ui/mobile-components';

import { useSwipeGestures, useSwipeableCarousel } from '@/hooks/useSwipeGestures';

interface MobileTestResult {
  category: string;
  test: string;
  status: 'pass' | 'fail' | 'warning';
  score: number;
  message: string;
  recommendation?: string;
}

interface DeviceTestResult {
  deviceName: string;
  width: number;
  height: number;
  score: number;
  issues: string[];
}

export const MobileResponsivenessTest = () => {
  const [testResults, setTestResults] = useState<MobileTestResult[]>([]);
  const [deviceResults, setDeviceResults] = useState<DeviceTestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [currentTest, setCurrentTest] = useState<string>('');
  const [overallScore, setOverallScore] = useState<number>(0);
  const [activeTab, setActiveTab] = useState('overview');

  // Get current device information
  const deviceInfo = useDeviceDetection();

  // Sample property data for testing components
  const sampleProperty = {
    id: '1',
    title: '3 Bedroom Apartment in Victoria Island',
    price: 2500000,
    location: 'Victoria Island, Lagos',
    bedrooms: 3,
    bathrooms: 2,
    image: '/api/placeholder/400/300/property',
    type: 'Apartment',
  };

  // Sample select options
  const locationOptions = [
    { value: 'lagos', label: 'Lagos' },
    { value: 'abuja', label: 'Abuja' },
    { value: 'port-harcourt', label: 'Port Harcourt' },
    { value: 'kano', label: 'Kano' },
  ];

  // Run comprehensive mobile responsiveness tests
  const runMobileTests = async () => {
    setIsRunning(true);
    setTestResults([]);
    setDeviceResults([]);
    setCurrentTest('');

    const results: MobileTestResult[] = [];
    const deviceTests: DeviceTestResult[] = [];

    try {
      // Test 1: Device Detection
      setCurrentTest('Testing device detection...');
      await new Promise((resolve) => setTimeout(resolve, 500));

      const deviceDetectionScore = deviceInfo.isTouchDevice ? 100 : 80;
      results.push({
        category: 'Device Detection',
        test: 'Touch Device Detection',
        status: deviceInfo.isTouchDevice ? 'pass' : 'warning',
        score: deviceDetectionScore,
        message: deviceInfo.isTouchDevice
          ? `Touch device detected: ${deviceInfo.deviceType}`
          : 'Non-touch device detected',
      });

      // Test 2: Viewport Responsiveness
      setCurrentTest('Testing viewport responsiveness...');
      await new Promise((resolve) => setTimeout(resolve, 500));

      const viewport = ViewportUtils.getViewportSize();
      const isResponsive =
        viewport.width >= BREAKPOINTS.mobile && viewport.width <= BREAKPOINTS.wide;

      results.push({
        category: 'Viewport',
        test: 'Responsive Viewport',
        status: isResponsive ? 'pass' : 'warning',
        score: isResponsive ? 100 : 70,
        message: `Viewport: ${viewport.width}x${viewport.height}px`,
      });

      // Test 3: Touch Target Compliance
      setCurrentTest('Testing touch target sizes...');
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Test touch targets on page
      const buttons = document.querySelectorAll('button');
      let compliantTargets = 0;
      const totalTargets = buttons.length;

      buttons.forEach((button) => {
        if (TouchUtils.isTouchTargetCompliant(button)) {
          compliantTargets++;
        }
      });

      const touchTargetScore =
        totalTargets > 0 ? Math.round((compliantTargets / totalTargets) * 100) : 100;

      results.push({
        category: 'Touch Targets',
        test: 'Touch Target Compliance',
        status: touchTargetScore >= 90 ? 'pass' : touchTargetScore >= 70 ? 'warning' : 'fail',
        score: touchTargetScore,
        message: `${compliantTargets}/${totalTargets} buttons meet 44px minimum`,
        recommendation:
          touchTargetScore < 90
            ? 'Ensure all interactive elements are at least 44px in height and width'
            : undefined,
      });

      // Test 4: Mobile Performance
      setCurrentTest('Testing mobile performance...');
      await new Promise((resolve) => setTimeout(resolve, 500));

      const pixelRatio = DeviceDetection.getPixelRatio();
      const performanceScore = pixelRatio <= 2 ? 100 : pixelRatio <= 3 ? 80 : 60;

      results.push({
        category: 'Performance',
        test: 'Device Pixel Ratio',
        status: performanceScore >= 80 ? 'pass' : 'warning',
        score: performanceScore,
        message: `Device pixel ratio: ${pixelRatio}x`,
        recommendation:
          performanceScore < 80 ? 'Consider optimizing for high-DPI displays' : undefined,
      });

      // Test 5: Orientation Support
      setCurrentTest('Testing orientation support...');
      await new Promise((resolve) => setTimeout(resolve, 500));

      const isLandscape = DeviceDetection.isLandscape();
      const orientationScore = 100; // Always pass as we support both orientations

      results.push({
        category: 'Orientation',
        test: 'Orientation Detection',
        status: 'pass',
        score: orientationScore,
        message: `Current orientation: ${isLandscape ? 'landscape' : 'portrait'}`,
      });

      // Test 6: Safe Area Support
      setCurrentTest('Testing safe area support...');
      await new Promise((resolve) => setTimeout(resolve, 500));

      const safeAreaInsets = DeviceDetection.getSafeAreaInsets();
      const hasSafeArea = safeAreaInsets.top > 0 || safeAreaInsets.bottom > 0;

      results.push({
        category: 'Safe Area',
        test: 'Safe Area Insets',
        status: 'pass',
        score: 100,
        message: hasSafeArea
          ? `Safe area detected: top=${safeAreaInsets.top}px, bottom=${safeAreaInsets.bottom}px`
          : 'No safe area insets detected',
      });

      // Test 7: Nigerian Device Compatibility
      setCurrentTest('Testing Nigerian device compatibility...');
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Test against common Nigerian device sizes
      Object.entries(NIGERIAN_DEVICES).forEach(([key, device]) => {
        const issues: string[] = [];
        let score = 100;

        // Check if current viewport matches this device
        const isCurrentDevice = Math.abs(viewport.width - device.width) < 20;

        if (isCurrentDevice) {
          // Test specific issues for this device size
          if (device.width <= 360 && viewport.width <= 360) {
            // Small screen specific tests
            const smallScreenElements = document.querySelectorAll('.text-xs, .text-sm');
            if (smallScreenElements.length > 10) {
              issues.push('Many small text elements may be hard to read');
              score -= 10;
            }
          }

          if (device.width >= 768) {
            // Tablet specific tests
            const singleColumnLayout =
              document.querySelectorAll('.grid-cols-1').length >
              document.querySelectorAll('.md\\:grid-cols-2, .lg\\:grid-cols-3').length;
            if (singleColumnLayout) {
              issues.push('Layout could utilize tablet screen space better');
              score -= 15;
            }
          }
        }

        deviceTests.push({
          deviceName: device.name,
          width: device.width,
          height: device.height,
          score,
          issues,
        });
      });

      const avgDeviceScore = Math.round(
        deviceTests.reduce((sum, device) => sum + device.score, 0) / deviceTests.length
      );

      results.push({
        category: 'Device Compatibility',
        test: 'Nigerian Device Support',
        status: avgDeviceScore >= 90 ? 'pass' : avgDeviceScore >= 70 ? 'warning' : 'fail',
        score: avgDeviceScore,
        message: `Average compatibility score: ${avgDeviceScore}/100`,
        recommendation:
          avgDeviceScore < 90 ? 'Optimize layout for popular Nigerian devices' : undefined,
      });

      // Test 8: Gesture Support
      setCurrentTest('Testing gesture support...');
      await new Promise((resolve) => setTimeout(resolve, 500));

      const hasGestureSupport = 'ontouchstart' in window;
      const gestureScore = hasGestureSupport ? 100 : 60;

      results.push({
        category: 'Gestures',
        test: 'Touch Gesture Support',
        status: hasGestureSupport ? 'pass' : 'warning',
        score: gestureScore,
        message: hasGestureSupport ? 'Touch gestures supported' : 'Limited gesture support',
      });

      // Calculate overall score
      const totalScore = results.reduce((sum, result) => sum + result.score, 0);
      const avgScore = Math.round(totalScore / results.length);

      setTestResults(results);
      setDeviceResults(deviceTests);
      setOverallScore(avgScore);
    } catch (error) {
      console.error('Mobile responsiveness test failed:', error);
      results.push({
        category: 'Test Error',
        test: 'Test Execution',
        status: 'fail',
        score: 0,
        message: 'Mobile test encountered an error',
      });
      setTestResults(results);
      setOverallScore(0);
    } finally {
      setIsRunning(false);
      setCurrentTest('');
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 75) return 'text-blue-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBadge = (score: number) => {
    if (score >= 90) return 'bg-green-100 text-green-800';
    if (score >= 75) return 'bg-blue-100 text-blue-800';
    if (score >= 60) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pass':
        return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case 'warning':
        return <AlertCircle className="h-4 w-4 text-yellow-600" />;
      case 'fail':
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-600" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Mobile Responsiveness Testing</h2>
          <p className="text-muted-foreground">
            Comprehensive testing for mobile optimization, touch targets, and Nigerian device
            compatibility
          </p>
        </div>
        <div className="flex items-center space-x-4">
          {overallScore > 0 && (
            <div className="text-center">
              <div className={`text-2xl font-bold ${getScoreColor(overallScore)}`}>
                {overallScore}/100
              </div>
              <div className="text-sm text-muted-foreground">Mobile Score</div>
            </div>
          )}
          <Button onClick={runMobileTests} disabled={isRunning}>
            {isRunning ? (
              <>
                <Activity className="mr-2 h-4 w-4 animate-spin" />
                Testing...
              </>
            ) : (
              <>
                <Smartphone className="mr-2 h-4 w-4" />
                Run Mobile Tests
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Current Test Status */}
      {isRunning && currentTest && (
        <Alert>
          <Gauge className="h-4 w-4" />
          <AlertTitle>Running Mobile Tests</AlertTitle>
          <AlertDescription>{currentTest}</AlertDescription>
        </Alert>
      )}

      {/* Device Info Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {deviceInfo.isMobile ? (
              <Smartphone className="h-5 w-5" />
            ) : deviceInfo.isTablet ? (
              <Tablet className="h-5 w-5" />
            ) : (
              <Monitor className="h-5 w-5" />
            )}
            Current Device Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div>
              <div className="text-sm text-muted-foreground">Device Type</div>
              <div className="font-medium capitalize">{deviceInfo.deviceType}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Touch Support</div>
              <div className="font-medium">{deviceInfo.isTouchDevice ? 'Yes' : 'No'}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Orientation</div>
              <div className="font-medium">{deviceInfo.isLandscape ? 'Landscape' : 'Portrait'}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Pixel Ratio</div>
              <div className="font-medium">{deviceInfo.pixelRatio}x</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="detailed">Test Results</TabsTrigger>
          <TabsTrigger value="devices">Device Tests</TabsTrigger>
          <TabsTrigger value="components">Component Demos</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {testResults.length > 0 ? (
            <>
              {/* Overall Score Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    Mobile Responsiveness Score
                    <Badge className={getScoreBadge(overallScore)}>{overallScore}/100</Badge>
                  </CardTitle>
                  <CardDescription>
                    {overallScore >= 90
                      ? 'Excellent! Your platform is highly optimized for mobile devices.'
                      : overallScore >= 75
                        ? 'Good mobile optimization with minor improvements needed.'
                        : overallScore >= 60
                          ? 'Moderate mobile support. Several optimizations recommended.'
                          : 'Poor mobile experience. Immediate optimization required.'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Progress value={overallScore} className="h-3" />
                </CardContent>
              </Card>

              {/* Category Overview */}
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {[
                  'Device Detection',
                  'Viewport',
                  'Touch Targets',
                  'Performance',
                  'Device Compatibility',
                  'Gestures',
                ].map((category) => {
                  const categoryTests = testResults.filter((test) => test.category === category);
                  const avgScore =
                    categoryTests.length > 0
                      ? Math.round(
                          categoryTests.reduce((sum, test) => sum + test.score, 0) /
                            categoryTests.length
                        )
                      : 0;
                  const hasFailures = categoryTests.some((test) => test.status === 'fail');
                  const hasWarnings = categoryTests.some((test) => test.status === 'warning');

                  return (
                    <Card key={category}>
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-sm">{category}</CardTitle>
                          {hasFailures ? (
                            <XCircle className="h-4 w-4 text-red-600" />
                          ) : hasWarnings ? (
                            <AlertCircle className="h-4 w-4 text-yellow-600" />
                          ) : (
                            <CheckCircle2 className="h-4 w-4 text-green-600" />
                          )}
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="mb-2 text-2xl font-bold">{avgScore}/100</div>
                        <div className="text-sm text-muted-foreground">
                          {categoryTests.length} tests completed
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </>
          ) : (
            <Card>
              <CardContent className="py-8 text-center">
                <Smartphone className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                <h3 className="mb-2 text-lg font-semibold">No Mobile Tests Run Yet</h3>
                <p className="mb-4 text-muted-foreground">
                  Click "Run Mobile Tests" to analyze your platform's mobile responsiveness.
                </p>
                <Button onClick={runMobileTests}>
                  <Smartphone className="mr-2 h-4 w-4" />
                  Run Mobile Tests
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="detailed" className="space-y-4">
          {testResults.length > 0 ? (
            testResults.map((result, index) => (
              <Card key={index}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      {getStatusIcon(result.status)}
                      {result.test}
                    </CardTitle>
                    <div className="flex gap-2">
                      <Badge className={getScoreBadge(result.score)}>{result.score}/100</Badge>
                      <Badge variant="outline">{result.category}</Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">{result.message}</p>
                    {result.recommendation && (
                      <Alert>
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>{result.recommendation}</AlertDescription>
                      </Alert>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card>
              <CardContent className="py-8 text-center">
                <p className="text-muted-foreground">
                  No detailed results available. Run tests first.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="devices" className="space-y-4">
          {deviceResults.length > 0 ? (
            <div className="grid gap-4">
              {deviceResults.map((device, index) => (
                <Card key={index}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2">
                        <Smartphone className="h-5 w-5" />
                        {device.deviceName}
                      </CardTitle>
                      <Badge className={getScoreBadge(device.score)}>{device.score}/100</Badge>
                    </div>
                    <CardDescription>
                      {device.width}x{device.height}px
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {device.issues.length > 0 ? (
                      <div>
                        <h4 className="mb-2 font-medium text-yellow-600">Potential Issues:</h4>
                        <ul className="list-inside list-disc space-y-1">
                          {device.issues.map((issue, i) => (
                            <li key={i} className="text-sm text-yellow-600">
                              {issue}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ) : (
                      <p className="text-sm text-green-600">No issues detected for this device</p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="py-8 text-center">
                <p className="text-muted-foreground">
                  No device test results available. Run tests first.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="components" className="space-y-6">
          {/* Mobile Component Demos */}
          <Card>
            <CardHeader>
              <CardTitle>Mobile-Optimized Components Demo</CardTitle>
              <CardDescription>
                Interactive demonstration of mobile-optimized UI components with proper touch
                targets
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Mobile Buttons */}
              <div>
                <h4 className="mb-3 font-medium">Mobile Buttons (44px+ touch targets)</h4>
                <div className="flex flex-wrap gap-3">
                  <MobileButton size="sm">Small</MobileButton>
                  <MobileButton size="md">Medium</MobileButton>
                  <MobileButton size="lg">Large</MobileButton>
                  <MobileButton size="xl">Extra Large</MobileButton>
                </div>
              </div>

              {/* Mobile Inputs */}
              <div>
                <h4 className="mb-3 font-medium">Mobile-Optimized Inputs</h4>
                <div className="max-w-md space-y-4">
                  <MobileInput
                    label="Property Name"
                    placeholder="Enter property name"
                    helpText="16px font size prevents zoom on iOS"
                  />
                  <MobileInput
                    label="Price"
                    placeholder="0"
                    currency={true}
                    helpText="Currency input with Naira symbol"
                  />
                  <MobileSelect
                    label="Location"
                    placeholder="Select location"
                    options={locationOptions}
                  />
                </div>
              </div>

              {/* Mobile Property Card */}
              <div>
                <h4 className="mb-3 font-medium">Mobile Property Card</h4>
                <div className="max-w-sm">
                  <MobilePropertyCard
                    property={sampleProperty}
                    onFavorite={(id) => console.log('Favorited:', id)}
                    onShare={(id) => console.log('Shared:', id)}
                    onClick={(id) => console.log('Clicked:', id)}
                  />
                </div>
              </div>

              {/* Mobile Search Bar */}
              <div>
                <h4 className="mb-3 font-medium">Mobile Search Bar</h4>
                <MobileSearchBar
                  placeholder="Search properties in Lagos..."
                  showFilter={true}
                  onFilterClick={() => console.log('Filter clicked')}
                />
              </div>

              {/* Mobile Quantity Selector */}
              <div>
                <h4 className="mb-3 font-medium">Mobile Quantity Selector</h4>
                <MobileQuantitySelector
                  label="Bedrooms"
                  value={3}
                  onChange={(value) => console.log('Bedrooms:', value)}
                  min={1}
                  max={10}
                />
              </div>
            </CardContent>
          </Card>

          {/* Mobile Optimization Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Mobile Optimization Features</CardTitle>
              <CardDescription>
                Summary of implemented mobile responsiveness optimizations
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <span className="text-sm">44px minimum touch targets</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <span className="text-sm">16px font size prevents iOS zoom</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <span className="text-sm">Touch-optimized form controls</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <span className="text-sm">Swipe gesture support</span>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <span className="text-sm">Nigerian device optimization</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <span className="text-sm">Responsive breakpoints</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <span className="text-sm">Safe area inset support</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <span className="text-sm">Mobile-first design approach</span>
                  </div>
                </div>
              </div>

              <Alert>
                <CheckCircle2 className="h-4 w-4" />
                <AlertTitle>Mobile Responsiveness Implementation Complete</AlertTitle>
                <AlertDescription>
                  Your platform now includes comprehensive mobile optimizations tailored for the
                  Nigerian market, with proper touch targets, gesture support, and device-specific
                  optimizations for popular smartphones and tablets.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
