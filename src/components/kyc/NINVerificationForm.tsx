import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent } from '@/components/ui/card';
import { User, Shield, AlertCircle } from 'lucide-react';
import { useNigerianApis } from '@/hooks/useNigerianApis';
import { NINVerificationRequest } from '@/types/nigerianApis';
import { logger } from '@/utils/logger';

const ninSchema = z.object({
  nin: z
    .string()
    .min(11, 'NIN must be 11 digits')
    .max(11, 'NIN must be 11 digits')
    .regex(/^\d{11}$/, 'NIN must contain only numbers'),
  first_name: z.string().min(2, 'First name is required').optional(),
  last_name: z.string().min(2, 'Last name is required').optional(),
  date_of_birth: z.string().optional(),
});

type NINFormData = z.infer<typeof ninSchema>;

export const NINVerificationForm: React.FC = () => {
  const { verifyNIN, isNinVerifying, canPerformVerification, getVerificationUnavailableReason } =
    useNigerianApis();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<NINFormData>({
    resolver: zodResolver(ninSchema),
  });

  const canVerify = canPerformVerification('nin');

  const onSubmit = async (data: NINFormData) => {
    try {
      const request: NINVerificationRequest = {
        nin: data.nin,
        first_name: data.first_name,
        last_name: data.last_name,
        date_of_birth: data.date_of_birth,
      };

      await verifyNIN(request);
      reset();
    } catch (error) {
      logger.error('NIN verification failed', error);
    }
  };

  if (!canVerify) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{getVerificationUnavailableReason('nin')}</AlertDescription>
      </Alert>
    );
  }

  return (
    <Card>
      <CardContent className="p-6">
        <div className="space-y-6">
          <div className="flex items-center space-x-2 text-blue-600">
            <User className="h-5 w-5" />
            <h3 className="text-lg font-semibold">National Identification Number (NIN)</h3>
          </div>

          <Alert>
            <Shield className="h-4 w-4" />
            <AlertDescription>
              Your NIN is used to verify your identity with the National Identity Management
              Commission (NIMC). All information is processed securely.
            </AlertDescription>
          </Alert>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nin">National Identification Number (NIN) *</Label>
              <Input
                id="nin"
                type="text"
                placeholder="Enter your 11-digit NIN"
                maxLength={11}
                {...register('nin')}
                className={errors.nin ? 'border-red-500' : ''}
              />
              {errors.nin && <p className="text-sm text-red-600">{errors.nin.message}</p>}
              <p className="text-xs text-gray-500">
                Your NIN can be found on your National ID card or by visiting a NIMC enrollment
                center
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
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
              <p className="text-xs text-gray-500">
                Providing your date of birth helps improve verification accuracy
              </p>
            </div>

            <div className="rounded-lg bg-blue-50 p-3">
              <p className="text-sm text-blue-800">
                <strong>About NIN Verification:</strong> The NIN is Nigeria's unique identifier for
                all citizens and legal residents. It contains biometric and demographic data linked
                to your identity.
              </p>
            </div>

            <Button type="submit" disabled={isNinVerifying} className="w-full">
              {isNinVerifying ? (
                <div className="flex items-center space-x-2">
                  <div className="h-4 w-4 animate-spin rounded-full border-b-2 border-primary-foreground"></div>
                  <span>Verifying NIN...</span>
                </div>
              ) : (
                <>
                  <Shield className="mr-2 h-4 w-4" />
                  Verify NIN
                </>
              )}
            </Button>
          </form>

          <div className="space-y-1 text-xs text-gray-500">
            <p>• NIN verification typically takes 15-45 seconds</p>
            <p>• Your NIN information is processed securely through NIMC</p>
            <p>• Verification results are cached for 30 days</p>
            <p>• Ensure your NIN is active and not blocked</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
