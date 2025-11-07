import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent } from '@/components/ui/card';
import { CreditCard, Shield, AlertCircle } from 'lucide-react';
import { useNigerianApis } from '@/hooks/useNigerianApis';
import { BVNVerificationRequest } from '@/types/nigerianApis';

const bvnSchema = z.object({
  bvn: z.string()
    .min(11, 'BVN must be 11 digits')
    .max(11, 'BVN must be 11 digits')
    .regex(/^\d{11}$/, 'BVN must contain only numbers'),
  first_name: z.string().min(2, 'First name is required').optional(),
  last_name: z.string().min(2, 'Last name is required').optional(),
  date_of_birth: z.string().optional(),
  phone_number: z.string()
    .regex(/^(\+234|0)[789]\d{9}$/, 'Invalid Nigerian phone number')
    .optional()
});

type BVNFormData = z.infer<typeof bvnSchema>;

export const BVNVerificationForm: React.FC = () => {
  const { verifyBVN, isBvnVerifying, canPerformVerification } = useNigerianApis();
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset
  } = useForm<BVNFormData>({
    resolver: zodResolver(bvnSchema)
  });

  const canVerify = canPerformVerification('bvn');

  const onSubmit = async (data: BVNFormData) => {
    try {
      const request: BVNVerificationRequest = {
        bvn: data.bvn,
        first_name: data.first_name,
        last_name: data.last_name,
        date_of_birth: data.date_of_birth,
        phone_number: data.phone_number
      };

      await verifyBVN(request);
      reset();
    } catch (error) {
      console.error('BVN verification failed:', error);
    }
  };

  if (!canVerify) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          BVN verification service is currently unavailable. Please check your subscription or try again later.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Card>
      <CardContent className="p-6">
        <div className="space-y-6">
          <div className="flex items-center space-x-2 text-blue-600">
            <CreditCard className="h-5 w-5" />
            <h3 className="text-lg font-semibold">Bank Verification Number (BVN)</h3>
          </div>

          <Alert>
            <Shield className="h-4 w-4" />
            <AlertDescription>
              Your BVN is used to verify your identity. All information is encrypted and processed securely according to Nigerian banking regulations.
            </AlertDescription>
          </Alert>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="bvn">Bank Verification Number (BVN) *</Label>
              <Input
                id="bvn"
                type="text"
                placeholder="Enter your 11-digit BVN"
                maxLength={11}
                {...register('bvn')}
                className={errors.bvn ? 'border-red-500' : ''}
              />
              {errors.bvn && (
                <p className="text-sm text-red-600">{errors.bvn.message}</p>
              )}
              <p className="text-xs text-gray-500">
                Your BVN can be found on your bank statement or by dialing *565*0# on your registered phone number
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="first_name">First Name (Optional)</Label>
                <Input
                  id="first_name"
                  type="text"
                  placeholder="Enter your first name"
                  {...register('first_name')}
                  className={errors.first_name ? 'border-red-500' : ''}
                />
                {errors.first_name && (
                  <p className="text-sm text-red-600">{errors.first_name.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="last_name">Last Name (Optional)</Label>
                <Input
                  id="last_name"
                  type="text"
                  placeholder="Enter your last name"
                  {...register('last_name')}
                  className={errors.last_name ? 'border-red-500' : ''}
                />
                {errors.last_name && (
                  <p className="text-sm text-red-600">{errors.last_name.message}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="date_of_birth">Date of Birth (Optional)</Label>
                <Input
                  id="date_of_birth"
                  type="date"
                  {...register('date_of_birth')}
                  className={errors.date_of_birth ? 'border-red-500' : ''}
                />
                {errors.date_of_birth && (
                  <p className="text-sm text-red-600">{errors.date_of_birth.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone_number">Phone Number (Optional)</Label>
                <Input
                  id="phone_number"
                  type="tel"
                  placeholder="+234 or 0 followed by 10 digits"
                  {...register('phone_number')}
                  className={errors.phone_number ? 'border-red-500' : ''}
                />
                {errors.phone_number && (
                  <p className="text-sm text-red-600">{errors.phone_number.message}</p>
                )}
              </div>
            </div>

            <div className="bg-yellow-50 p-3 rounded-lg">
              <p className="text-sm text-yellow-800">
                <strong>Note:</strong> Providing additional information (name, date of birth, phone) helps improve verification accuracy and may be required for some verification levels.
              </p>
            </div>

            <Button 
              type="submit" 
              disabled={isBvnVerifying}
              className="w-full"
            >
              {isBvnVerifying ? (
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Verifying BVN...</span>
                </div>
              ) : (
                <>
                  <Shield className="h-4 w-4 mr-2" />
                  Verify BVN
                </>
              )}
            </Button>
          </form>

          <div className="text-xs text-gray-500 space-y-1">
            <p>• BVN verification typically takes 10-30 seconds</p>
            <p>• Your BVN information is processed securely and not stored</p>
            <p>• Verification results are cached for 30 days</p>
            <p>• Contact support if you encounter any issues</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
