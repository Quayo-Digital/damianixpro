import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Shield, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Phone, 
  CreditCard, 
  Building, 
  User, 
  FileText,
  TrendingUp,
  Lock,
  Zap
} from 'lucide-react';
import { useNigerianApis } from '@/hooks/useNigerianApis';
import { BVNVerificationForm } from './BVNVerificationForm';
import { NINVerificationForm } from './NINVerificationForm';
import { CACVerificationForm } from './CACVerificationForm';
import { BankVerificationForm } from './BankVerificationForm';
import { PhoneVerificationForm } from './PhoneVerificationForm';
import { cn } from '@/lib/utils';

interface KYCVerificationDashboardProps {
  className?: string;
  compact?: boolean;
}

export const KYCVerificationDashboard: React.FC<KYCVerificationDashboardProps> = ({
  className = '',
  compact = false
}) => {
  const {
    kycProfile,
    isLoadingKyc,
    canUseNigerianApis,
    getVerificationLevel,
    getVerificationProgress,
    getRiskLevelColor,
    providerStatus,
    isLoadingProviders
  } = useNigerianApis();

  const [activeTab, setActiveTab] = useState('overview');

  const verificationProgress = getVerificationProgress();
  const verificationLevel = getVerificationLevel();
  const riskLevelColor = getRiskLevelColor();

  const verificationItems = [
    {
      id: 'bvn',
      title: 'Bank Verification Number (BVN)',
      description: 'Verify your identity with your BVN',
      icon: <CreditCard className="h-5 w-5" />,
      verified: kycProfile?.bvn_verified || false,
      required: true,
      component: BVNVerificationForm
    },
    {
      id: 'nin',
      title: 'National Identification Number (NIN)',
      description: 'Verify your identity with your NIN',
      icon: <User className="h-5 w-5" />,
      verified: kycProfile?.nin_verified || false,
      required: true,
      component: NINVerificationForm
    },
    {
      id: 'phone',
      title: 'Phone Number Verification',
      description: 'Verify your phone number',
      icon: <Phone className="h-5 w-5" />,
      verified: kycProfile?.phone_verified || false,
      required: false,
      component: PhoneVerificationForm
    },
    {
      id: 'bank',
      title: 'Bank Account Verification',
      description: 'Verify your bank account details',
      icon: <Building className="h-5 w-5" />,
      verified: kycProfile?.bank_account_verified || false,
      required: false,
      component: BankVerificationForm
    },
    {
      id: 'business',
      title: 'Business Registration (CAC)',
      description: 'Verify your business registration',
      icon: <FileText className="h-5 w-5" />,
      verified: kycProfile?.business_verified || false,
      required: false,
      component: CACVerificationForm
    }
  ];

  const getStatusIcon = (verified: boolean) => {
    return verified ? (
      <CheckCircle className="h-4 w-4 text-green-500" />
    ) : (
      <XCircle className="h-4 w-4 text-gray-400" />
    );
  };

  const getStatusBadge = (verified: boolean, required: boolean) => {
    if (verified) {
      return <Badge variant="default" className="bg-green-100 text-green-800">Verified</Badge>;
    }
    if (required) {
      return <Badge variant="destructive">Required</Badge>;
    }
    return <Badge variant="outline">Optional</Badge>;
  };

  if (!canUseNigerianApis) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Shield className="h-5 w-5 text-blue-600" />
            <span>KYC Verification</span>
            <Badge variant="outline">Premium Feature</Badge>
          </CardTitle>
          <CardDescription>
            Complete your Know Your Customer (KYC) verification for enhanced security
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <Zap className="h-4 w-4" />
            <AlertDescription>
              KYC verification requires a premium subscription. Upgrade to access Nigerian government and banking integrations.
            </AlertDescription>
          </Alert>
          <Button className="mt-4 w-full" variant="outline">
            Upgrade to Premium
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (compact) {
    return (
      <Card className={className}>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Shield className="h-5 w-5 text-blue-600" />
              <span>KYC Status</span>
            </div>
            <Badge variant="outline">{verificationLevel}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>Verification Progress</span>
              <span className="font-medium">{verificationProgress}%</span>
            </div>
            <Progress value={verificationProgress} className="h-2" />
          </div>
          
          {kycProfile && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Risk Level</span>
              <Badge 
                variant="outline" 
                className={cn(
                  riskLevelColor === 'green' && 'border-green-200 bg-green-50 text-green-700',
                  riskLevelColor === 'yellow' && 'border-yellow-200 bg-yellow-50 text-yellow-700',
                  riskLevelColor === 'red' && 'border-red-200 bg-red-50 text-red-700'
                )}
              >
                {kycProfile.risk_level.toUpperCase()}
              </Badge>
            </div>
          )}
          
          <Button 
            variant="outline" 
            className="w-full"
            onClick={() => setActiveTab('verification')}
          >
            Complete Verification
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Shield className="h-6 w-6 text-blue-600" />
            <CardTitle>KYC Verification Dashboard</CardTitle>
          </div>
          <Badge variant="outline" className="text-sm">
            {verificationLevel} Level
          </Badge>
        </div>
        <CardDescription>
          Complete your identity verification to enhance security and unlock premium features
        </CardDescription>
      </CardHeader>

      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="verification">Verification</TabsTrigger>
            <TabsTrigger value="status">Status</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Progress Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="flex items-center justify-between p-4">
                  <div>
                    <p className="text-2xl font-bold text-blue-600">{verificationProgress}%</p>
                    <p className="text-sm text-gray-600">Complete</p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-blue-500" />
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="flex items-center justify-between p-4">
                  <div>
                    <p className="text-lg font-bold text-green-600">{verificationLevel}</p>
                    <p className="text-sm text-gray-600">Level</p>
                  </div>
                  <Shield className="h-8 w-8 text-green-500" />
                </CardContent>
              </Card>
              
              {kycProfile && (
                <Card>
                  <CardContent className="flex items-center justify-between p-4">
                    <div>
                      <p className={cn(
                        "text-lg font-bold",
                        riskLevelColor === 'green' && 'text-green-600',
                        riskLevelColor === 'yellow' && 'text-yellow-600',
                        riskLevelColor === 'red' && 'text-red-600'
                      )}>
                        {kycProfile.risk_level.toUpperCase()}
                      </p>
                      <p className="text-sm text-gray-600">Risk Level</p>
                    </div>
                    <Lock className={cn(
                      "h-8 w-8",
                      riskLevelColor === 'green' && 'text-green-500',
                      riskLevelColor === 'yellow' && 'text-yellow-500',
                      riskLevelColor === 'red' && 'text-red-500'
                    )} />
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Verification Items Overview */}
            <div className="space-y-3">
              <h3 className="text-lg font-semibold">Verification Requirements</h3>
              <div className="space-y-2">
                {verificationItems.map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      {getStatusIcon(item.verified)}
                      <div className="flex items-center space-x-2">
                        {item.icon}
                        <span className="font-medium">{item.title}</span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {getStatusBadge(item.verified, item.required)}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Progress Bar */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Overall Progress</span>
                <span className="text-sm text-gray-600">{verificationProgress}% Complete</span>
              </div>
              <Progress value={verificationProgress} className="h-3" />
            </div>
          </TabsContent>

          <TabsContent value="verification" className="space-y-6">
            <div className="grid gap-6">
              {verificationItems.map((item) => {
                const Component = item.component;
                return (
                  <Card key={item.id} className={cn(
                    "transition-all duration-200",
                    item.verified && "border-green-200 bg-green-50"
                  )}>
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          {item.icon}
                          <span>{item.title}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          {getStatusIcon(item.verified)}
                          {getStatusBadge(item.verified, item.required)}
                        </div>
                      </CardTitle>
                      <CardDescription>{item.description}</CardDescription>
                    </CardHeader>
                    
                    {!item.verified && (
                      <CardContent>
                        <Component />
                      </CardContent>
                    )}
                    
                    {item.verified && (
                      <CardContent>
                        <Alert>
                          <CheckCircle className="h-4 w-4" />
                          <AlertDescription>
                            This verification has been completed successfully.
                          </AlertDescription>
                        </Alert>
                      </CardContent>
                    )}
                  </Card>
                );
              })}
            </div>
          </TabsContent>

          <TabsContent value="status" className="space-y-6">
            {/* API Provider Status */}
            <Card>
              <CardHeader>
                <CardTitle>API Provider Status</CardTitle>
                <CardDescription>
                  Status of integrated verification providers
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingProviders ? (
                  <div className="space-y-2">
                    <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                    <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                    <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {providerStatus && Object.entries(providerStatus).map(([provider, status]) => (
                      <div key={provider} className="flex items-center justify-between p-2 border rounded">
                        <span className="font-medium capitalize">{provider}</span>
                        <Badge variant={status ? "default" : "secondary"}>
                          {status ? "Connected" : "Not Configured"}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* KYC Profile Details */}
            {kycProfile && (
              <Card>
                <CardHeader>
                  <CardTitle>KYC Profile Details</CardTitle>
                  <CardDescription>
                    Your current verification status and risk assessment
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-600">Verification Level</label>
                      <p className="text-lg font-semibold">{verificationLevel}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Risk Score</label>
                      <p className="text-lg font-semibold">{kycProfile.risk_score}/100</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Risk Level</label>
                      <Badge 
                        variant="outline" 
                        className={cn(
                          riskLevelColor === 'green' && 'border-green-200 bg-green-50 text-green-700',
                          riskLevelColor === 'yellow' && 'border-yellow-200 bg-yellow-50 text-yellow-700',
                          riskLevelColor === 'red' && 'border-red-200 bg-red-50 text-red-700'
                        )}
                      >
                        {kycProfile.risk_level.toUpperCase()}
                      </Badge>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Last Updated</label>
                      <p className="text-sm">{new Date(kycProfile.last_updated).toLocaleDateString()}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};
