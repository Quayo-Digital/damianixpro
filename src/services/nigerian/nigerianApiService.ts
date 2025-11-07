// Nigerian API Integration Service
// Handles integrations with Nigerian banks, government services, and verification APIs

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
  CreditReportRequest,
  CreditReportResponse,
  LandRegistryRequest,
  LandRegistryResponse,
  PaystackTransferRequest,
  PaystackTransferResponse,
  FlutterwaveTransferRequest,
  FlutterwaveTransferResponse,
  NigerianBank,
  APIConfiguration,
  APIProviderConfig,
  VerificationRecord,
  KYCProfile,
  APIError,
  VerificationType,
  APIProvider
} from '@/types/nigerianApis';

class NigerianAPIService {
  private static instance: NigerianAPIService;
  private config: APIProviderConfig;
  private nigerianBanks: NigerianBank[] = [];

  private constructor() {
    this.config = this.loadConfiguration();
    this.initializeBanksList();
  }

  public static getInstance(): NigerianAPIService {
    if (!NigerianAPIService.instance) {
      NigerianAPIService.instance = new NigerianAPIService();
    }
    return NigerianAPIService.instance;
  }

  // ============================================================================
  // CONFIGURATION MANAGEMENT
  // ============================================================================

  private loadConfiguration(): APIProviderConfig {
    return {
      bvn_verification: {
        provider: 'youverify',
        api_key: import.meta.env.VITE_YOUVERIFY_API_KEY || '',
        base_url: import.meta.env.VITE_YOUVERIFY_BASE_URL || 'https://api.youverify.co/v2',
        sandbox_mode: import.meta.env.MODE !== 'production',
        rate_limit: {
          requests_per_minute: 60,
          requests_per_hour: 1000,
          requests_per_day: 10000
        }
      },
      nin_verification: {
        provider: 'youverify',
        api_key: import.meta.env.VITE_YOUVERIFY_API_KEY || '',
        base_url: import.meta.env.VITE_YOUVERIFY_BASE_URL || 'https://api.youverify.co/v2',
        sandbox_mode: import.meta.env.MODE !== 'production'
      },
      cac_verification: {
        provider: 'appruve',
        api_key: import.meta.env.VITE_APPRUVE_API_KEY || '',
        base_url: import.meta.env.VITE_APPRUVE_BASE_URL || 'https://api.appruve.co/v1',
        sandbox_mode: import.meta.env.MODE !== 'production'
      },
      bank_verification: {
        provider: 'paystack',
        api_key: import.meta.env.VITE_PAYSTACK_SECRET_KEY || '',
        base_url: import.meta.env.VITE_PAYSTACK_BASE_URL || 'https://api.paystack.co',
        sandbox_mode: import.meta.env.MODE !== 'production'
      },
      phone_verification: {
        provider: 'youverify',
        api_key: import.meta.env.VITE_YOUVERIFY_API_KEY || '',
        base_url: import.meta.env.VITE_YOUVERIFY_BASE_URL || 'https://api.youverify.co/v2',
        sandbox_mode: import.meta.env.MODE !== 'production'
      },
      payment_transfer: {
        provider: 'paystack',
        api_key: import.meta.env.VITE_PAYSTACK_SECRET_KEY || '',
        secret_key: import.meta.env.VITE_PAYSTACK_SECRET_KEY || '',
        base_url: import.meta.env.VITE_PAYSTACK_BASE_URL || 'https://api.paystack.co',
        sandbox_mode: import.meta.env.MODE !== 'production'
      }
    };
  }

  public updateConfiguration(config: Partial<APIProviderConfig>): void {
    this.config = { ...this.config, ...config };
  }

  // ============================================================================
  // NIGERIAN BANKS DATA
  // ============================================================================

  private async initializeBanksList(): Promise<void> {
    try {
      // Load Nigerian banks data from GitHub API or local cache
      const response = await fetch('https://api.github.com/repos/ichtrojan/nigerian-banks/contents/banks.json');
      if (response.ok) {
        const data = await response.json();
        const banksData = JSON.parse(atob(data.content));
        this.nigerianBanks = banksData;
      } else {
        // Fallback to hardcoded major Nigerian banks
        this.nigerianBanks = this.getFallbackBanksList();
      }
    } catch (error) {
      console.warn('Failed to load banks list from API, using fallback:', error);
      this.nigerianBanks = this.getFallbackBanksList();
    }
  }

  private getFallbackBanksList(): NigerianBank[] {
    return [
      {
        id: 1,
        name: "Access Bank",
        slug: "access-bank",
        code: "044",
        longcode: "044150149",
        gateway: "emandate",
        pay_with_bank: true,
        active: true,
        country: "Nigeria",
        currency: "NGN",
        type: "nuban",
        is_deleted: false
      },
      {
        id: 2,
        name: "Guaranty Trust Bank",
        slug: "guaranty-trust-bank",
        code: "058",
        longcode: "058152036",
        gateway: "emandate",
        pay_with_bank: true,
        active: true,
        country: "Nigeria",
        currency: "NGN",
        type: "nuban",
        is_deleted: false
      },
      {
        id: 3,
        name: "First Bank of Nigeria",
        slug: "first-bank-of-nigeria",
        code: "011",
        longcode: "011151003",
        gateway: "emandate",
        pay_with_bank: true,
        active: true,
        country: "Nigeria",
        currency: "NGN",
        type: "nuban",
        is_deleted: false
      },
      {
        id: 4,
        name: "United Bank for Africa",
        slug: "united-bank-for-africa",
        code: "033",
        longcode: "033153513",
        gateway: "emandate",
        pay_with_bank: true,
        active: true,
        country: "Nigeria",
        currency: "NGN",
        type: "nuban",
        is_deleted: false
      },
      {
        id: 5,
        name: "Zenith Bank",
        slug: "zenith-bank",
        code: "057",
        longcode: "057150013",
        gateway: "emandate",
        pay_with_bank: true,
        active: true,
        country: "Nigeria",
        currency: "NGN",
        type: "nuban",
        is_deleted: false
      }
    ];
  }

  public getNigerianBanks(): NigerianBank[] {
    return this.nigerianBanks;
  }

  public getBankByCode(code: string): NigerianBank | undefined {
    return this.nigerianBanks.find(bank => bank.code === code);
  }

  public getBankByName(name: string): NigerianBank | undefined {
    return this.nigerianBanks.find(bank => 
      bank.name.toLowerCase().includes(name.toLowerCase())
    );
  }

  // ============================================================================
  // HTTP CLIENT UTILITIES
  // ============================================================================

  private async makeRequest<T>(
    config: APIConfiguration,
    endpoint: string,
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'POST',
    data?: any,
    headers?: Record<string, string>
  ): Promise<T> {
    const url = `${config.base_url}${endpoint}`;
    
    const defaultHeaders = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${config.api_key}`,
      ...headers
    };

    try {
      const response = await fetch(url, {
        method,
        headers: defaultHeaders,
        body: data ? JSON.stringify(data) : undefined
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new APIError({
          code: `HTTP_${response.status}`,
          message: errorData.message || `HTTP ${response.status}: ${response.statusText}`,
          details: errorData,
          provider: config.provider,
          timestamp: new Date().toISOString()
        });
      }

      return await response.json();
    } catch (error) {
      if (error instanceof APIError) {
        throw error;
      }
      
      throw new APIError({
        code: 'NETWORK_ERROR',
        message: error instanceof Error ? error.message : 'Network request failed',
        provider: config.provider,
        timestamp: new Date().toISOString()
      });
    }
  }

  // ============================================================================
  // BVN VERIFICATION
  // ============================================================================

  public async verifyBVN(request: BVNVerificationRequest): Promise<BVNVerificationResponse> {
    const config = this.config.bvn_verification;
    if (!config) {
      throw new Error('BVN verification not configured');
    }

    try {
      const response = await this.makeRequest<any>(
        config,
        '/identities/ng/bvn',
        'POST',
        {
          id: request.bvn,
          isSubjectConsent: true,
          validations: {
            data: {
              firstName: request.first_name,
              lastName: request.last_name,
              dateOfBirth: request.date_of_birth,
              phoneNumber: request.phone_number
            }
          }
        }
      );

      return {
        status: response.success ? 'success' : 'failed',
        message: response.message || 'BVN verification completed',
        data: response.data ? {
          bvn: response.data.bvn,
          first_name: response.data.firstName,
          middle_name: response.data.middleName || '',
          last_name: response.data.lastName,
          date_of_birth: response.data.dateOfBirth,
          phone_number: response.data.phoneNumber,
          gender: response.data.gender,
          email: response.data.email,
          enrollment_bank: response.data.enrollmentBank,
          enrollment_branch: response.data.enrollmentBranch,
          watch_listed: response.data.watchListed || false,
          nationality: response.data.nationality || 'Nigerian',
          marital_status: response.data.maritalStatus,
          state_of_origin: response.data.stateOfOrigin,
          lga_of_origin: response.data.lgaOfOrigin,
          state_of_residence: response.data.stateOfResidence,
          lga_of_residence: response.data.lgaOfResidence,
          residential_address: response.data.residentialAddress,
          image_base64: response.data.image
        } : undefined,
        confidence_score: response.confidence || 0,
        verification_id: response.id || this.generateVerificationId()
      };
    } catch (error) {
      console.error('BVN verification failed:', error);
      return {
        status: 'failed',
        message: error instanceof Error ? error.message : 'BVN verification failed',
        verification_id: this.generateVerificationId()
      };
    }
  }

  // ============================================================================
  // NIN VERIFICATION
  // ============================================================================

  public async verifyNIN(request: NINVerificationRequest): Promise<NINVerificationResponse> {
    const config = this.config.nin_verification;
    if (!config) {
      throw new Error('NIN verification not configured');
    }

    try {
      const response = await this.makeRequest<any>(
        config,
        '/identities/ng/nin',
        'POST',
        {
          id: request.nin,
          isSubjectConsent: true,
          validations: {
            data: {
              firstName: request.first_name,
              lastName: request.last_name,
              dateOfBirth: request.date_of_birth
            }
          }
        }
      );

      return {
        status: response.success ? 'success' : 'failed',
        message: response.message || 'NIN verification completed',
        data: response.data ? {
          nin: response.data.nin,
          first_name: response.data.firstName,
          middle_name: response.data.middleName || '',
          last_name: response.data.lastName,
          date_of_birth: response.data.dateOfBirth,
          phone_number: response.data.phoneNumber,
          gender: response.data.gender,
          email: response.data.email,
          nationality: response.data.nationality || 'Nigerian',
          state_of_origin: response.data.stateOfOrigin,
          lga_of_origin: response.data.lgaOfOrigin,
          state_of_residence: response.data.stateOfResidence,
          lga_of_residence: response.data.lgaOfResidence,
          residential_address: response.data.residentialAddress,
          profession: response.data.profession,
          religion: response.data.religion,
          marital_status: response.data.maritalStatus,
          educational_level: response.data.educationalLevel,
          employment_status: response.data.employmentStatus,
          image_base64: response.data.image
        } : undefined,
        confidence_score: response.confidence || 0,
        verification_id: response.id || this.generateVerificationId()
      };
    } catch (error) {
      console.error('NIN verification failed:', error);
      return {
        status: 'failed',
        message: error instanceof Error ? error.message : 'NIN verification failed',
        verification_id: this.generateVerificationId()
      };
    }
  }

  // ============================================================================
  // CAC VERIFICATION
  // ============================================================================

  public async verifyCAC(request: CACVerificationRequest): Promise<CACVerificationResponse> {
    const config = this.config.cac_verification;
    if (!config) {
      throw new Error('CAC verification not configured');
    }

    try {
      const response = await this.makeRequest<any>(
        config,
        '/verifications/ng/business_info',
        'POST',
        {
          search_term: request.search_term
        }
      );

      return {
        status: response.company_name ? 'success' : 'failed',
        message: response.company_name ? 'CAC verification completed' : 'Company not found',
        data: response.company_name ? {
          company_id: response.company_id,
          company_name: response.company_name,
          company_status: response.company_status,
          company_registration: response.company_registration,
          company_commencement_date: response.company_commencement_date,
          company_type_info: response.company_type_info,
          company_email: response.company_email,
          company_address: response.company_address,
          directors: response.directors || [],
          shareholders: response.shareholders || [],
          annual_returns_status: response.annual_returns_status,
          last_annual_return_date: response.last_annual_return_date
        } : undefined,
        verification_id: this.generateVerificationId()
      };
    } catch (error) {
      console.error('CAC verification failed:', error);
      return {
        status: 'failed',
        message: error instanceof Error ? error.message : 'CAC verification failed',
        verification_id: this.generateVerificationId()
      };
    }
  }

  // ============================================================================
  // BANK ACCOUNT VERIFICATION
  // ============================================================================

  public async verifyBankAccount(request: BankAccountVerificationRequest): Promise<BankAccountVerificationResponse> {
    const config = this.config.bank_verification;
    if (!config) {
      throw new Error('Bank verification not configured');
    }

    try {
      const response = await this.makeRequest<any>(
        config,
        '/bank/resolve',
        'GET',
        undefined,
        {
          'Authorization': `Bearer ${config.api_key}`
        }
      );

      // For Paystack, we need to make a GET request with query parameters
      const url = `${config.base_url}/bank/resolve?account_number=${request.account_number}&bank_code=${request.bank_code}`;
      const bankResponse = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${config.api_key}`
        }
      });

      const bankData = await bankResponse.json();

      if (bankData.status) {
        const bank = this.getBankByCode(request.bank_code);
        
        return {
          status: 'success',
          message: 'Bank account verification completed',
          data: {
            account_number: request.account_number,
            account_name: bankData.data.account_name,
            bank_name: bank?.name || 'Unknown Bank',
            bank_code: request.bank_code,
            account_type: 'SAVINGS', // Default, as Paystack doesn't provide this
            account_status: 'ACTIVE', // Default, as Paystack doesn't provide this
            currency: 'NGN'
          },
          verification_id: this.generateVerificationId()
        };
      } else {
        return {
          status: 'failed',
          message: bankData.message || 'Bank account verification failed',
          verification_id: this.generateVerificationId()
        };
      }
    } catch (error) {
      console.error('Bank account verification failed:', error);
      return {
        status: 'failed',
        message: error instanceof Error ? error.message : 'Bank account verification failed',
        verification_id: this.generateVerificationId()
      };
    }
  }

  // ============================================================================
  // PHONE VERIFICATION
  // ============================================================================

  public async verifyPhone(request: PhoneVerificationRequest): Promise<PhoneVerificationResponse> {
    const config = this.config.phone_verification;
    if (!config) {
      throw new Error('Phone verification not configured');
    }

    try {
      const response = await this.makeRequest<any>(
        config,
        '/identities/ng/phone',
        'POST',
        {
          id: request.phone_number,
          isSubjectConsent: true
        }
      );

      return {
        status: response.success ? 'success' : 'failed',
        message: response.message || 'Phone verification completed',
        data: response.data ? {
          phone_number: response.data.phoneNumber,
          network_provider: response.data.networkProvider,
          line_type: response.data.lineType || 'MOBILE',
          status: response.data.status || 'ACTIVE',
          ported: response.data.ported || false,
          dnd_status: response.data.dndStatus || false,
          state_of_registration: response.data.stateOfRegistration,
          lga_of_registration: response.data.lgaOfRegistration
        } : undefined,
        verification_id: response.id || this.generateVerificationId()
      };
    } catch (error) {
      console.error('Phone verification failed:', error);
      return {
        status: 'failed',
        message: error instanceof Error ? error.message : 'Phone verification failed',
        verification_id: this.generateVerificationId()
      };
    }
  }

  // ============================================================================
  // PAYMENT TRANSFERS
  // ============================================================================

  public async initiatePaystackTransfer(request: PaystackTransferRequest): Promise<PaystackTransferResponse> {
    const config = this.config.payment_transfer;
    if (!config || config.provider !== 'paystack') {
      throw new Error('Paystack transfer not configured');
    }

    try {
      const response = await this.makeRequest<PaystackTransferResponse>(
        config,
        '/transfer',
        'POST',
        request
      );

      return response;
    } catch (error) {
      console.error('Paystack transfer failed:', error);
      throw error;
    }
  }

  public async initiateFlutterwaveTransfer(request: FlutterwaveTransferRequest): Promise<FlutterwaveTransferResponse> {
    const config = this.config.payment_transfer;
    if (!config) {
      throw new Error('Flutterwave transfer not configured');
    }

    try {
      // Note: This would require Flutterwave configuration
      const response = await this.makeRequest<FlutterwaveTransferResponse>(
        {
          ...config,
          provider: 'flutterwave',
          base_url: import.meta.env.VITE_FLUTTERWAVE_BASE_URL || 'https://api.flutterwave.com/v3'
        },
        '/transfers',
        'POST',
        request
      );

      return response;
    } catch (error) {
      console.error('Flutterwave transfer failed:', error);
      throw error;
    }
  }

  // ============================================================================
  // KYC PROFILE MANAGEMENT
  // ============================================================================

  public async getKYCProfile(userId: string): Promise<KYCProfile | null> {
    // This would typically fetch from your database
    // For now, return a mock profile
    return {
      user_id: userId,
      bvn_verified: false,
      nin_verified: false,
      phone_verified: false,
      bank_account_verified: false,
      business_verified: false,
      verification_level: 'basic',
      risk_score: 50,
      risk_level: 'medium',
      last_updated: new Date().toISOString(),
      verification_records: []
    };
  }

  public async updateKYCProfile(userId: string, updates: Partial<KYCProfile>): Promise<KYCProfile> {
    // This would typically update your database
    const currentProfile = await this.getKYCProfile(userId);
    if (!currentProfile) {
      throw new Error('KYC profile not found');
    }

    const updatedProfile = {
      ...currentProfile,
      ...updates,
      last_updated: new Date().toISOString()
    };

    // Calculate verification level based on completed verifications
    updatedProfile.verification_level = this.calculateVerificationLevel(updatedProfile);
    updatedProfile.risk_score = this.calculateRiskScore(updatedProfile);
    updatedProfile.risk_level = this.calculateRiskLevel(updatedProfile.risk_score);

    return updatedProfile;
  }

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  private generateVerificationId(): string {
    return `ver_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private calculateVerificationLevel(profile: KYCProfile): 'basic' | 'intermediate' | 'advanced' | 'premium' {
    let score = 0;
    if (profile.bvn_verified) score += 25;
    if (profile.nin_verified) score += 25;
    if (profile.phone_verified) score += 15;
    if (profile.bank_account_verified) score += 20;
    if (profile.business_verified) score += 15;

    if (score >= 80) return 'premium';
    if (score >= 60) return 'advanced';
    if (score >= 40) return 'intermediate';
    return 'basic';
  }

  private calculateRiskScore(profile: KYCProfile): number {
    let risk = 100; // Start with high risk
    
    if (profile.bvn_verified) risk -= 30;
    if (profile.nin_verified) risk -= 25;
    if (profile.phone_verified) risk -= 15;
    if (profile.bank_account_verified) risk -= 20;
    if (profile.business_verified) risk -= 10;

    return Math.max(0, Math.min(100, risk));
  }

  private calculateRiskLevel(riskScore: number): 'low' | 'medium' | 'high' {
    if (riskScore <= 30) return 'low';
    if (riskScore <= 70) return 'medium';
    return 'high';
  }

  // ============================================================================
  // SANDBOX/TESTING METHODS
  // ============================================================================

  public async testConnection(provider: APIProvider): Promise<boolean> {
    try {
      const config = this.getConfigForProvider(provider);
      if (!config) return false;

      // Make a simple test request
      await this.makeRequest(config, '/test', 'GET');
      return true;
    } catch (error) {
      console.error(`Test connection failed for ${provider}:`, error);
      return false;
    }
  }

  private getConfigForProvider(provider: APIProvider): APIConfiguration | undefined {
    switch (provider) {
      case 'youverify':
        return this.config.bvn_verification;
      case 'appruve':
        return this.config.cac_verification;
      case 'paystack':
        return this.config.payment_transfer;
      default:
        return undefined;
    }
  }

  public getSupportedVerificationTypes(): VerificationType[] {
    return ['bvn', 'nin', 'cac', 'bank_account', 'phone'];
  }

  public getProviderStatus(): Record<APIProvider, boolean> {
    return {
      youverify: !!this.config.bvn_verification?.api_key,
      appruve: !!this.config.cac_verification?.api_key,
      paystack: !!this.config.payment_transfer?.api_key,
      flutterwave: !!import.meta.env.VITE_FLUTTERWAVE_SECRET_KEY,
      nibss: false, // Not implemented yet
      custom: false
    };
  }
}

// Export singleton instance
export const nigerianApiService = NigerianAPIService.getInstance();
export default NigerianAPIService;
