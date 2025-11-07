import React, { useEffect, useState } from 'react';
import { AdminOnboardingForm } from '@/components/onboarding/AdminOnboardingForm';
import { OwnerOnboardingForm } from '@/components/onboarding/OwnerOnboardingForm';
import { AgentOnboardingForm } from '@/components/onboarding/AgentOnboardingForm';
import { VendorOnboardingForm } from '@/components/onboarding/VendorOnboardingForm';
import { EnhancedTenantOnboarding } from '@/components/onboarding/EnhancedTenantOnboarding';
import { useAuth } from '@/contexts/auth';
import { useNavigate } from 'react-router-dom';

const Onboarding = () => {
  const { user, userRole, isLoading } = useAuth();
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
        <div className="w-16 h-16 border-4 border-primary border-solid rounded-full border-t-transparent animate-spin"></div>
        <h2 className="mt-4 text-xl font-semibold">Loading your profile...</h2>
      </div>
    );
  }

  // Render the appropriate onboarding form based on user role
  return (
    <div className="flex min-h-screen bg-secondary/50 items-center justify-center p-4">
      <div className="w-full max-w-3xl">
        {userRole === 'admin' && <AdminOnboardingForm />}
        {userRole === 'owner' && <OwnerOnboardingForm />}
        {userRole === 'agent' && <AgentOnboardingForm />}
        {userRole === 'tenant' && <EnhancedTenantOnboarding />}
        {userRole === 'vendor' && <VendorOnboardingForm />}
        {/* Default case - use owner form */}
        {(!userRole || userRole === 'user') && <OwnerOnboardingForm />}
      </div>
    </div>
  );
};

export default Onboarding;
