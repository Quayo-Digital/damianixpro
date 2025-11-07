import { toast } from "@/components/ui/sonner";
import { supabase } from "@/integrations/supabase/client";

// Paystack integration implementation 
export interface PaystackResponse {
  reference: string;
  status: 'success' | 'failed';
  message?: string;
  transaction?: any;
}

interface PaystackConfig {
  key: string;
  email: string;
  amount: number;
  currency:string;
  ref?: string;
  label?: string;
  plan?: string;
  metadata?: Record<string, any>;
  onSuccess: (response: PaystackResponse) => void;
  onCancel: () => void;
}

interface PaystackWindow extends Window {
  PaystackPop?: {
    setup: (config: PaystackConfig) => {
      openIframe: () => void;
    };
  };
}

declare var window: PaystackWindow;

// Load Paystack script
const loadPaystackScript = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://js.paystack.co/v1/inline.js';
    script.async = true;
    
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load Paystack script'));
    
    document.head.appendChild(script);
  });
};

export const initializePayment = async (
  config: Omit<PaystackConfig, 'key'>
): Promise<void> => {
  try {
    await loadPaystackScript();
    
    if (!window.PaystackPop) {
      throw new Error('Paystack script not loaded correctly');
    }

    // IMPORTANT: Replace with your actual Paystack public key.
    // It is safe to include this in client-side code.
    const PUBLIC_KEY = 'pk_test_6dc598b270305802659725aaaf80459c9977efc3';
    
    const paystackConfig: PaystackConfig = {
      ...config,
      key: "pk_test_6dc598b270305802659725aaaf80459c9977efc3",
      currency: config.currency || 'NGN',
      ref: config.ref || `REF-${Date.now()}`,
    };
    
    const paystack = window.PaystackPop.setup(paystackConfig);
    paystack.openIframe();
  } catch (error) {
    console.error('Paystack initialization error:', error);
    toast.error('Payment gateway initialization failed');
    config.onCancel();
  }
};

// Function to handle recurring payment setup
export const createPaystackPlan = async (
  name: string,
  interval: 'monthly' | 'quarterly' | 'annually',
  amount: number // amount in kobo
): Promise<{ success: boolean; planCode?: string; message?: string }> => {
  try {
    const { data, error } = await supabase.functions.invoke('paystack-create-plan', {
      body: { name, interval, amount },
    });

    if (error) throw error;
    
    if (!data.success) {
      throw new Error(data.message || 'Failed to create plan on Paystack.');
    }

    return { success: true, planCode: data.planCode };
  } catch (error) {
    console.error('Error creating Paystack plan:', error);
    return { success: false, message: error instanceof Error ? error.message : 'An unknown error occurred.' };
  }
};
