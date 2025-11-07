// React Hook for Nigerian API Integrations
// Manages KYC verification, business compliance, and payment integrations

import { useState, useEffect, useCallback } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { nigerianApiService } from '@/services/nigerian/nigerianApiService';
import { useAuth } from '@/contexts/auth';
import { useSubscription } from '@/hooks/useSubscription';
import {
  BVNVerificationRequest,
  BVNVerificationResponse,
  NINVerificationRequest,
  NINVerificationResponse,
  CACVerificationRequest,
  CACVerificationResponse,
  BankAccountVerificationRequest,
  BankAccountVerificationResponse,
  PhoneVerificationRequest,
  PhoneVerificationResponse,
  KYCProfile,
  NigerianBank,
  VerificationType,
  APIProvider,
  VerificationRecord
} from '@/types/nigerianApis';

interface UseNigerianApisOptions {
  enableAutoRefresh?: boolean;
  refreshInterval?: number;
}

export const useNigerianApis = (options: UseNigerianApisOptions = {}) => {
  const { user } = useAuth();
  const { hasFeatureAccess } = useSubscription();
  const queryClient = useQueryClient();
  
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationHistory, setVerificationHistory] = useState<VerificationRecord[]>([]);
  const [kycProfile, setKycProfile] = useState<KYCProfile | null>(null);

  // Check if user can use Nigerian API features
  const canUseNigerianApis = hasFeatureAccess('nigerian_api_integrations');

  // ============================================================================
  // NIGERIAN BANKS DATA
  // ============================================================================

  const {
    data: nigerianBanks = [],
    isLoading: isLoadingBanks,
    error: banksError
  } = useQuery({
    queryKey: ['nigerian-banks'],
    queryFn: () => nigerianApiService.getNigerianBanks(),
    staleTime: 24 * 60 * 60 * 1000, // 24 hours
    cacheTime: 7 * 24 * 60 * 60 * 1000, // 7 days
    enabled: canUseNigerianApis
  });

  // ============================================================================
  // KYC PROFILE MANAGEMENT
  // ============================================================================

  const {
    data: kycProfileData,
    isLoading: isLoadingKyc,
    error: kycError,
    refetch: refetchKyc
  } = useQuery({
    queryKey: ['kyc-profile', user?.id],
    queryFn: () => user?.id ? nigerianApiService.getKYCProfile(user.id) : null,
    enabled: !!user?.id && canUseNigerianApis,
    refetchInterval: options.enableAutoRefresh ? options.refreshInterval || 30000 : false
  });

  useEffect(() => {
    if (kycProfileData) {
      setKycProfile(kycProfileData);
    }
  }, [kycProfileData]);

  // ============================================================================
  // PROVIDER STATUS
  // ============================================================================

  const {
    data: providerStatus,
    isLoading: isLoadingProviders
  } = useQuery({
    queryKey: ['api-provider-status'],
    queryFn: () => nigerianApiService.getProviderStatus(),
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: canUseNigerianApis
  });

  // ============================================================================
  // BVN VERIFICATION
  // ============================================================================

  const bvnVerificationMutation = useMutation({
    mutationFn: async (request: BVNVerificationRequest): Promise<BVNVerificationResponse> => {
      if (!canUseNigerianApis) {
        throw new Error('BVN verification requires a premium subscription');
      }
      return nigerianApiService.verifyBVN(request);
    },
    onMutate: () => {
      setIsVerifying(true);
      toast.loading('Verifying BVN...', { id: 'bvn-verification' });
    },
    onSuccess: (data) => {
      setIsVerifying(false);
      if (data.status === 'success') {
        toast.success('BVN verification successful!', { id: 'bvn-verification' });
        // Update KYC profile
        if (user?.id) {
          updateKycProfile({ bvn_verified: true });
        }
      } else {
        toast.error(data.message, { id: 'bvn-verification' });
      }
    },
    onError: (error) => {
      setIsVerifying(false);
      toast.error(error instanceof Error ? error.message : 'BVN verification failed', { 
        id: 'bvn-verification' 
      });
    }
  });

  // ============================================================================
  // NIN VERIFICATION
  // ============================================================================

  const ninVerificationMutation = useMutation({
    mutationFn: async (request: NINVerificationRequest): Promise<NINVerificationResponse> => {
      if (!canUseNigerianApis) {
        throw new Error('NIN verification requires a premium subscription');
      }
      return nigerianApiService.verifyNIN(request);
    },
    onMutate: () => {
      setIsVerifying(true);
      toast.loading('Verifying NIN...', { id: 'nin-verification' });
    },
    onSuccess: (data) => {
      setIsVerifying(false);
      if (data.status === 'success') {
        toast.success('NIN verification successful!', { id: 'nin-verification' });
        if (user?.id) {
          updateKycProfile({ nin_verified: true });
        }
      } else {
        toast.error(data.message, { id: 'nin-verification' });
      }
    },
    onError: (error) => {
      setIsVerifying(false);
      toast.error(error instanceof Error ? error.message : 'NIN verification failed', { 
        id: 'nin-verification' 
      });
    }
  });

  // ============================================================================
  // CAC VERIFICATION
  // ============================================================================

  const cacVerificationMutation = useMutation({
    mutationFn: async (request: CACVerificationRequest): Promise<CACVerificationResponse> => {
      if (!canUseNigerianApis) {
        throw new Error('CAC verification requires a premium subscription');
      }
      return nigerianApiService.verifyCAC(request);
    },
    onMutate: () => {
      setIsVerifying(true);
      toast.loading('Verifying CAC registration...', { id: 'cac-verification' });
    },
    onSuccess: (data) => {
      setIsVerifying(false);
      if (data.status === 'success') {
        toast.success('CAC verification successful!', { id: 'cac-verification' });
        if (user?.id) {
          updateKycProfile({ business_verified: true });
        }
      } else {
        toast.error(data.message, { id: 'cac-verification' });
      }
    },
    onError: (error) => {
      setIsVerifying(false);
      toast.error(error instanceof Error ? error.message : 'CAC verification failed', { 
        id: 'cac-verification' 
      });
    }
  });

  // ============================================================================
  // BANK ACCOUNT VERIFICATION
  // ============================================================================

  const bankVerificationMutation = useMutation({
    mutationFn: async (request: BankAccountVerificationRequest): Promise<BankAccountVerificationResponse> => {
      if (!canUseNigerianApis) {
        throw new Error('Bank verification requires a premium subscription');
      }
      return nigerianApiService.verifyBankAccount(request);
    },
    onMutate: () => {
      setIsVerifying(true);
      toast.loading('Verifying bank account...', { id: 'bank-verification' });
    },
    onSuccess: (data) => {
      setIsVerifying(false);
      if (data.status === 'success') {
        toast.success('Bank account verification successful!', { id: 'bank-verification' });
        if (user?.id) {
          updateKycProfile({ bank_account_verified: true });
        }
      } else {
        toast.error(data.message, { id: 'bank-verification' });
      }
    },
    onError: (error) => {
      setIsVerifying(false);
      toast.error(error instanceof Error ? error.message : 'Bank verification failed', { 
        id: 'bank-verification' 
      });
    }
  });

  // ============================================================================
  // PHONE VERIFICATION
  // ============================================================================

  const phoneVerificationMutation = useMutation({
    mutationFn: async (request: PhoneVerificationRequest): Promise<PhoneVerificationResponse> => {
      if (!canUseNigerianApis) {
        throw new Error('Phone verification requires a premium subscription');
      }
      return nigerianApiService.verifyPhone(request);
    },
    onMutate: () => {
      setIsVerifying(true);
      toast.loading('Verifying phone number...', { id: 'phone-verification' });
    },
    onSuccess: (data) => {
      setIsVerifying(false);
      if (data.status === 'success') {
        toast.success('Phone verification successful!', { id: 'phone-verification' });
        if (user?.id) {
          updateKycProfile({ phone_verified: true });
        }
      } else {
        toast.error(data.message, { id: 'phone-verification' });
      }
    },
    onError: (error) => {
      setIsVerifying(false);
      toast.error(error instanceof Error ? error.message : 'Phone verification failed', { 
        id: 'phone-verification' 
      });
    }
  });

  // ============================================================================
  // UTILITY FUNCTIONS
  // ============================================================================

  const updateKycProfile = useCallback(async (updates: Partial<KYCProfile>) => {
    if (!user?.id) return;

    try {
      const updatedProfile = await nigerianApiService.updateKYCProfile(user.id, updates);
      setKycProfile(updatedProfile);
      queryClient.invalidateQueries({ queryKey: ['kyc-profile', user.id] });
    } catch (error) {
      console.error('Failed to update KYC profile:', error);
    }
  }, [user?.id, queryClient]);

  const getBankByCode = useCallback((code: string): NigerianBank | undefined => {
    return nigerianBanks.find(bank => bank.code === code);
  }, [nigerianBanks]);

  const getBankByName = useCallback((name: string): NigerianBank | undefined => {
    return nigerianBanks.find(bank => 
      bank.name.toLowerCase().includes(name.toLowerCase())
    );
  }, [nigerianBanks]);

  const getVerificationLevel = useCallback((): string => {
    if (!kycProfile) return 'None';
    
    const levels = {
      basic: 'Basic',
      intermediate: 'Intermediate', 
      advanced: 'Advanced',
      premium: 'Premium'
    };
    
    return levels[kycProfile.verification_level] || 'None';
  }, [kycProfile]);

  const getVerificationProgress = useCallback((): number => {
    if (!kycProfile) return 0;
    
    let completed = 0;
    let total = 5;
    
    if (kycProfile.bvn_verified) completed++;
    if (kycProfile.nin_verified) completed++;
    if (kycProfile.phone_verified) completed++;
    if (kycProfile.bank_account_verified) completed++;
    if (kycProfile.business_verified) completed++;
    
    return Math.round((completed / total) * 100);
  }, [kycProfile]);

  const getRiskLevelColor = useCallback((): string => {
    if (!kycProfile) return 'gray';
    
    switch (kycProfile.risk_level) {
      case 'low': return 'green';
      case 'medium': return 'yellow';
      case 'high': return 'red';
      default: return 'gray';
    }
  }, [kycProfile]);

  const canPerformVerification = useCallback((type: VerificationType): boolean => {
    if (!canUseNigerianApis) return false;
    if (!providerStatus) return false;
    
    switch (type) {
      case 'bvn':
      case 'nin':
      case 'phone':
        return providerStatus.youverify;
      case 'cac':
        return providerStatus.appruve;
      case 'bank_account':
        return providerStatus.paystack;
      default:
        return false;
    }
  }, [canUseNigerianApis, providerStatus]);

  const testProviderConnection = useCallback(async (provider: APIProvider): Promise<boolean> => {
    if (!canUseNigerianApis) return false;
    
    try {
      return await nigerianApiService.testConnection(provider);
    } catch (error) {
      console.error(`Failed to test ${provider} connection:`, error);
      return false;
    }
  }, [canUseNigerianApis]);

  // ============================================================================
  // VERIFICATION ACTIONS
  // ============================================================================

  const verifyBVN = useCallback((request: BVNVerificationRequest) => {
    return bvnVerificationMutation.mutateAsync(request);
  }, [bvnVerificationMutation]);

  const verifyNIN = useCallback((request: NINVerificationRequest) => {
    return ninVerificationMutation.mutateAsync(request);
  }, [ninVerificationMutation]);

  const verifyCAC = useCallback((request: CACVerificationRequest) => {
    return cacVerificationMutation.mutateAsync(request);
  }, [cacVerificationMutation]);

  const verifyBankAccount = useCallback((request: BankAccountVerificationRequest) => {
    return bankVerificationMutation.mutateAsync(request);
  }, [bankVerificationMutation]);

  const verifyPhone = useCallback((request: PhoneVerificationRequest) => {
    return phoneVerificationMutation.mutateAsync(request);
  }, [phoneVerificationMutation]);

  // ============================================================================
  // RETURN HOOK INTERFACE
  // ============================================================================

  return {
    // Data
    nigerianBanks,
    kycProfile,
    verificationHistory,
    providerStatus,
    
    // Loading states
    isVerifying,
    isLoadingBanks,
    isLoadingKyc,
    isLoadingProviders,
    
    // Error states
    banksError,
    kycError,
    
    // Verification actions
    verifyBVN,
    verifyNIN,
    verifyCAC,
    verifyBankAccount,
    verifyPhone,
    
    // Utility functions
    getBankByCode,
    getBankByName,
    getVerificationLevel,
    getVerificationProgress,
    getRiskLevelColor,
    canPerformVerification,
    testProviderConnection,
    updateKycProfile,
    refetchKyc,
    
    // Feature access
    canUseNigerianApis,
    
    // Mutation states
    isBvnVerifying: bvnVerificationMutation.isPending,
    isNinVerifying: ninVerificationMutation.isPending,
    isCacVerifying: cacVerificationMutation.isPending,
    isBankVerifying: bankVerificationMutation.isPending,
    isPhoneVerifying: phoneVerificationMutation.isPending,
    
    // Supported types
    supportedVerificationTypes: nigerianApiService.getSupportedVerificationTypes()
  };
};
