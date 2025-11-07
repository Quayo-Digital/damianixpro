import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent } from '@/components/ui/card';
import { Building, Shield, AlertCircle, Search } from 'lucide-react';
import { useNigerianApis } from '@/hooks/useNigerianApis';
import { BankAccountVerificationRequest } from '@/types/nigerianApis';

const bankSchema = z.object({
  account_number: z.string()
    .min(10, 'Account number must be 10 digits')
    .max(10, 'Account number must be 10 digits')
    .regex(/^\d{10}$/, 'Account number must contain only numbers'),
  bank_code: z.string().min(3, 'Please select a bank'),
  account_name: z.string().optional()
});

type BankFormData = z.infer<typeof bankSchema>;

export const BankVerificationForm: React.FC = () => {
  const { 
    verifyBankAccount, 
    isBankVerifying, 
    canPerformVerification,
    nigerianBanks,
    isLoadingBanks
  } = useNigerianApis();
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch
  } = useForm<BankFormData>({
    resolver: zodResolver(bankSchema)
  });

  const selectedBankCode = watch('bank_code');
  const canVerify = canPerformVerification('bank_account');

  const onSubmit = async (data: BankFormData) => {
    try {
      const request: BankAccountVerificationRequest = {
        account_number: data.account_number,
        bank_code: data.bank_code,
        account_name: data.account_name
      };

      await verifyBankAccount(request);
      reset();
    } catch (error) {
      console.error('Bank verification failed:', error);
    }
  };

  if (!canVerify) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Bank account verification service is currently unavailable. Please check your subscription or try again later.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Card>
      <CardContent className="p-6">
        <div className="space-y-6">
          <div className="flex items-center space-x-2 text-blue-600">
            <Building className="h-5 w-5" />
            <h3 className="text-lg font-semibold">Bank Account Verification</h3>
          </div>

          <Alert>
            <Shield className="h-4 w-4" />
            <AlertDescription>
              Verify your bank account details to ensure accurate payment processing and enhance trust with tenants and partners.
            </AlertDescription>
          </Alert>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="bank_code">Bank *</Label>
              {isLoadingBanks ? (
                <div className="h-10 bg-gray-200 rounded animate-pulse"></div>
              ) : (
                <Select
                  value={selectedBankCode}
                  onValueChange={(value) => setValue('bank_code', value)}
                >
                  <SelectTrigger className={errors.bank_code ? 'border-red-500' : ''}>
                    <SelectValue placeholder="Select your bank" />
                  </SelectTrigger>
                  <SelectContent>
                    {nigerianBanks.map((bank) => (
                      <SelectItem key={bank.code} value={bank.code}>
                        {bank.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              {errors.bank_code && (
                <p className="text-sm text-red-600">{errors.bank_code.message}</p>
              )}
              <p className="text-xs text-gray-500">
                Select the bank where your account is domiciled
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="account_number">Account Number *</Label>
              <Input
                id="account_number"
                type="text"
                placeholder="Enter your 10-digit account number"
                maxLength={10}
                {...register('account_number')}
                className={errors.account_number ? 'border-red-500' : ''}
              />
              {errors.account_number && (
                <p className="text-sm text-red-600">{errors.account_number.message}</p>
              )}
              <p className="text-xs text-gray-500">
                Your 10-digit NUBAN account number
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="account_name">Expected Account Name (Optional)</Label>
              <Input
                id="account_name"
                type="text"
                placeholder="Enter the account holder's name"
                {...register('account_name')}
                className={errors.account_name ? 'border-red-500' : ''}
              />
              {errors.account_name && (
                <p className="text-sm text-red-600">{errors.account_name.message}</p>
              )}
              <p className="text-xs text-gray-500">
                Optional: Provide expected account name for additional validation
              </p>
            </div>

            <div className="bg-blue-50 p-3 rounded-lg">
              <div className="flex items-start space-x-2">
                <Search className="h-4 w-4 text-blue-600 mt-0.5" />
                <div className="text-sm text-blue-800">
                  <p className="font-medium">Verification Process:</p>
                  <ul className="mt-1 space-y-1 list-disc list-inside">
                    <li>Account number format validation</li>
                    <li>Bank code verification</li>
                    <li>Account name lookup</li>
                    <li>Account status check</li>
                  </ul>
                </div>
              </div>
            </div>

            <Button 
              type="submit" 
              disabled={isBankVerifying || isLoadingBanks}
              className="w-full"
            >
              {isBankVerifying ? (
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Verifying Account...</span>
                </div>
              ) : (
                <>
                  <Shield className="h-4 w-4 mr-2" />
                  Verify Bank Account
                </>
              )}
            </Button>
          </form>

          <div className="text-xs text-gray-500 space-y-1">
            <p>• Bank verification typically takes 5-15 seconds</p>
            <p>• Only account name is returned, not balance information</p>
            <p>• Verification helps prevent payment errors</p>
            <p>• Account details are not stored after verification</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
