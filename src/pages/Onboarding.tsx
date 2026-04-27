import React, { useEffect, useState } from 'react';
import { AdminOnboardingForm } from '@/components/onboarding/AdminOnboardingForm';
import { AgentOnboardingForm } from '@/components/onboarding/AgentOnboardingForm';
import { VendorOnboardingForm } from '@/components/onboarding/VendorOnboardingForm';
import { EnhancedTenantOnboarding } from '@/components/onboarding/EnhancedTenantOnboarding';
import { AIOnboardingAssistant } from '@/components/onboarding/AIOnboardingAssistant';
import { useAuthSession } from '@/contexts/auth';
import { useNavigate } from 'react-router-dom';

const Onboarding = () => {
  const { user, userRole, isLoading } = useAuthSession();
  const navigate = useNavigate();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Wait for auth to be ready
    if (!isLoading) {
      // If user is not logged in, redirect to auth page
      if (!user) {
        navigate('/auth');
        return;
      }

      // Check if user is already onboarded
      const isOnboarded = user.user_metadata?.onboarded;

      if (isOnboarded) {
        // If already onboarded, redirect to the central dashboard dispatcher
        navigate('/dashboard');
        return;
      }

      setIsReady(true);
    }
  }, [user, userRole, isLoading, navigate]);

  // Show loading state until we determine the right form
  if (isLoading || !isReady) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-4">
        <div className="h-16 w-16 animate-spin rounded-full border-4 border-solid border-primary border-t-transparent"></div>
        <h2 className="mt-4 text-xl font-semibold">Loading your profile...</h2>
      </div>
    );
  }

  // Render the appropriate onboarding form based on user role
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4 text-foreground">
      <div className="w-full max-w-3xl">
        {userRole === 'admin' && <AdminOnboardingForm />}
        {userRole === 'tenant' && <EnhancedTenantOnboarding />}
        {userRole === 'owner' && <AIOnboardingAssistant />}
        {userRole === 'agent' && <AgentOnboardingForm />}
        {userRole === 'vendor' && <VendorOnboardingForm />}
        {(!userRole || userRole === 'user') && (
          // If no role is set, show a role selection interface
          <div className="text-center">
            <p className="mb-4">Please wait while we set up your account...</p>
            <p className="text-sm text-muted-foreground">
              If this takes too long, please refresh the page.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Onboarding;
