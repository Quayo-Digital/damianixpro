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
        page_size: 6,
      });
      setFeatured(featuredResult.listings);

      const popularResult = await searchListings({
        sort_by: 'popular',
        page: 1,
        page_size: 6,
      });
      setPopular(popularResult.listings);

      const recommendedResult = await searchListings({
        location: location,
        sort_by: 'popular',
        page: 1,
        page_size: 6,
      });
      setRecommended(recommendedResult.listings);
    } catch (error) {
      console.error('Error loading discovery data:', error);
      setFeatured([]);
      setPopular([]);
      setRecommended([]);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-12">
      {/* Featured Listings */}
      {featured.length > 0 && (
        <section>
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="flex items-center gap-2 text-2xl font-bold">
                <Sparkles className="h-6 w-6 text-primary" />
                Featured Listings
              </h2>
              <p className="text-muted-foreground">Handpicked properties for you</p>
            </div>
            <Button variant="outline" onClick={() => navigate('/shortlets?featured=true')}>
              View All
            </Button>
          </div>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {featured.map((listing) => (
              <ShortletListingCard
                key={String(listing.id)}
                listing={listing}
                onView={(id) => navigate(`/shortlets/${String(id)}`)}
              />
            ))}
          </div>
        </section>
      )}

      {/* Popular Listings */}
      {popular.length > 0 && (
        <section>
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="flex items-center gap-2 text-2xl font-bold">
                <TrendingUp className="h-6 w-6 text-primary" />
                Popular Right Now
              </h2>
              <p className="text-muted-foreground">Most booked properties this month</p>
            </div>
            <Button variant="outline" onClick={() => navigate('/shortlets?sort=popular')}>
              View All
            </Button>
          </div>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {popular.map((listing) => (
              <ShortletListingCard
                key={String(listing.id)}
                listing={listing}
                onView={(id) => navigate(`/shortlets/${String(id)}`)}
              />
            ))}
          </div>
        </section>
      )}

      {/* Recommended for You */}
      {recommended.length > 0 && userId && (
        <section>
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="flex items-center gap-2 text-2xl font-bold">
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
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {recommended.map((listing) => (
              <ShortletListingCard
                key={String(listing.id)}
                listing={listing}
                onView={(id) => navigate(`/shortlets/${String(id)}`)}
              />
            ))}
          </div>
        </section>
      )}

      {/* Location-based */}
      {location && (
        <section>
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="flex items-center gap-2 text-2xl font-bold">
                <MapPin className="h-6 w-6 text-primary" />
                Explore {location}
              </h2>
              <p className="text-muted-foreground">Discover amazing stays in your area</p>
            </div>
            <Button variant="outline" onClick={() => navigate(`/shortlets?location=${location}`)}>
              View All
            </Button>
          </div>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {recommended.slice(0, 6).map((listing) => (
              <ShortletListingCard
                key={String(listing.id)}
                listing={listing}
                onView={(id) => navigate(`/shortlets/${String(id)}`)}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
