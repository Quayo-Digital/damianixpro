
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, Send, FileText, Home, AlertTriangle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { OnboardingStatus, getOnboardingStatus, generateLeaseDocument, sendLeaseForSigning, recordLeaseSigned, sendMoveInInstructions, completeOnboarding } from '@/services/tenants/onboarding';
import { format } from 'date-fns';

interface TenantOnboardingProps {
  tenantId: string;
  propertyId: string;
  tenantName: string;
  propertyName: string;
}

export function TenantOnboarding({ tenantId, propertyId, tenantName, propertyName }: TenantOnboardingProps) {
  const [status, setStatus] = useState<OnboardingStatus | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [activeStep, setActiveStep] = useState<number>(1);
  const [progressPercent, setProgressPercent] = useState<number>(0);
  
  useEffect(() => {
    loadOnboardingStatus();
  }, [tenantId]);
  
  const loadOnboardingStatus = async () => {
    setIsLoading(true);
    const onboardingStatus = await getOnboardingStatus(tenantId);
    setStatus(onboardingStatus);
    
    // Calculate which step is active
    if (onboardingStatus) {
      let step = 1;
      let progress = 0;
      
      if (onboardingStatus.welcome_sent) {
        step = 2;
        progress = 20;
      }
      
      if (onboardingStatus.lease_generated) {
        step = 3;
        progress = 40;
      }
      
      if (onboardingStatus.lease_sent) {
        step = 4;
        progress = 60;
      }
      
      if (onboardingStatus.lease_signed) {
        step = 5;
        progress = 80;
      }
      
      if (onboardingStatus.move_in_instructions_sent) {
        step = 6;
        progress = 90;
      }
      
      if (onboardingStatus.completed) {
        step = 7;
        progress = 100;
      }
      
      setActiveStep(step);
      setProgressPercent(progress);
    }
    
    setIsLoading(false);
  };
  
  const handleGenerateLease = async () => {
    // In a real app, you would gather lease data from a form
    const leaseData = {
      startDate: new Date().toISOString(),
      endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(), // 1 year lease
      rentAmount: 120000,
      securityDeposit: 120000,
      // Additional lease terms would go here
    };
    
    const documentId = await generateLeaseDocument(tenantId, propertyId, leaseData);
    if (documentId) {
      await loadOnboardingStatus();
    }
  };
  
  const handleSendLease = async () => {
    if (status?.lease_document_id) {
      const success = await sendLeaseForSigning(tenantId, status.lease_document_id);
      if (success) {
        await loadOnboardingStatus();
      }
    }
  };
  
  const handleMarkLeaseSigned = async () => {
    if (status?.lease_document_id) {
      const success = await recordLeaseSigned(tenantId, status.lease_document_id);
      if (success) {
        await loadOnboardingStatus();
      }
    }
  };
  
  const handleSendMoveInInstructions = async () => {
    const success = await sendMoveInInstructions(tenantId, propertyId);
    if (success) {
      await loadOnboardingStatus();
    }
  };
  
  const handleCompleteOnboarding = async () => {
    const success = await completeOnboarding(tenantId);
    if (success) {
      await loadOnboardingStatus();
    }
  };
  
  if (isLoading) {
    return (
      <Card className="w-full">
        <CardContent className="pt-6">
          <p className="text-center text-muted-foreground">Loading onboarding status...</p>
        </CardContent>
      </Card>
    );
  }
  
  if (!status) {
    return (
      <Alert variant="destructive">
        <AlertDescription>
          Unable to load tenant onboarding information. Please try again later.
        </AlertDescription>
      </Alert>
    );
  }
  
  const onboardingSteps = [
    {
      id: 1,
      title: 'Welcome',
      description: 'Send welcome package to tenant',
      completed: status.welcome_sent,
      icon: <CheckCircle className="h-5 w-5" />,
      action: () => {}, // Assume welcome is sent automatically when tenant is approved
    },
    {
      id: 2,
      title: 'Generate Lease',
      description: 'Create lease document for tenant',
      completed: status.lease_generated,
      icon: <FileText className="h-5 w-5" />,
      action: handleGenerateLease,
    },
    {
      id: 3,
      title: 'Send for Signature',
      description: 'Send lease document to tenant for signing',
      completed: status.lease_sent,
      icon: <Send className="h-5 w-5" />,
      action: handleSendLease,
      disabled: !status.lease_generated,
    },
    {
      id: 4,
      title: 'Lease Signed',
      description: 'Record lease as signed by tenant',
      completed: status.lease_signed,
      icon: <CheckCircle className="h-5 w-5" />,
      action: handleMarkLeaseSigned,
      disabled: !status.lease_sent,
    },
    {
      id: 5,
      title: 'Move-In Instructions',
      description: 'Send move-in details and information',
      completed: status.move_in_instructions_sent,
      icon: <Home className="h-5 w-5" />,
      action: handleSendMoveInInstructions,
      disabled: !status.lease_signed,
    },
    {
      id: 6,
      title: 'Complete Onboarding',
      description: 'Mark tenant onboarding as complete',
      completed: status.completed,
      icon: <CheckCircle className="h-5 w-5" />,
      action: handleCompleteOnboarding,
      disabled: !status.move_in_instructions_sent,
    },
  ];
  
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Tenant Onboarding: {tenantName}</CardTitle>
          <CardDescription>Property: {propertyName}</CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <div className="flex justify-between">
              <p className="text-sm text-muted-foreground">Onboarding Progress</p>
              <p className="text-sm font-medium">{progressPercent}%</p>
            </div>
            <Progress value={progressPercent} className="h-2" />
          </div>
          
          {status.completed ? (
            <Alert className="bg-green-50 border-green-200">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-600">
                Tenant onboarding has been completed successfully.
              </AlertDescription>
            </Alert>
          ) : (
            <Alert className="bg-blue-50 border-blue-200">
              <AlertTriangle className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-600">
                Tenant onboarding is in progress. Complete the remaining steps to finish the process.
              </AlertDescription>
            </Alert>
          )}
          
          <div className="space-y-6">
            {onboardingSteps.map((step) => (
              <div key={step.id} className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-full ${step.completed ? 'bg-green-100 text-green-600' : activeStep === step.id ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-400'}`}>
                      {step.icon}
                    </div>
                    <div>
                      <h4 className="font-medium">{step.title}</h4>
                      <p className="text-sm text-muted-foreground">{step.description}</p>
                    </div>
                  </div>
                  
                  {step.completed ? (
                    <Badge className="bg-green-100 text-green-600 border-green-200">Completed</Badge>
                  ) : activeStep === step.id ? (
                    <Button
                      onClick={step.action}
                      disabled={step.disabled}
                    >
                      {step.title}
                    </Button>
                  ) : (
                    <Badge className="bg-gray-100 text-gray-500 border-gray-200">Pending</Badge>
                  )}
                </div>
                
                {step.id < onboardingSteps.length && (
                  <div className="ml-6 pl-3 border-l-2 border-dashed border-gray-200">
                    <div className="h-4"></div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
        
        <CardFooter className="border-t px-6 py-4">
          <div className="text-sm text-muted-foreground">
            <p>Last updated: {status.updated_at ? format(new Date(status.updated_at), 'MMM d, yyyy h:mm a') : 'N/A'}</p>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
