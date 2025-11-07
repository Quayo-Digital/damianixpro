import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent } from '@/components/ui/card';
import { Phone, Shield, AlertCircle, Signal } from 'lucide-react';
import { useNigerianApis } from '@/hooks/useNigerianApis';
import { PhoneVerificationRequest } from '@/types/nigerianApis';

const phoneSchema = z.object({
  phone_number: z.string()
    .regex(/^(\+234|0)[789]\d{9}$/, 'Invalid Nigerian phone number format'),
  country_code: z.string().default('+234')
});

type PhoneFormData = z.infer<typeof phoneSchema>;

export const PhoneVerificationForm: React.FC = () => {
  const { verifyPhone, isPhoneVerifying, canPerformVerification } = useNigerianApis();
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch
  } = useForm<PhoneFormData>({
    resolver: zodResolver(phoneSchema),
    defaultValues: {
      country_code: '+234'
    }
  });

  const phoneNumber = watch('phone_number');
  const canVerify = canPerformVerification('phone');

  const onSubmit = async (data: PhoneFormData) => {
    try {
      // Format phone number to include country code if not present
      let formattedPhone = data.phone_number;
      if (formattedPhone.startsWith('0')) {
        formattedPhone = '+234' + formattedPhone.substring(1);
      } else if (!formattedPhone.startsWith('+234')) {
        formattedPhone = '+234' + formattedPhone;
      }

      const request: PhoneVerificationRequest = {
        phone_number: formattedPhone,
        country_code: data.country_code
      };

      await verifyPhone(request);
      reset();
    } catch (error) {
      console.error('Phone verification failed:', error);
    }
  };

  const formatPhoneDisplay = (phone: string) => {
    if (!phone) return '';
    
    // Remove any non-digit characters except +
    const cleaned = phone.replace(/[^\d+]/g, '');
    
    // Format as +234 XXX XXX XXXX
    if (cleaned.startsWith('+234') && cleaned.length === 14) {
      return cleaned.replace(/(\+234)(\d{3})(\d{3})(\d{4})/, '$1 $2 $3 $4');
    } else if (cleaned.startsWith('0') && cleaned.length === 11) {
      return cleaned.replace(/(\d{4})(\d{3})(\d{4})/, '$1 $2 $3');
    }
    
    return phone;
  };

  if (!canVerify) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Phone verification service is currently unavailable. Please check your subscription or try again later.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Card>
      <CardContent className="p-6">
        <div className="space-y-6">
          <div className="flex items-center space-x-2 text-blue-600">
            <Phone className="h-5 w-5" />
            <h3 className="text-lg font-semibold">Phone Number Verification</h3>
          </div>

          <Alert>
            <Shield className="h-4 w-4" />
            <AlertDescription>
              Verify your phone number to confirm your identity and enable SMS notifications for property management activities.
            </AlertDescription>
          </Alert>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="phone_number">Phone Number *</Label>
              <div className="flex space-x-2">
                <div className="w-20">
                  <Input
                    value="+234"
                    disabled
                    className="text-center bg-gray-50"
                  />
                </div>
                <div className="flex-1">
                  <Input
                    id="phone_number"
                    type="tel"
                    placeholder="8012345678 or 08012345678"
                    {...register('phone_number')}
                    className={errors.phone_number ? 'border-red-500' : ''}
                    onChange={(e) => {
                      const value = e.target.value.replace(/[^\d]/g, '');
                      setValue('phone_number', value);
                    }}
                  />
                </div>
              </div>
              {errors.phone_number && (
                <p className="text-sm text-red-600">{errors.phone_number.message}</p>
              )}
              <p className="text-xs text-gray-500">
                Enter your Nigerian mobile number (MTN, Airtel, Glo, or 9mobile)
              </p>
              
              {phoneNumber && (
                <div className="text-sm text-blue-600">
                  <strong>Formatted:</strong> {formatPhoneDisplay(phoneNumber)}
                </div>
              )}
            </div>

            <div className="bg-green-50 p-3 rounded-lg">
              <div className="flex items-start space-x-2">
                <Signal className="h-4 w-4 text-green-600 mt-0.5" />
                <div className="text-sm text-green-800">
                  <p className="font-medium">Verification Details:</p>
                  <ul className="mt-1 space-y-1 list-disc list-inside">
                    <li>Network provider identification</li>
                    <li>Line type (mobile/landline)</li>
                    <li>Number portability status</li>
                    <li>Do Not Disturb (DND) status</li>
                    <li>Registration location</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="bg-yellow-50 p-3 rounded-lg">
              <p className="text-sm text-yellow-800">
                <strong>Supported Networks:</strong> MTN, Airtel, Glo, 9mobile. 
                Landline numbers and some virtual numbers may not be supported.
              </p>
            </div>

            <Button 
              type="submit" 
              disabled={isPhoneVerifying}
              className="w-full"
            >
              {isPhoneVerifying ? (
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Verifying Phone...</span>
                </div>
              ) : (
                <>
                  <Shield className="h-4 w-4 mr-2" />
                  Verify Phone Number
                </>
              )}
            </Button>
          </form>

          <div className="text-xs text-gray-500 space-y-1">
            <p>• Phone verification typically takes 5-15 seconds</p>
            <p>• No SMS or calls are made during verification</p>
            <p>• Only network and registration data is retrieved</p>
            <p>• Your phone number is not stored after verification</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
