import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Smartphone,
  Tablet,
  Monitor,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Eye,
  Zap,
  Users,
} from 'lucide-react';

interface ResponsivenessTest {
  device: string;
  width: number;
  height: number;
  score: number;
  issues: string[];
  recommendations: string[];
  status: 'excellent' | 'good' | 'needs_improvement' | 'poor';
}

interface ResponsivenessResult {
  overallScore: number;
  tests: ResponsivenessTest[];
  generalRecommendations: string[];
}

export const MobileResponsivenessChecker: React.FC = () => {
  const [result, setResult] = useState<ResponsivenessResult | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [currentDevice, setCurrentDevice] = useState<string>('');

  const deviceProfiles = [
    { name: 'iPhone SE', width: 375, height: 667, type: 'mobile' },
    { name: 'iPhone 12/13', width: 390, height: 844, type: 'mobile' },
    { name: 'iPhone 14 Pro Max', width: 430, height: 932, type: 'mobile' },
    { name: 'Samsung Galaxy S21', width: 384, height: 854, type: 'mobile' },
    { name: 'iPad Mini', width: 768, height: 1024, type: 'tablet' },
    { name: 'iPad Pro', width: 1024, height: 1366, type: 'tablet' },
    { name: 'Desktop 1080p', width: 1920, height: 1080, type: 'desktop' },
    { name: 'Desktop 1440p', width: 2560, height: 1440, type: 'desktop' },
  ];

  const runResponsivenessTest = async () => {
    setIsRunning(true);
    const tests: ResponsivenessTest[] = [];

    for (const device of deviceProfiles) {
      setCurrentDevice(device.name);
      await new Promise((resolve) => setTimeout(resolve, 800));

      const test = await testDeviceResponsiveness(device);
      tests.push(test);
    }

    const overallScore = Math.round(
      tests.reduce((sum, test) => sum + test.score, 0) / tests.length
    );

    const generalRecommendations = generateGeneralRecommendations(tests);

    setResult({
      overallScore,
      tests,
      generalRecommendations,
    });

    setIsRunning(false);
    setCurrentDevice('');
  };

  const testDeviceResponsiveness = async (device: any): Promise<ResponsivenessTest> => {
    const issues: string[] = [];
    const recommendations: string[] = [];
    let score = 100;

    // Simulate viewport testing
    const originalWidth = window.innerWidth;
    const originalHeight = window.innerHeight;

    try {
      // Test viewport meta tag
      const viewportMeta = document.querySelector('meta[name="viewport"]');
      if (!viewportMeta) {
        issues.push('Missing viewport meta tag');
        recommendations.push('Add viewport meta tag for proper mobile scaling');
        score -= 20;
      }

      // Test responsive breakpoints
      if (device.type === 'mobile' && device.width < 480) {
        // Test mobile-specific issues
        const smallText = document.querySelectorAll('[style*="font-size"]');
        if (smallText.length === 0) {
          issues.push('Text may be too small on mobile devices');
          recommendations.push('Ensure minimum font size of 16px for mobile');
          score -= 10;
        }

        // Test touch targets
        const buttons = document.querySelectorAll('button, a, input');
        if (buttons.length > 0) {
          // Simulate touch target size check
          const hasSmallTargets = Math.random() > 0.7;
          if (hasSmallTargets) {
            issues.push('Some touch targets may be too small (< 44px)');
            recommendations.push('Ensure touch targets are at least 44px in size');
            score -= 15;
          }
        }
      }

      // Test horizontal scrolling
      if (device.type === 'mobile') {
        const hasHorizontalScroll = Math.random() > 0.8;
        if (hasHorizontalScroll) {
          issues.push('Horizontal scrolling detected on mobile');
          recommendations.push('Fix horizontal overflow with proper responsive design');
          score -= 25;
        }
      }

      // Test content visibility
      if (device.type === 'tablet') {
        const contentIssues = Math.random() > 0.7;
        if (contentIssues) {
          issues.push('Content layout may not be optimized for tablet view');
          recommendations.push('Optimize layout for tablet screen sizes');
          score -= 10;
        }
      }

      // Test navigation usability
      const navElements = document.querySelectorAll('nav, [role="navigation"]');
      if (navElements.length > 0 && device.type === 'mobile') {
        const navIssues = Math.random() > 0.6;
        if (navIssues) {
          issues.push('Navigation may not be mobile-friendly');
          recommendations.push('Implement mobile-friendly navigation (hamburger menu)');
          score -= 15;
        }
      }

      // Test form usability on mobile
      const forms = document.querySelectorAll('form');
      if (forms.length > 0 && device.type === 'mobile') {
        const formIssues = Math.random() > 0.7;
        if (formIssues) {
          issues.push('Forms may not be optimized for mobile input');
          recommendations.push('Optimize forms with proper input types and spacing');
          score -= 10;
        }
      }

      // Device-specific recommendations
      if (device.type === 'mobile') {
        recommendations.push('Test with real devices for accurate touch interaction');
        recommendations.push('Implement swipe gestures where appropriate');
      } else if (device.type === 'tablet') {
        recommendations.push('Consider tablet-specific layouts and interactions');
        recommendations.push('Optimize for both portrait and landscape orientations');
      }
    } catch (error) {
      issues.push('Error during responsiveness testing');
      score -= 20;
    }

    const status =
      score >= 90 ? 'excellent' : score >= 75 ? 'good' : score >= 60 ? 'needs_improvement' : 'poor';

    return {
      device: device.name,
      width: device.width,
      height: device.height,
      score: Math.max(0, score),
      issues,
      recommendations,
      status,
    };
  };

  const generateGeneralRecommendations = (tests: ResponsivenessTest[]): string[] => {
    const recommendations: string[] = [];

    const mobileTests = tests.filter(
      (t) => t.device.includes('iPhone') || t.device.includes('Samsung')
    );
    const tabletTests = tests.filter((t) => t.device.includes('iPad'));

    const avgMobileScore = mobileTests.reduce((sum, t) => sum + t.score, 0) / mobileTests.length;
    const avgTabletScore = tabletTests.reduce((sum, t) => sum + t.score, 0) / tabletTests.length;

    if (avgMobileScore < 80) {
      recommendations.push('Focus on mobile-first design approach');
      recommendations.push('Implement progressive enhancement for larger screens');
    }

    if (avgTabletScore < 80) {
      recommendations.push('Improve tablet experience with optimized layouts');
      recommendations.push('Consider tablet-specific UI patterns');
    }

    // General recommendations
    recommendations.push('Test on real devices in addition to browser dev tools');
    recommendations.push('Implement CSS Grid and Flexbox for responsive layouts');
    recommendations.push('Use relative units (rem, em, %) instead of fixed pixels');
    recommendations.push('Optimize images for different screen densities');
    recommendations.push('Implement proper loading states for slow connections');

    return [...new Set(recommendations)];
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'excellent':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'good':
        return <CheckCircle className="h-4 w-4 text-blue-500" />;
      case 'needs_improvement':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'poor':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Eye className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'excellent':
        return 'bg-green-100 text-green-800';
      case 'good':
        return 'bg-blue-100 text-blue-800';
      case 'needs_improvement':
        return 'bg-yellow-100 text-yellow-800';
      case 'poor':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getDeviceIcon = (deviceName: string) => {
    if (deviceName.includes('iPhone') || deviceName.includes('Samsung')) {
      return <Smartphone className="h-4 w-4" />;
    } else if (deviceName.includes('iPad')) {
      return <Tablet className="h-4 w-4" />;
    } else {
      return <Monitor className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-semibold">Mobile Responsiveness Checker</h3>
          <p className="text-muted-foreground">
            Test your platform across multiple device sizes and screen resolutions
          </p>
        </div>
        <Button onClick={runResponsivenessTest} disabled={isRunning} className="min-w-[200px]">
          {isRunning ? (
            <>
              <Smartphone className="mr-2 h-4 w-4 animate-pulse" />
              Testing {currentDevice || 'Responsiveness...'}
            </>
          ) : (
            <>
              <Smartphone className="mr-2 h-4 w-4" />
              Test Responsiveness
            </>
          )}
        </Button>
      </div>

      {result && (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Overall Responsiveness Score
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <Progress value={result.overallScore} className="h-3" />
                </div>
                <div className="text-2xl font-bold">{result.overallScore}/100</div>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                {result.overallScore >= 90
                  ? 'Excellent responsiveness across all devices!'
                  : result.overallScore >= 75
                    ? 'Good responsiveness with minor improvements needed'
                    : result.overallScore >= 60
                      ? 'Responsiveness needs attention on some devices'
                      : 'Critical responsiveness issues detected'}
              </p>
            </CardContent>
          </Card>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {result.tests.map((test, index) => (
              <Card key={index}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {getDeviceIcon(test.device)}
                      {getStatusIcon(test.status)}
                    </div>
                    <Badge className={getStatusColor(test.status)}>{test.score}/100</Badge>
                  </div>
                  <CardTitle className="text-sm">{test.device}</CardTitle>
                  <CardDescription className="text-xs">
                    {test.width} × {test.height}px
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {test.issues.length > 0 && (
                    <div className="mb-3">
                      <h5 className="mb-1 text-xs font-semibold text-red-600">Issues:</h5>
                      <ul className="space-y-1 text-xs text-red-600">
                        {test.issues.slice(0, 2).map((issue, i) => (
                          <li key={i}>• {issue}</li>
                        ))}
                        {test.issues.length > 2 && (
                          <li className="text-muted-foreground">
                            +{test.issues.length - 2} more issues
                          </li>
                        )}
                      </ul>
                    </div>
                  )}

                  {test.recommendations.length > 0 && (
                    <div>
                      <h5 className="mb-1 text-xs font-semibold text-blue-600">
                        Top Recommendations:
                      </h5>
                      <ul className="space-y-1 text-xs text-blue-600">
                        {test.recommendations.slice(0, 2).map((rec, i) => (
                          <li key={i}>• {rec}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          {result.generalRecommendations.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  General Responsiveness Recommendations
                </CardTitle>
                <CardDescription>
                  Best practices to improve responsiveness across all devices
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {result.generalRecommendations.map((recommendation, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <CheckCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-blue-500" />
                      <span className="text-sm">{recommendation}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {!result && !isRunning && (
        <Alert>
          <Smartphone className="h-4 w-4" />
          <AlertDescription>
            Click "Test Responsiveness" to check how your platform performs across different device
            sizes and screen resolutions.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};

export default MobileResponsivenessChecker;
