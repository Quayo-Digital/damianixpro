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
import { FileText, Shield, AlertCircle, Building } from 'lucide-react';
import { useNigerianApis } from '@/hooks/useNigerianApis';
import { CACVerificationRequest } from '@/types/nigerianApis';

const cacSchema = z.object({
  search_term: z.string().min(2, 'Search term is required'),
  search_type: z.enum(['rc_number', 'company_name', 'business_name'])
});

type CACFormData = z.infer<typeof cacSchema>;

export const CACVerificationForm: React.FC = () => {
  const { verifyCAC, isCacVerifying, canPerformVerification } = useNigerianApis();
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch
  } = useForm<CACFormData>({
    resolver: zodResolver(cacSchema),
    defaultValues: {
      search_type: 'rc_number'
    }
  });

  const searchType = watch('search_type');
  const canVerify = canPerformVerification('cac');

  const onSubmit = async (data: CACFormData) => {
    try {
      const request: CACVerificationRequest = {
        search_term: data.search_term,
        search_type: data.search_type
      };

      await verifyCAC(request);
      reset();
    } catch (error) {
      console.error('CAC verification failed:', error);
    }
  };

  const getPlaceholderText = () => {
    switch (searchType) {
      case 'rc_number':
        return 'Enter RC number (e.g., RC123456)';
      case 'company_name':
        return 'Enter company name';
      case 'business_name':
        return 'Enter business name';
      default:
        return 'Enter search term';
    }
  };

  if (!canVerify) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          CAC verification service is currently unavailable. Please check your subscription or try again later.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Card>
      <CardContent className="p-6">
        <div className="space-y-6">
          <div className="flex items-center space-x-2 text-blue-600">
            <FileText className="h-5 w-5" />
            <h3 className="text-lg font-semibold">Corporate Affairs Commission (CAC) Verification</h3>
          </div>

          <Alert>
            <Shield className="h-4 w-4" />
            <AlertDescription>
              Verify business registration with the Corporate Affairs Commission. This helps confirm the legitimacy of business entities.
            </AlertDescription>
          </Alert>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="search_type">Search Type *</Label>
              <Select
                value={searchType}
                onValueChange={(value: 'rc_number' | 'company_name' | 'business_name') => 
                  setValue('search_type', value)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select search type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="rc_number">RC Number</SelectItem>
                  <SelectItem value="company_name">Company Name</SelectItem>
                  <SelectItem value="business_name">Business Name</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500">
                Choose how you want to search for the business registration
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="search_term">
                {searchType === 'rc_number' && 'RC Number *'}
                {searchType === 'company_name' && 'Company Name *'}
                {searchType === 'business_name' && 'Business Name *'}
              </Label>
              <Input
                id="search_term"
                type="text"
                placeholder={getPlaceholderText()}
                {...register('search_term')}
                className={errors.search_term ? 'border-red-500' : ''}
              />
              {errors.search_term && (
                <p className="text-sm text-red-600">{errors.search_term.message}</p>
              )}
              
              {searchType === 'rc_number' && (
                <p className="text-xs text-gray-500">
                  RC numbers typically start with "RC" followed by digits (e.g., RC123456)
                </p>
              )}
              
              {searchType === 'company_name' && (
                <p className="text-xs text-gray-500">
                  Enter the full registered company name as it appears on CAC documents
                </p>
              )}
              
              {searchType === 'business_name' && (
                <p className="text-xs text-gray-500">
                  Enter the business name for sole proprietorships or partnerships
                </p>
              )}
            </div>

            <div className="bg-green-50 p-3 rounded-lg">
              <div className="flex items-start space-x-2">
                <Building className="h-4 w-4 text-green-600 mt-0.5" />
                <div className="text-sm text-green-800">
                  <p className="font-medium">What you'll get:</p>
                  <ul className="mt-1 space-y-1 list-disc list-inside">
                    <li>Company registration status</li>
                    <li>Registration date and type</li>
                    <li>Registered address</li>
                    <li>Directors and shareholders (if available)</li>
                    <li>Annual returns status</li>
                  </ul>
                </div>
              </div>
            </div>

            <Button 
              type="submit" 
              disabled={isCacVerifying}
              className="w-full"
            >
              {isCacVerifying ? (
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Verifying CAC Registration...</span>
                </div>
              ) : (
                <>
                  <Shield className="h-4 w-4 mr-2" />
                  Verify CAC Registration
                </>
              )}
            </Button>
          </form>

          <div className="text-xs text-gray-500 space-y-1">
            <p>• CAC verification typically takes 10-30 seconds</p>
            <p>• Results include current registration status</p>
            <p>• Verification helps confirm business legitimacy</p>
            <p>• Contact CAC directly for official certificates</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
