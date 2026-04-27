import React, { useState } from 'react';
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
  FormDescription,
} from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { Loader2, MapPin } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

import { PropertyImageUpload } from './PropertyImageUpload';
import { PropertyBasicInfo } from './PropertyBasicInfo';
import { PropertyDetails } from './PropertyDetails';
import { PropertyAmenities } from './PropertyAmenities';
import { PropertyDocuments } from './PropertyDocuments';
import { PropertyAgentAssignment } from './PropertyAgentAssignment';
import { propertyFormSchema, PropertyFormValues, Property } from '@/services/property/types';
import { DialogFooter } from '../ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { useAuthSession } from '@/contexts/auth';
import {
  createTourServiceRequest,
  getMyLatestTourRequest,
  TourServiceRequest,
} from '@/services/tourServiceRequests';
import { PropertyLocationSelector } from '@/components/properties/PropertyLocationSelector';
import { geocodeNigerianPropertyAddress } from '@/utils/propertyGeocoding';

interface PropertyFormProps {
  onSubmit: (
    data: PropertyFormValues,
    imageUrl: string | null,
    documents: File[],
    requestTourAfterSubmit: boolean
  ) => Promise<void>;
  onCancel: () => void;
  initialData?: Property;
  isSubmitting: boolean;
}

export function PropertyForm({ onSubmit, onCancel, initialData, isSubmitting }: PropertyFormProps) {
  const { user } = useAuthSession();
  const [imageUrl, setImageUrl] = useState<string | null>(initialData?.imageUrl || null);
  const [documents, setDocuments] = useState<File[]>([]);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [requestTourAfterSubmit, setRequestTourAfterSubmit] = useState(false);
  const [isCreatingTourRequest, setIsCreatingTourRequest] = useState(false);
  const [isLoadingTourRequest, setIsLoadingTourRequest] = useState(false);
  const [latestTourRequest, setLatestTourRequest] = useState<TourServiceRequest | null>(null);

  const form = useForm<PropertyFormValues>({
    resolver: zodResolver(propertyFormSchema),
    defaultValues: initialData
      ? {
          ...initialData,
          bedrooms: initialData.bedrooms ? Number(initialData.bedrooms) : undefined,
          bathrooms: initialData.bathrooms ? Number(initialData.bathrooms) : undefined,
          squareFeet: initialData.squareFeet ? Number(initialData.squareFeet) : undefined,
          latitude: initialData.latitude?.toString() ?? '',
          longitude: initialData.longitude?.toString() ?? '',
          agent_commission_rate: initialData.agent_commission_rate?.toString() ?? '',
          tourUrl: initialData.tourUrl ?? '',
        }
      : {
          name: '',
          address: '',
          type: 'residential',
          transaction_type: 'LEASE',
          property_category: 'RESIDENTIAL',
          price: '',
          sale_price: '',
          lease_price: '',
          location: '',
          bedrooms: undefined,
          bathrooms: undefined,
          squareFeet: undefined,
          description: '',
          status: 'Available',
          lease_terms: '',
          availability_date: '',
          latitude: '',
          longitude: '',
          agent_commission_rate: '0.03',
          tourUrl: '',
        },
  });

  // Geocoding: Photon + Nominatim (parallel) + Open-Meteo city fallback — see `propertyGeocoding.ts`
  const geocodeAddress = React.useCallback(async (): Promise<void> => {
    const address = form.getValues('address')?.trim();
    if (!address) {
      toast.error('Please enter an address first');
      return;
    }

    const locationHint = form.getValues('location')?.trim();

    setIsGeocoding(true);
    try {
      const coordinates = await geocodeNigerianPropertyAddress(address, locationHint);

      if (coordinates) {
        form.setValue('latitude', coordinates.lat.toFixed(6));
        form.setValue('longitude', coordinates.lon.toFixed(6));
        const approx = coordinates.source.includes('approximate');
        toast.success(
          approx
            ? `${coordinates.source} — map pin is city-level; drag the map pin to fine-tune if needed.`
            : `Location found (${coordinates.source}). Coordinates updated.`
        );
      } else {
        toast.error(
          'Could not geocode this address. Add a clearer Location (e.g. city) and try again, or check your network.'
        );
      }
    } catch (error) {
      console.error('Geocoding error:', error);
      toast.error('Geocoding failed. Check your connection and try again.');
    } finally {
      setIsGeocoding(false);
    }
  }, [form]);

  React.useEffect(() => {
    if (!initialData?.id || !user?.id) return;

    let isMounted = true;
    const loadLatestRequest = async () => {
      try {
        setIsLoadingTourRequest(true);
        const request = await getMyLatestTourRequest(initialData.id, user.id);
        if (isMounted) {
          setLatestTourRequest(request);
        }
      } catch (error) {
        console.error('Failed to load latest tour request:', error);
      } finally {
        if (isMounted) {
          setIsLoadingTourRequest(false);
        }
      }
    };

    loadLatestRequest();
    return () => {
      isMounted = false;
    };
  }, [initialData?.id, user?.id]);

  const activeRequestExists =
    latestTourRequest && ['pending', 'in_progress', 'scheduled'].includes(latestTourRequest.status);

  const statusBadgeClass: Record<string, string> = {
    pending: 'border-amber-200 bg-amber-50 text-amber-800',
    in_progress: 'border-blue-200 bg-blue-50 text-blue-800',
    scheduled: 'border-violet-200 bg-violet-50 text-violet-800',
    completed: 'border-emerald-200 bg-emerald-50 text-emerald-800',
    cancelled: 'border-slate-200 bg-slate-50 text-slate-700',
  };

  const handleCreateTourRequestNow = async () => {
    if (!initialData?.id || !user?.id || activeRequestExists) return;

    setIsCreatingTourRequest(true);
    try {
      const { request, alreadyExists } = await createTourServiceRequest(initialData.id, user.id);
      setLatestTourRequest(request);
      if (alreadyExists) {
        toast.info('An active 3D tour request already exists for this property.');
      } else {
        toast.success('3D tour request submitted successfully.');
      }
    } catch (error: any) {
      toast.error(error?.message || 'Failed to submit 3D tour request.');
    } finally {
      setIsCreatingTourRequest(false);
    }
  };

  const handleSubmit = async (data: PropertyFormValues) => {
    await onSubmit(data, imageUrl, documents, requestTourAfterSubmit);
  };

  const handleImageUploaded = (url: string | null) => {
    setImageUrl(url);
  };

  const handleDocumentsSelected = (files: File[]) => {
    setDocuments(files);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <div className="space-y-4">
          {/* Property Image Upload */}
          <PropertyImageUpload
            onImageUploaded={handleImageUploaded}
            initialImageUrl={initialData?.imageUrl}
          />

          {/* Basic Information */}
          <PropertyBasicInfo form={form} />

          {/* Property Details */}
          <PropertyDetails form={form} />

          {/* Location Coordinates - Auto-populated from address */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium">Location Coordinates</h3>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  void geocodeAddress();
                }}
                disabled={isGeocoding || !form.watch('address')?.trim()}
                className="text-xs"
              >
                {isGeocoding ? (
                  <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                ) : (
                  <MapPin className="mr-1 h-3 w-3" />
                )}
                {isGeocoding ? 'Finding...' : 'Auto-fill from Address'}
              </Button>
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Property Address</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g., 123 Admiralty Way, Lekki Phase 1, Lagos State"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      💡 <strong>Tip:</strong> Include area/district and state for better geocoding
                      results (e.g., "Victoria Island, Lagos" or "Wuse 2, Abuja FCT")
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="latitude"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Latitude</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="any"
                        placeholder="Auto-filled or enter manually"
                        {...field}
                        value={field.value ?? ''}
                        className="text-sm"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="longitude"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Longitude</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="any"
                        placeholder="Auto-filled or enter manually"
                        {...field}
                        value={field.value ?? ''}
                        className="text-sm"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              💡 Tip: Enter the property address above, then click "Auto-fill from Address" to
              automatically get coordinates.
            </p>
            <PropertyLocationSelector
              latitude={form.watch('latitude')}
              longitude={form.watch('longitude')}
              onChange={(lat, lng) => {
                form.setValue('latitude', lat.toString());
                form.setValue('longitude', lng.toString());
              }}
            />
          </div>

          {/* 3D Tour - Simplified */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium">3D Virtual Tour</h3>
              <span className="text-xs text-muted-foreground">Optional</span>
            </div>
            <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100">
                    <span className="text-sm font-semibold text-blue-600">3D</span>
                  </div>
                </div>
                <div className="flex-1">
                  <h4 className="mb-1 text-sm font-medium text-blue-800">
                    Professional 3D Tour Service
                  </h4>
                  <p className="mb-3 text-sm text-blue-700">
                    Want to add a 3D virtual tour to showcase your property? Our team can help you
                    create professional 3D tours using advanced technology.
                  </p>
                  <div className="space-y-2">
                    <div className="flex items-center text-xs text-blue-600">
                      <span className="mr-2 h-1.5 w-1.5 rounded-full bg-blue-400"></span>
                      Professional photography and 3D scanning
                    </div>
                    <div className="flex items-center text-xs text-blue-600">
                      <span className="mr-2 h-1.5 w-1.5 rounded-full bg-blue-400"></span>
                      Interactive virtual walkthrough
                    </div>
                    <div className="flex items-center text-xs text-blue-600">
                      <span className="mr-2 h-1.5 w-1.5 rounded-full bg-blue-400"></span>
                      Increases property views by up to 300%
                    </div>
                  </div>
                  <div className="mt-3 border-t border-blue-200 pt-3">
                    {initialData?.id ? (
                      <div className="space-y-3">
                        {isLoadingTourRequest ? (
                          <p className="text-xs text-blue-600">Checking previous requests...</p>
                        ) : latestTourRequest ? (
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-xs text-blue-700">Latest request status:</span>
                            <Badge
                              variant="outline"
                              className={`rounded-full ${statusBadgeClass[latestTourRequest.status] || ''}`}
                            >
                              {latestTourRequest.status.replace('_', ' ')}
                            </Badge>
                          </div>
                        ) : (
                          <p className="text-xs text-blue-600">No request submitted yet.</p>
                        )}

                        <Button
                          type="button"
                          size="sm"
                          className="rounded-full"
                          disabled={isCreatingTourRequest || Boolean(activeRequestExists)}
                          onClick={handleCreateTourRequestNow}
                        >
                          {isCreatingTourRequest
                            ? 'Submitting...'
                            : activeRequestExists
                              ? 'Request Already Active'
                              : 'Request Professional 3D Tour'}
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <div className="flex items-start gap-2">
                          <Checkbox
                            id="request-tour-after-submit"
                            checked={requestTourAfterSubmit}
                            onCheckedChange={(checked) =>
                              setRequestTourAfterSubmit(Boolean(checked))
                            }
                          />
                          <label
                            htmlFor="request-tour-after-submit"
                            className="cursor-pointer text-xs text-blue-700"
                          >
                            Request professional 3D tour service automatically after this property
                            is added.
                          </label>
                        </div>
                        <p className="text-xs text-blue-600">
                          📞 You can also request this later when editing the property.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Hidden field for future 3D tour URL (to be populated by admin) */}
            <FormField
              control={form.control}
              name="tourUrl"
              render={({ field }) => <input type="hidden" {...field} value={field.value ?? ''} />}
            />
          </div>

          {/* Property Amenities */}
          <PropertyAmenities form={form} />

          {/* Document Upload */}
          <PropertyDocuments onDocumentsSelected={handleDocumentsSelected} />

          {/* Agent Assignment */}
          <PropertyAgentAssignment form={form} propertyId={initialData?.id} />
          <FormField
            control={form.control}
            name="agent_commission_rate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Agent Commission Rate</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="0.0001"
                    placeholder="e.g. 0.05 for 5%"
                    {...field}
                    value={field.value ?? ''}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {initialData ? 'Updating...' : 'Adding...'}
              </>
            ) : initialData ? (
              'Update Property'
            ) : (
              'Add Property'
            )}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
}
