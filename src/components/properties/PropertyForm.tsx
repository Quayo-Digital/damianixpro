
import React, { useState } from 'react';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage, FormDescription } from '@/components/ui/form';
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

interface PropertyFormProps {
  onSubmit: (data: PropertyFormValues, imageUrl: string | null, documents: File[]) => Promise<void>;
  onCancel: () => void;
  initialData?: Property;
  isSubmitting: boolean;
}

export function PropertyForm({ 
  onSubmit, 
  onCancel, 
  initialData,
  isSubmitting 
}: PropertyFormProps) {
  const [imageUrl, setImageUrl] = useState<string | null>(initialData?.imageUrl || null);
  const [documents, setDocuments] = useState<File[]>([]);
  const [isGeocoding, setIsGeocoding] = useState(false);

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
          name: "",
          address: "",
          type: "",
          price: "",
          location: "",
          bedrooms: undefined,
          bathrooms: undefined,
          squareFeet: undefined,
          description: "",
          status: "Available",
          lease_terms: "",
          availability_date: "",
          latitude: "",
          longitude: "",
          agent_commission_rate: "0.03",
          tourUrl: "",
        },
  });

  // Enhanced geocoding function with multiple fallbacks for Nigerian addresses
  const geocodeAddress = React.useCallback(async (address: string): Promise<void> => {
    if (!address?.trim()) {
      toast.error('Please enter an address first');
      return;
    }

    setIsGeocoding(true);
    try {
      // Try multiple geocoding strategies for better Nigerian address recognition
      let coordinates = null;
      
      // Strategy 1: Try with full Nigerian context
      coordinates = await tryGeocoding(`${address}, Nigeria`);
      
      // Strategy 2: If no results, try with major Nigerian cities context
      if (!coordinates) {
        const nigerianCities = ['Lagos', 'Abuja', 'Port Harcourt', 'Kano', 'Ibadan', 'Kaduna'];
        for (const city of nigerianCities) {
          if (address.toLowerCase().includes(city.toLowerCase())) {
            coordinates = await tryGeocoding(`${address}, ${city}, Nigeria`);
            if (coordinates) break;
          }
        }
      }
      
      // Strategy 3: Try with state context if no results
      if (!coordinates) {
        const nigerianStates = ['Lagos State', 'FCT Abuja', 'Rivers State', 'Kano State', 'Oyo State', 'Kaduna State'];
        for (const state of nigerianStates) {
          if (address.toLowerCase().includes(state.toLowerCase().replace(' state', ''))) {
            coordinates = await tryGeocoding(`${address}, ${state}, Nigeria`);
            if (coordinates) break;
          }
        }
      }
      
      if (coordinates) {
        form.setValue('latitude', coordinates.lat.toString());
        form.setValue('longitude', coordinates.lon.toString());
        toast.success(`Location found using ${coordinates.source}! Coordinates updated.`);
      } else {
        toast.error('Could not find location coordinates. Please enter them manually if needed.');
      }
    } catch (error) {
      console.error('Geocoding error:', error);
      toast.error('Failed to get location coordinates. You can enter them manually if needed.');
    } finally {
      setIsGeocoding(false);
    }
  }, [form]);
  
  // Helper function to try geocoding with different services
  const tryGeocoding = async (query: string): Promise<{lat: number, lon: number, source: string} | null> => {
    try {
      // Primary: OpenStreetMap Nominatim with better parameters
      const nominatimResponse = await fetch(
        `https://nominatim.openstreetmap.org/search?` +
        `format=json&` +
        `q=${encodeURIComponent(query)}&` +
        `countrycodes=ng&` + // Restrict to Nigeria
        `limit=1&` +
        `addressdetails=1&` +
        `extratags=1`,
        {
          headers: {
            'User-Agent': 'Nigeria-Homes-Property-Platform/1.0'
          }
        }
      );
      
      if (nominatimResponse.ok) {
        const nominatimData = await nominatimResponse.json();
        if (nominatimData && nominatimData.length > 0) {
          console.log('Geocoding success with Nominatim:', nominatimData[0]);
          return {
            lat: parseFloat(nominatimData[0].lat),
            lon: parseFloat(nominatimData[0].lon),
            source: 'Nominatim'
          };
        }
      }
      
      // Fallback: Try alternative free geocoding service
      const photonResponse = await fetch(
        `https://photon.komoot.io/api/?` +
        `q=${encodeURIComponent(query)}&` +
        `limit=1&` +
        `osm_tag=place`
      );
      
      if (photonResponse.ok) {
        const photonData = await photonResponse.json();
        if (photonData.features && photonData.features.length > 0) {
          const coords = photonData.features[0].geometry.coordinates;
          console.log('Geocoding success with Photon:', coords);
          return {
            lat: coords[1], // Photon returns [lon, lat]
            lon: coords[0],
            source: 'Photon'
          };
        }
      }
      
    } catch (error) {
      console.log('Geocoding attempt failed for query:', query, error);
    }
    
    return null;
  };

  const handleSubmit = async (data: PropertyFormValues) => {
    await onSubmit(data, imageUrl, documents);
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
                  const address = form.getValues('address');
                  if (address) {
                    geocodeAddress(address);
                  }
                }}
                disabled={isGeocoding || !form.getValues('address')}
                className="text-xs"
              >
                {isGeocoding ? (
                  <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                ) : (
                  <MapPin className="h-3 w-3 mr-1" />
                )}
                {isGeocoding ? 'Finding...' : 'Auto-fill from Address'}
              </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                      💡 <strong>Tip:</strong> Include area/district and state for better geocoding results (e.g., "Victoria Island, Lagos" or "Wuse 2, Abuja FCT")
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
              💡 Tip: Enter the property address above, then click "Auto-fill from Address" to automatically get coordinates.
            </p>
          </div>
          
          {/* 3D Tour - Simplified */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium">3D Virtual Tour</h3>
              <span className="text-xs text-muted-foreground">Optional</span>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-blue-600 text-sm font-semibold">3D</span>
                  </div>
                </div>
                <div className="flex-1">
                  <h4 className="text-sm font-medium text-blue-800 mb-1">Professional 3D Tour Service</h4>
                  <p className="text-sm text-blue-700 mb-3">
                    Want to add a 3D virtual tour to showcase your property? Our team can help you create professional 3D tours using advanced technology.
                  </p>
                  <div className="space-y-2">
                    <div className="flex items-center text-xs text-blue-600">
                      <span className="w-1.5 h-1.5 bg-blue-400 rounded-full mr-2"></span>
                      Professional photography and 3D scanning
                    </div>
                    <div className="flex items-center text-xs text-blue-600">
                      <span className="w-1.5 h-1.5 bg-blue-400 rounded-full mr-2"></span>
                      Interactive virtual walkthrough
                    </div>
                    <div className="flex items-center text-xs text-blue-600">
                      <span className="w-1.5 h-1.5 bg-blue-400 rounded-full mr-2"></span>
                      Increases property views by up to 300%
                    </div>
                  </div>
                  <div className="mt-3 pt-3 border-t border-blue-200">
                    <p className="text-xs text-blue-600">
                      📞 <strong>Contact our team</strong> after submitting this property to schedule a 3D tour session.
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Hidden field for future 3D tour URL (to be populated by admin) */}
            <FormField
              control={form.control}
              name="tourUrl"
              render={({ field }) => (
                <input type="hidden" {...field} value={field.value ?? ''} />
              )}
            />
          </div>

          {/* Property Amenities */}
          <PropertyAmenities form={form} />

          {/* Document Upload */}
          <PropertyDocuments onDocumentsSelected={handleDocumentsSelected} />

          {/* Agent Assignment */}
          <PropertyAgentAssignment form={form} />
          <FormField
            control={form.control}
            name="agent_commission_rate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Agent Commission Rate</FormLabel>
                <FormControl>
                  <Input type="number" step="0.0001" placeholder="e.g. 0.05 for 5%" {...field} value={field.value ?? ''} />
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
                {initialData ? "Updating..." : "Adding..."}
              </>
            ) : (
              initialData ? "Update Property" : "Add Property"
            )}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
}
