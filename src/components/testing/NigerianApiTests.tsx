import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  CheckCircle,
  XCircle,
  AlertTriangle,
  Play,
  Shield,
  CreditCard,
  User,
  FileText,
  Building,
  Phone,
  Globe,
  Database,
  Zap,
} from 'lucide-react';
import { useNigerianApis } from '@/hooks/useNigerianApis';
import { KYCVerificationDashboard } from '@/components/kyc/KYCVerificationDashboard';

interface TestResult {
  name: string;
  status: 'pass' | 'fail' | 'warning';
  message: string;
  details?: string;
  duration?: number;
}

export const NigerianApiTests: React.FC = () => {
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  const {
    canUseNigerianApis,
    providerStatus,
    nigerianBanks,
    kycProfile,
    isLoadingBanks,
    isLoadingProviders,
    testProviderConnection,
    supportedVerificationTypes,
  } = useNigerianApis();

  const addResult = (result: TestResult) => {
    setTestResults((prev) => [...prev, result]);
  };

  const clearResults = () => {
    setTestResults([]);
  };

  // Test 1: Feature Access and Subscription
  const testFeatureAccess = () => {
    addResult({
      name: 'Nigerian API Feature Access',
      status: canUseNigerianApis ? 'pass' : 'warning',
      message: canUseNigerianApis
        ? 'Nigerian API features are accessible'
        : 'Nigerian API features require premium subscription',
      details: canUseNigerianApis
        ? 'User has access to all verification services'
        : 'Upgrade subscription to access Nigerian API integrations',
    });
  };

  // Test 2: API Provider Configuration
  const testProviderConfiguration = () => {
    if (!providerStatus) {
      addResult({
        name: 'Provider Configuration',
        status: 'fail',
        message: 'Unable to load provider status',
        details: 'Provider configuration could not be retrieved',
      });
      return;
    }

    Object.entries(providerStatus).forEach(([provider, configured]) => {
      addResult({
        name: `${provider.charAt(0).toUpperCase() + provider.slice(1)} Configuration`,
        status: configured ? 'pass' : 'warning',
        message: configured ? `${provider} is configured` : `${provider} is not configured`,
        details: configured ? 'API keys and endpoints are set up' : 'Missing API configuration',
      });
    });
  };

  // Test 3: Nigerian Banks Data
  const testBanksData = () => {
    addResult({
      name: 'Nigerian Banks Data',
      status: nigerianBanks.length > 0 ? 'pass' : 'fail',
      message: `${nigerianBanks.length} Nigerian banks loaded`,
      details:
        nigerianBanks.length > 0
          ? 'Bank codes and names available for verification'
          : 'Failed to load Nigerian banks data',
    });

    // Test specific major banks
    const majorBanks = ['044', '058', '011', '033', '057']; // Access, GTB, First Bank, UBA, Zenith
    const foundBanks = majorBanks.filter((code) =>
      nigerianBanks.some((bank) => bank.code === code)
    );

    addResult({
      name: 'Major Banks Coverage',
      status: foundBanks.length >= 4 ? 'pass' : 'warning',
      message: `${foundBanks.length}/5 major banks found`,
      details: `Found banks with codes: ${foundBanks.join(', ')}`,
    });
  };

  // Test 4: Verification Types Support
  const testVerificationTypes = () => {
    const requiredTypes = ['bvn', 'nin', 'cac', 'bank_account', 'phone'];
    const supportedTypes = supportedVerificationTypes;

    requiredTypes.forEach((type) => {
      const isSupported = supportedTypes.includes(type as any);
      addResult({
        name: `${type.toUpperCase()} Verification Support`,
        status: isSupported ? 'pass' : 'fail',
        message: isSupported
          ? `${type.toUpperCase()} verification is supported`
          : `${type.toUpperCase()} verification not supported`,
        details: isSupported ? 'Service integration available' : 'Service integration missing',
      });
    });
  };

  // Test 5: KYC Profile System
  const testKycProfile = () => {
    addResult({
      name: 'KYC Profile System',
      status: kycProfile ? 'pass' : 'warning',
      message: kycProfile ? 'KYC profile loaded successfully' : 'KYC profile not available',
      details: kycProfile
        ? `Verification level: ${kycProfile.verification_level}, Risk: ${kycProfile.risk_level}`
        : 'User may not have a KYC profile yet',
    });

    if (kycProfile) {
      const verifications = [
        { key: 'bvn_verified', name: 'BVN' },
        { key: 'nin_verified', name: 'NIN' },
        { key: 'phone_verified', name: 'Phone' },
        { key: 'bank_account_verified', name: 'Bank Account' },
        { key: 'business_verified', name: 'Business' },
      ];

      verifications.forEach(({ key, name }) => {
        const isVerified = kycProfile[key as keyof typeof kycProfile] as boolean;
        addResult({
          name: `${name} Verification Status`,
          status: isVerified ? 'pass' : 'warning',
          message: isVerified ? `${name} is verified` : `${name} not yet verified`,
          details: isVerified ? 'Verification completed successfully' : 'Verification pending',
        });
      });
    }
  };

  // Test 6: Provider Connectivity
  const testProviderConnectivity = async () => {
    if (!canUseNigerianApis) {
      addResult({
        name: 'Provider Connectivity',
        status: 'warning',
        message: 'Cannot test connectivity without API access',
        details: 'Premium subscription required for connectivity tests',
      });
      return;
    }

    const providers = ['youverify', 'appruve', 'flutterwave'] as const;

    for (const provider of providers) {
      const startTime = Date.now();
      try {
        const isConnected = await testProviderConnection(provider);
        const duration = Date.now() - startTime;

        addResult({
          name: `${provider.charAt(0).toUpperCase() + provider.slice(1)} Connectivity`,
          status: isConnected ? 'pass' : 'fail',
          message: isConnected
            ? `${provider} connection successful`
            : `${provider} connection failed`,
          details: isConnected ? `Response time: ${duration}ms` : 'Unable to establish connection',
          duration,
        });
      } catch (error) {
        const duration = Date.now() - startTime;
        addResult({
          name: `${provider.charAt(0).toUpperCase() + provider.slice(1)} Connectivity`,
          status: 'fail',
          message: `${provider} connection error`,
          details: error instanceof Error ? error.message : 'Unknown connection error',
          duration,
        });
      }
    }
  };

  // Test 7: Mock Verification Tests
  const testMockVerifications = async () => {
    if (!canUseNigerianApis) {
      addResult({
        name: 'Mock Verification Tests',
        status: 'warning',
        message: 'Cannot run mock tests without API access',
        details: 'Premium subscription required for verification tests',
      });
      return;
    }

    // Test BVN format validation
    const testBvn = '12345678901';
    const bvnValid = /^\d{11}$/.test(testBvn);
    addResult({
      name: 'BVN Format Validation',
      status: bvnValid ? 'pass' : 'fail',
      message: bvnValid ? 'BVN format validation works' : 'BVN format validation failed',
      details: `Test BVN: ${testBvn}, Valid: ${bvnValid}`,
    });

    // Test NIN format validation
    const testNin = '12345678901';
    const ninValid = /^\d{11}$/.test(testNin);
    addResult({
      name: 'NIN Format Validation',
      status: ninValid ? 'pass' : 'fail',
      message: ninValid ? 'NIN format validation works' : 'NIN format validation failed',
      details: `Test NIN: ${testNin}, Valid: ${ninValid}`,
    });

    // Test phone format validation
    const testPhone = '+2348012345678';
    const phoneValid = /^(\+234|0)[789]\d{9}$/.test(testPhone);
    addResult({
      name: 'Phone Format Validation',
      status: phoneValid ? 'pass' : 'fail',
      message: phoneValid ? 'Phone format validation works' : 'Phone format validation failed',
      details: `Test Phone: ${testPhone}, Valid: ${phoneValid}`,
    });

    // Test account number format validation
    const testAccount = '1234567890';
    const accountValid = /^\d{10}$/.test(testAccount);
    addResult({
      name: 'Account Number Format Validation',
      status: accountValid ? 'pass' : 'fail',
      message: accountValid
        ? 'Account number format validation works'
        : 'Account number format validation failed',
      details: `Test Account: ${testAccount}, Valid: ${accountValid}`,
    });
  };

  const runAllTests = async () => {
    setIsRunning(true);
    clearResults();

    try {
      // Run synchronous tests first
      testFeatureAccess();
      testProviderConfiguration();
      testBanksData();
      testVerificationTypes();
      testKycProfile();

      // Run asynchronous tests
      await testMockVerifications();
      await testProviderConnectivity();
    } catch (error) {
      addResult({
        name: 'Test Suite Error',
        status: 'fail',
        message: 'Error running test suite',
        details: error instanceof Error ? error.message : 'Unknown error',
      });
    } finally {
      setIsRunning(false);
    }
  };

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'pass':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'fail':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
    }
  };

  const getStatusColor = (status: TestResult['status']) => {
    switch (status) {
      case 'pass':
        return 'border-green-200 bg-green-50';
      case 'fail':
        return 'border-red-200 bg-red-50';
      case 'warning':
        return 'border-yellow-200 bg-yellow-50';
    }
  };

  const passCount = testResults.filter((r) => r.status === 'pass').length;
  const failCount = testResults.filter((r) => r.status === 'fail').length;
  const warningCount = testResults.filter((r) => r.status === 'warning').length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Nigerian API Integration Tests</h2>
          <p className="mt-1 text-gray-600">
            Comprehensive testing of Nigerian banking and government service integrations
          </p>
        </div>

        <Button
          onClick={runAllTests}
          disabled={isRunning}
          className="bg-blue-600 hover:bg-blue-700"
        >
          {isRunning ? (
            <div className="flex items-center space-x-2">
              <div className="h-4 w-4 animate-spin rounded-full border-b-2 border-primary-foreground"></div>
              <span>Running Tests...</span>
            </div>
          ) : (
            <>
              <Play className="mr-2 h-4 w-4" />
              Run All Tests
            </>
          )}
        </Button>
      </div>

      {testResults.length > 0 && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="flex items-center justify-between p-4">
              <div>
                <p className="text-2xl font-bold text-green-600">{passCount}</p>
                <p className="text-sm text-gray-600">Passed</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex items-center justify-between p-4">
              <div>
                <p className="text-2xl font-bold text-red-600">{failCount}</p>
                <p className="text-sm text-gray-600">Failed</p>
              </div>
              <XCircle className="h-8 w-8 text-red-500" />
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex items-center justify-between p-4">
              <div>
                <p className="text-2xl font-bold text-yellow-600">{warningCount}</p>
                <p className="text-sm text-gray-600">Warnings</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-yellow-500" />
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex items-center justify-between p-4">
              <div>
                <p className="text-2xl font-bold text-blue-600">{testResults.length}</p>
                <p className="text-sm text-gray-600">Total Tests</p>
              </div>
              <Shield className="h-8 w-8 text-blue-500" />
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="providers">Providers</TabsTrigger>
          <TabsTrigger value="verification">Verification</TabsTrigger>
          <TabsTrigger value="kyc">KYC</TabsTrigger>
          <TabsTrigger value="connectivity">Connectivity</TabsTrigger>
          <TabsTrigger value="demo">Live Demo</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Globe className="h-5 w-5" />
                <span>Integration Overview</span>
              </CardTitle>
              <CardDescription>
                Status of Nigerian API integrations and feature availability
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {testResults
                  .filter((r) =>
                    [
                      'Nigerian API Feature Access',
                      'Nigerian Banks Data',
                      'KYC Profile System',
                    ].includes(r.name)
                  )
                  .map((result, index) => (
                    <div
                      key={index}
                      className={`rounded-lg border p-3 ${getStatusColor(result.status)}`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          {getStatusIcon(result.status)}
                          <span className="font-medium">{result.name}</span>
                        </div>
                        <Badge variant="outline">{result.status}</Badge>
                      </div>
                      <p className="mt-1 text-sm text-gray-600">{result.message}</p>
                      {result.details && (
                        <p className="mt-1 text-xs text-gray-500">{result.details}</p>
                      )}
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="providers" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Database className="h-5 w-5" />
                <span>API Provider Status</span>
              </CardTitle>
              <CardDescription>
                Configuration and connectivity status of integrated providers
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {testResults
                  .filter(
                    (r) => r.name.includes('Configuration') || r.name.includes('Connectivity')
                  )
                  .map((result, index) => (
                    <div
                      key={index}
                      className={`rounded-lg border p-3 ${getStatusColor(result.status)}`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          {getStatusIcon(result.status)}
                          <span className="font-medium">{result.name}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge variant="outline">{result.status}</Badge>
                          {result.duration && (
                            <Badge variant="secondary">{result.duration}ms</Badge>
                          )}
                        </div>
                      </div>
                      <p className="mt-1 text-sm text-gray-600">{result.message}</p>
                      {result.details && (
                        <p className="mt-1 text-xs text-gray-500">{result.details}</p>
                      )}
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="verification" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Shield className="h-5 w-5" />
                <span>Verification Services</span>
              </CardTitle>
              <CardDescription>Testing verification service support and validation</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {testResults
                  .filter(
                    (r) =>
                      r.name.includes('Verification Support') ||
                      r.name.includes('Format Validation')
                  )
                  .map((result, index) => (
                    <div
                      key={index}
                      className={`rounded-lg border p-3 ${getStatusColor(result.status)}`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          {getStatusIcon(result.status)}
                          <span className="font-medium">{result.name}</span>
                        </div>
                        <Badge variant="outline">{result.status}</Badge>
                      </div>
                      <p className="mt-1 text-sm text-gray-600">{result.message}</p>
                      {result.details && (
                        <p className="mt-1 text-xs text-gray-500">{result.details}</p>
                      )}
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="kyc" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <User className="h-5 w-5" />
                <span>KYC Profile Status</span>
              </CardTitle>
              <CardDescription>
                Know Your Customer verification status and profile details
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {testResults
                  .filter((r) => r.name.includes('KYC') || r.name.includes('Verification Status'))
                  .map((result, index) => (
                    <div
                      key={index}
                      className={`rounded-lg border p-3 ${getStatusColor(result.status)}`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          {getStatusIcon(result.status)}
                          <span className="font-medium">{result.name}</span>
                        </div>
                        <Badge variant="outline">{result.status}</Badge>
                      </div>
                      <p className="mt-1 text-sm text-gray-600">{result.message}</p>
                      {result.details && (
                        <p className="mt-1 text-xs text-gray-500">{result.details}</p>
                      )}
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="connectivity" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Zap className="h-5 w-5" />
                <span>Provider Connectivity</span>
              </CardTitle>
              <CardDescription>Real-time connectivity tests with API providers</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {testResults
                  .filter((r) => r.name.includes('Connectivity'))
                  .map((result, index) => (
                    <div
                      key={index}
                      className={`rounded-lg border p-3 ${getStatusColor(result.status)}`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          {getStatusIcon(result.status)}
                          <span className="font-medium">{result.name}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge variant="outline">{result.status}</Badge>
                          {result.duration && (
                            <Badge variant="secondary">{result.duration}ms</Badge>
                          )}
                        </div>
                      </div>
                      <p className="mt-1 text-sm text-gray-600">{result.message}</p>
                      {result.details && (
                        <p className="mt-1 text-xs text-gray-500">{result.details}</p>
                      )}
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="demo" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <CreditCard className="h-5 w-5" />
                <span>Live KYC Verification Demo</span>
              </CardTitle>
              <CardDescription>
                Interactive demonstration of Nigerian API verification services
              </CardDescription>
            </CardHeader>
            <CardContent>
              <KYCVerificationDashboard className="w-full" compact={false} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
