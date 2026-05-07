/**
 * Featured Properties Section Component
 * Displays premium subscription properties in an attractive carousel slider
 */

import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from '@/components/ui/carousel';
import { Crown, MapPin, Bed, Bath, Square, ArrowRight, Loader2, Home, Star } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { demoProperties } from '@/data/demoProperties';
import type { Property } from '@/services/property/types';

interface FeaturedProperty extends Property {
  is_premium?: boolean;
  premium_until?: string;
}

export function FeaturedPropertiesSection() {
  const navigate = useNavigate();
  const [properties, setProperties] = useState<FeaturedProperty[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);
  const [count, setCount] = useState(0);

  // Auto-play functionality
  useEffect(() => {
    if (!api) return;

    const interval = setInterval(() => {
      api.scrollNext();
    }, 5000);

    return () => clearInterval(interval);
  }, [api]);

  // Track current slide
  useEffect(() => {
    if (!api) return;

    setCount(api.scrollSnapList().length);
    setCurrent(api.selectedScrollSnap());

    api.on('select', () => {
      setCurrent(api.selectedScrollSnap());
    });
  }, [api]);

  const loadFeaturedProperties = useCallback(async () => {
    setIsLoading(true);
    try {
      // Try to fetch premium/featured properties from the database
      const { data, error } = await supabase
        .from('properties')
        .select('*')
        .in('status', ['Available', 'AVAILABLE'])
        .order('created_at', { ascending: false })
        .limit(8);

      if (error) throw error;

      if (data && data.length > 0) {
        // Transform database properties to match our interface
        const transformedProperties: FeaturedProperty[] = data.map((p) => {
          // Nigeria: rent is annual - use lease_price, or monthly_rent*12, or price
          const annualPrice = p.lease_price
            ? `₦${Number(p.lease_price).toLocaleString('en-NG')}`
            : p.monthly_rent
              ? `₦${(Number(p.monthly_rent) * 12).toLocaleString('en-NG')}`
              : p.price || '₦0';
          return {
            id: p.id,
            name: p.name || 'Unnamed Property',
            address: p.address || '',
            type: p.type || 'residential',
            transaction_type: (p.transaction_type as 'SALE' | 'LEASE') || 'LEASE',
            property_category:
              (p.property_category as 'RESIDENTIAL' | 'COMMERCIAL' | 'LAND' | 'INDUSTRIAL') ||
              'RESIDENTIAL',
            price: annualPrice,
            location: p.location || 'Nigeria',
            bedrooms: p.bedrooms?.toString(),
            bathrooms: p.bathrooms?.toString(),
            squareFeet: p.square_feet?.toString(),
            description: p.description,
            status: p.status || 'Available',
            imageUrl: p.image_url || p.images?.[0],
            images: p.images,
            features: p.features,
            amenities: p.amenities,
            is_premium: true,
          };
        });
        setProperties(transformedProperties);
      } else {
        // Use demo properties as fallback, marking the first few as premium
        const premiumDemoProperties = demoProperties.slice(0, 6).map((p, index) => ({
          ...p,
          is_premium: index < 4, // First 4 are premium
        }));
        setProperties(premiumDemoProperties);
      }
    } catch (error) {
      console.error('Error loading featured properties:', error);
      // Use demo properties on error
      const premiumDemoProperties = demoProperties.slice(0, 6).map((p, index) => ({
        ...p,
        is_premium: index < 4,
      }));
      setProperties(premiumDemoProperties);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadFeaturedProperties();
  }, [loadFeaturedProperties]);

  const handleViewProperty = (propertyId: string) => {
    navigate(`/public/properties/${propertyId}`);
  };

  const handleViewAll = () => {
    navigate('/public/properties');
  };

  if (isLoading) {
    return (
      <section className="border-y border-border bg-gradient-to-b from-slate-50 to-background px-6 py-16 dark:from-muted/20 dark:to-background">
        <div className="container mx-auto">
          <div className="flex h-64 items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </div>
      </section>
    );
  }

  if (properties.length === 0) {
    return null;
  }

  return (
    <section className="overflow-hidden border-y border-border bg-gradient-to-b from-slate-50 to-background px-6 py-16 dark:from-muted/20 dark:to-background">
      <div className="container mx-auto">
        {/* Section Header */}
        <div className="mb-10 flex flex-col md:flex-row md:items-end md:justify-between">
          <div data-reveal data-reveal-delay="50" className="reveal-on-scroll reveal-hero">
            <div className="mb-3 flex items-center gap-2">
              <Crown className="h-6 w-6 text-amber-500" />
              <span className="text-sm font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                Premium Collection
              </span>
            </div>
            <h2 className="mb-2 text-3xl font-bold text-foreground md:text-4xl">
              Featured Properties
            </h2>
            <p className="max-w-xl text-muted-foreground">
              Discover our handpicked selection of premium properties from verified landlords and
              property managers across Nigeria.
            </p>
          </div>
          <Button
            variant="outline"
            className="micro-press reveal-on-scroll reveal-card group mt-4 md:mt-0"
            data-reveal
            data-reveal-delay="90"
            onClick={handleViewAll}
          >
            View All Listings
            <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Button>
        </div>

        {/* Carousel */}
        <div
          data-reveal
          data-reveal-delay="120"
          className="reveal-on-scroll reveal-hero relative px-12"
        >
          <Carousel
            setApi={setApi}
            opts={{
              align: 'start',
              loop: true,
            }}
            className="w-full"
          >
            <CarouselContent className="-ml-4">
              {properties.map((property, index) => (
                <CarouselItem key={property.id} className="pl-4 md:basis-1/2 lg:basis-1/3">
                  <FeaturedPropertyCard
                    property={property}
                    onView={handleViewProperty}
                    revealDelay={140 + (index % 3) * 70}
                  />
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious className="left-0" />
            <CarouselNext className="right-0" />
          </Carousel>

          {/* Slide Indicators */}
          <div className="mt-6 flex justify-center gap-2">
            {Array.from({ length: count }).map((_, index) => (
              <button
                key={index}
                className={`h-2 rounded-full transition-all duration-300 ${
                  index === current
                    ? 'w-8 bg-primary'
                    : 'w-2 bg-muted-foreground/30 hover:bg-muted-foreground/50'
                }`}
                onClick={() => api?.scrollTo(index)}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        </div>

        {/* Trust Badges */}
        <div
          data-reveal
          data-reveal-delay="180"
          className="reveal-on-scroll reveal-card mt-12 flex flex-wrap justify-center gap-6 text-sm text-muted-foreground"
        >
          <div className="flex items-center gap-2">
            <Star className="h-4 w-4 text-amber-500" />
            <span>Verified Properties</span>
          </div>
          <div className="flex items-center gap-2">
            <Crown className="h-4 w-4 text-amber-500" />
            <span>Premium Listings</span>
          </div>
          <div className="flex items-center gap-2">
            <Home className="h-4 w-4 text-primary" />
            <span>Direct from Owners</span>
          </div>
        </div>
      </div>
    </section>
  );
}

// Featured Property Card Component
interface FeaturedPropertyCardProps {
  property: FeaturedProperty;
  onView: (id: string) => void;
  revealDelay?: number;
}

function FeaturedPropertyCard({ property, onView, revealDelay = 120 }: FeaturedPropertyCardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Available':
        return 'bg-primary';
      case 'Rented':
        return 'bg-secondary';
      case 'Sold':
        return 'bg-muted-foreground';
      default:
        return 'bg-muted-foreground';
    }
  };

  return (
    <Card
      data-reveal
      data-reveal-delay={String(revealDelay)}
      className="reveal-on-scroll reveal-card group overflow-hidden rounded-2xl border border-border shadow-md transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
    >
      {/* Image Container */}
      <div className="relative h-64 overflow-hidden">
        {property.imageUrl ? (
          <img
            src={property.imageUrl}
            alt={property.name}
            loading="lazy"
            decoding="async"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-muted to-muted/70">
            <Home className="h-16 w-16 text-muted-foreground" />
          </div>
        )}

        {/* Overlay Gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

        {/* Premium Badge */}
        {property.is_premium && (
          <div className="absolute left-3 top-3">
            <Badge className="border-0 bg-amber-500 text-white hover:bg-amber-600">
              <Crown className="mr-1 h-3 w-3" />
              Verified
            </Badge>
          </div>
        )}

        {/* Status Badge */}
        <div className="absolute right-3 top-3">
          <Badge className={`${getStatusColor(property.status)} border-0 text-white`}>
            {property.status}
          </Badge>
        </div>

        {property.status === 'Available' && (
          <div className="absolute right-3 top-12">
            <Badge className="border-0 bg-white/90 text-foreground">Available</Badge>
          </div>
        )}

        {/* Price on Image */}
        <div className="absolute bottom-3 left-3">
          <span className="text-xl font-bold text-white drop-shadow-lg">{property.price}</span>
          <span className="ml-1 text-sm text-white/80">/year</span>
        </div>
      </div>

      <CardContent className="p-5">
        {/* Property Name */}
        <h3 className="mb-2 line-clamp-1 text-lg font-semibold text-foreground transition-colors group-hover:text-primary">
          {property.name}
        </h3>

        {/* Location */}
        <div className="mb-3 flex items-center text-muted-foreground">
          <MapPin className="mr-1 h-4 w-4 flex-shrink-0" />
          <span className="truncate text-sm">{property.location}</span>
        </div>

        {/* Property Features */}
        <div className="mb-4 flex items-center gap-4 text-sm text-muted-foreground">
          {property.bedrooms && (
            <div className="flex items-center gap-1">
              <Bed className="h-4 w-4" />
              <span>{property.bedrooms}</span>
            </div>
          )}
          {property.bathrooms && (
            <div className="flex items-center gap-1">
              <Bath className="h-4 w-4" />
              <span>{property.bathrooms}</span>
            </div>
          )}
          {property.squareFeet && (
            <div className="flex items-center gap-1">
              <Square className="h-4 w-4" />
              <span>{property.squareFeet} sqft</span>
            </div>
          )}
        </div>

        {/* Property Type Badge */}
        <div className="flex items-center justify-between">
          <Badge variant="outline" className="capitalize">
            {property.type}
          </Badge>
          <Button size="sm" onClick={() => onView(property.id)} className="micro-press group/btn">
            View Details
            <ArrowRight className="ml-1 h-3 w-3 transition-transform group-hover/btn:translate-x-1" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default FeaturedPropertiesSection;
