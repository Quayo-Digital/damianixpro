/**
 * Discovery Section Component
 * Shows recommended, popular, and featured listings
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ShortletListingCard } from './ShortletListingCard';
import { searchListings } from '@/services/shortlet/api/listings';
import { Loader2, TrendingUp, Star, MapPin, Sparkles } from 'lucide-react';
import type { Listing } from '@/services/shortlet/types';
import { useNavigate } from 'react-router-dom';

interface DiscoverySectionProps {
  userId?: string;
  location?: string;
}

export function DiscoverySection({ userId, location }: DiscoverySectionProps) {
  const navigate = useNavigate();
  const [featured, setFeatured] = useState<Listing[]>([]);
  const [popular, setPopular] = useState<Listing[]>([]);
  const [recommended, setRecommended] = useState<Listing[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadDiscoveryData();
  }, [userId, location]);

  const loadDiscoveryData = async () => {
    setIsLoading(true);
    try {
      // Load featured listings (active, instant book, high ratings)
      const featuredResult = await searchListings({
        instant_book: true,
        sort_by: 'popular',
        page: 1,
        page_size: 6
      });
      setFeatured(featuredResult.listings);

      // Load popular listings (most bookings)
      const popularResult = await searchListings({
        sort_by: 'popular',
        page: 1,
        page_size: 6
      });
      setPopular(popularResult.listings);

      // Load recommended (based on user preferences if available)
      const recommendedResult = await searchListings({
        location: location,
        sort_by: 'popular',
        page: 1,
        page_size: 6
      });
      setRecommended(recommendedResult.listings);
    } catch (error) {
      console.error('Error loading discovery data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-12">
      {/* Featured Listings */}
      {featured.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <Sparkles className="h-6 w-6 text-primary" />
                Featured Listings
              </h2>
              <p className="text-muted-foreground">Handpicked properties for you</p>
            </div>
            <Button variant="outline" onClick={() => navigate('/shortlets?featured=true')}>
              View All
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featured.map(listing => (
              <ShortletListingCard
                key={listing.id}
                listing={listing}
                onView={(id) => navigate(`/shortlets/${id}`)}
              />
            ))}
          </div>
        </section>
      )}

      {/* Popular Listings */}
      {popular.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <TrendingUp className="h-6 w-6 text-primary" />
                Popular Right Now
              </h2>
              <p className="text-muted-foreground">Most booked properties this month</p>
            </div>
            <Button variant="outline" onClick={() => navigate('/shortlets?sort=popular')}>
              View All
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {popular.map(listing => (
              <ShortletListingCard
                key={listing.id}
                listing={listing}
                onView={(id) => navigate(`/shortlets/${id}`)}
              />
            ))}
          </div>
        </section>
      )}

      {/* Recommended for You */}
      {recommended.length > 0 && userId && (
        <section>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <Star className="h-6 w-6 text-primary" />
                Recommended for You
              </h2>
              <p className="text-muted-foreground">
                {location ? `Based on your location: ${location}` : 'Based on your preferences'}
              </p>
            </div>
            <Button variant="outline" onClick={() => navigate('/shortlets')}>
              View All
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {recommended.map(listing => (
              <ShortletListingCard
                key={listing.id}
                listing={listing}
                onView={(id) => navigate(`/shortlets/${id}`)}
              />
            ))}
          </div>
        </section>
      )}

      {/* Location-based */}
      {location && (
        <section>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <MapPin className="h-6 w-6 text-primary" />
                Explore {location}
              </h2>
              <p className="text-muted-foreground">Discover amazing stays in your area</p>
            </div>
            <Button variant="outline" onClick={() => navigate(`/shortlets?location=${location}`)}>
              View All
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {recommended.slice(0, 6).map(listing => (
              <ShortletListingCard
                key={listing.id}
                listing={listing}
                onView={(id) => navigate(`/shortlets/${id}`)}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

