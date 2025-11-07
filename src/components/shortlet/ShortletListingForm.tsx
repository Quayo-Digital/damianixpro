/**
 * Short-Let Listing Form Component
 * Create/edit short-let listings
 */

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { createListing, updateListing, getListingById } from '@/services/shortlet/api/listings';
import { getPropertyById } from '@/services/property/api/queries';
import { Loader2, Home, MapPin, Users, DollarSign, Wifi, Car, UtensilsCrossed, Waves } from 'lucide-react';
import type { Listing } from '@/services/shortlet/types';

const listingSchema = z.object({
  property_id: z.string().min(1, 'Property is required'),
  title: z.string().min(3, 'Title must be at least 3 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  capacity: z.number().min(1).max(50),
  base_price: z.number().min(0),
  cleaning_fee: z.number().min(0).optional(),
  security_deposit: z.number().min(0).optional(),
  currency: z.string().default('NGN'),
  instant_book: z.boolean().default(false),
  amenities: z.object({
    wifi: z.boolean().optional(),
    parking: z.boolean().optional(),
    kitchen: z.boolean().optional(),
    pool: z.boolean().optional(),
    air_conditioning: z.boolean().optional(),
    tv: z.boolean().optional(),
    washer: z.boolean().optional(),
    dryer: z.boolean().optional(),
  }).optional(),
});

type ListingFormValues = z.infer<typeof listingSchema>;

interface ShortletListingFormProps {
  propertyId?: string;
  listingId?: string;
  onSuccess?: (listingId: string) => void;
  onCancel?: () => void;
}

export function ShortletListingForm({ 
  propertyId, 
  listingId,
  onSuccess,
  onCancel 
}: ShortletListingFormProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingListing, setIsLoadingListing] = useState(!!listingId);
  const [properties, setProperties] = useState<any[]>([]);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<ListingFormValues>({
    resolver: zodResolver(listingSchema),
    defaultValues: {
      capacity: 1,
      base_price: 0,
      cleaning_fee: 0,
      security_deposit: 0,
      currency: 'NGN',
      instant_book: false,
      amenities: {
        wifi: false,
        parking: false,
        kitchen: false,
        pool: false,
        air_conditioning: false,
        tv: false,
        washer: false,
        dryer: false,
      }
    }
  });

  const instantBook = watch('instant_book');
  const amenities = watch('amenities');

  // Load listing if editing
  useEffect(() => {
    if (listingId) {
      loadListing();
    }
  }, [listingId]);

  // Load properties if propertyId not provided
  useEffect(() => {
    if (!propertyId) {
      loadProperties();
    } else {
      setValue('property_id', propertyId);
    }
  }, [propertyId, setValue]);

  const loadListing = async () => {
    if (!listingId) return;
    setIsLoadingListing(true);
    try {
      const listing = await getListingById(listingId);
      setValue('property_id', listing.property_id);
      setValue('title', listing.title);
      setValue('description', listing.description || '');
      setValue('capacity', listing.capacity);
      setValue('base_price', Number(listing.base_price));
      setValue('cleaning_fee', Number(listing.cleaning_fee || 0));
      setValue('security_deposit', Number(listing.security_deposit || 0));
      setValue('currency', listing.currency);
      setValue('instant_book', listing.instant_book);
      if (listing.amenities) {
        setValue('amenities', listing.amenities as any);
      }
    } catch (error) {
      console.error('Error loading listing:', error);
      toast({
        title: 'Error',
        description: 'Failed to load listing',
        variant: 'destructive',
      });
    } finally {
      setIsLoadingListing(false);
    }
  };

  const loadProperties = async () => {
    // This would load user's properties
    // For now, we'll assume propertyId is provided
  };

  const onSubmit = async (data: ListingFormValues) => {
    setIsLoading(true);
    try {
      const listingData: Partial<Listing> = {
        property_id: data.property_id,
        title: data.title,
        description: data.description,
        capacity: data.capacity,
        base_price: data.base_price,
        cleaning_fee: data.cleaning_fee,
        security_deposit: data.security_deposit,
        currency: data.currency,
        instant_book: data.instant_book,
        amenities: data.amenities
      };

      if (listingId) {
        await updateListing(listingId, listingData);
        toast({
          title: 'Success',
          description: 'Listing updated successfully',
        });
      } else {
        const result = await createListing(listingData);
        toast({
          title: 'Success',
          description: 'Listing created successfully',
        });
        if (onSuccess) {
          onSuccess(result.id);
        }
      }
    } catch (error) {
      console.error('Error saving listing:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to save listing',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoadingListing) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Listing Details</CardTitle>
          <CardDescription>Basic information about your short-let listing</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!propertyId && (
            <div className="space-y-2">
              <Label htmlFor="property_id">Property *</Label>
              <Select onValueChange={(value) => setValue('property_id', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a property" />
                </SelectTrigger>
                <SelectContent>
                  {properties.map((prop) => (
                    <SelectItem key={prop.id} value={prop.id}>
                      {prop.name || prop.address}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.property_id && (
                <p className="text-sm text-destructive">{errors.property_id.message}</p>
              )}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="title">Listing Title *</Label>
            <Input
              id="title"
              {...register('title')}
              placeholder="e.g., Cozy 2BR Apartment in Lekki"
            />
            {errors.title && (
              <p className="text-sm text-destructive">{errors.title.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              {...register('description')}
              placeholder="Describe your property, amenities, and what makes it special..."
              rows={6}
            />
            {errors.description && (
              <p className="text-sm text-destructive">{errors.description.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="capacity">Maximum Guests *</Label>
              <Input
                id="capacity"
                type="number"
                {...register('capacity', { valueAsNumber: true })}
                min={1}
                max={50}
              />
              {errors.capacity && (
                <p className="text-sm text-destructive">{errors.capacity.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="base_price">Base Price (₦/night) *</Label>
              <Input
                id="base_price"
                type="number"
                {...register('base_price', { valueAsNumber: true })}
                min={0}
                step="0.01"
              />
              {errors.base_price && (
                <p className="text-sm text-destructive">{errors.base_price.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="cleaning_fee">Cleaning Fee (₦)</Label>
              <Input
                id="cleaning_fee"
                type="number"
                {...register('cleaning_fee', { valueAsNumber: true })}
                min={0}
                step="0.01"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="security_deposit">Security Deposit (₦)</Label>
              <Input
                id="security_deposit"
                type="number"
                {...register('security_deposit', { valueAsNumber: true })}
                min={0}
                step="0.01"
              />
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="instant_book"
              checked={instantBook}
              onCheckedChange={(checked) => setValue('instant_book', checked)}
            />
            <Label htmlFor="instant_book" className="cursor-pointer">
              Enable Instant Book (guests can book without approval)
            </Label>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Amenities</CardTitle>
          <CardDescription>Select amenities available at your property</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { key: 'wifi', label: 'WiFi', icon: Wifi },
              { key: 'parking', label: 'Parking', icon: Car },
              { key: 'kitchen', label: 'Kitchen', icon: UtensilsCrossed },
              { key: 'pool', label: 'Pool', icon: Waves },
              { key: 'air_conditioning', label: 'AC', icon: Home },
              { key: 'tv', label: 'TV', icon: Home },
              { key: 'washer', label: 'Washer', icon: Home },
              { key: 'dryer', label: 'Dryer', icon: Home },
            ].map(({ key, label }) => (
              <div key={key} className="flex items-center space-x-2">
                <Switch
                  checked={amenities?.[key as keyof typeof amenities] || false}
                  onCheckedChange={(checked) =>
                    setValue(`amenities.${key}`, checked)
                  }
                />
                <Label className="cursor-pointer">{label}</Label>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-4">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : listingId ? (
            'Update Listing'
          ) : (
            'Create Listing'
          )}
        </Button>
      </div>
    </form>
  );
}

