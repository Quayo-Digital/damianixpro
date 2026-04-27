/**
 * Short-Let Listing Page
 * View and manage a single short-let listing
 */

import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { EnhancedCalendar } from '@/components/shortlet/EnhancedCalendar';
import { BookingFlow } from '@/components/shortlet/BookingFlow';
import { ShortletListingForm } from '@/components/shortlet/ShortletListingForm';
import { BookingList } from '@/components/shortlet/BookingList';
import { ReviewList } from '@/components/shortlet/ReviewList';
import { ImageGallery } from '@/components/shortlet/ImageGallery';
import { useAuthSession } from '@/contexts/auth';
import { useShortletListing } from '@/hooks/useShortletListings';
import ErrorBoundary from '@/components/ErrorBoundary';
import { Loader2, ArrowLeft, Edit, Calendar as CalendarIcon, Home } from 'lucide-react';
import type { Listing } from '@/services/shortlet/types';

export function ShortletListingPage() {
  const { listingId } = useParams<{ listingId: string }>();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuthSession();
  const { data: listing, isLoading, error } = useShortletListing(listingId);
  const [activeTab, setActiveTab] = useState('view');
  const [isEditing, setIsEditing] = useState(false);

  // Only allow editing if user is authenticated AND is the owner
  const isOwner = isAuthenticated() && user?.id && listing?.owner_id === user.id;

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || (!isLoading && !listing)) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">
              {error ? 'Failed to load listing' : 'Listing not found'}
            </p>
            <Button onClick={() => navigate('/shortlets')} className="mt-4">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Listings
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!listing) {
    return null; // Still loading
  }

  return (
    <ErrorBoundary>
      <div className="container mx-auto space-y-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold">{listing.title}</h1>
              <p className="text-muted-foreground">{listing.property?.address}</p>
            </div>
          </div>
          {isOwner && isAuthenticated() && (
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setIsEditing(!isEditing)}>
                <Edit className="mr-2 h-4 w-4" />
                {isEditing ? 'Cancel Edit' : 'Edit Listing'}
              </Button>
            </div>
          )}
        </div>

        {/* Edit Mode */}
        {isEditing && isOwner ? (
          <Card>
            <CardHeader>
              <CardTitle>Edit Listing</CardTitle>
              <CardDescription>Update your short-let listing details</CardDescription>
            </CardHeader>
            <CardContent>
              <ShortletListingForm
                listingId={listing.id}
                propertyId={listing.property_id}
                onSuccess={() => {
                  setIsEditing(false);
                  // React Query will automatically refetch via query invalidation in the mutation hook
                }}
                onCancel={() => setIsEditing(false)}
              />
            </CardContent>
          </Card>
        ) : (
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="view">View & Book</TabsTrigger>
              <TabsTrigger value="calendar">
                <CalendarIcon className="mr-2 h-4 w-4" />
                Availability
              </TabsTrigger>
              <TabsTrigger value="reviews">Reviews</TabsTrigger>
              {isOwner && <TabsTrigger value="bookings">Bookings</TabsTrigger>}
            </TabsList>

            <TabsContent value="view" className="space-y-6">
              {/* Image Gallery */}
              {listing.property?.imageUrl && (
                <ImageGallery
                  images={[String(listing.property.imageUrl)].filter(Boolean)}
                  title={String(listing.title || '')}
                  showThumbnails={false}
                />
              )}
              <BookingFlow listingId={listing.id} />
            </TabsContent>

            <TabsContent value="calendar" className="space-y-6">
              <EnhancedCalendar
                listingId={listing.id}
                listingTitle={listing.title}
                basePrice={Number(listing.base_price) || 0}
                mode={isOwner && isAuthenticated() ? 'manage' : 'view'}
                onDateSelect={(date) => {
                  // When public user clicks a date, switch to booking tab
                  if (!isOwner) {
                    setActiveTab('view');
                    // Could also pre-select the date in BookingFlow if needed
                  }
                }}
              />
            </TabsContent>

            <TabsContent value="reviews" className="space-y-6">
              <ReviewList
                listingId={listing.id}
                ownerId={listing.owner_id}
                showStatistics={true}
                showAddReview={true}
              />
            </TabsContent>

            {isOwner && isAuthenticated() && (
              <TabsContent value="bookings" className="space-y-6">
                <BookingList
                  listingId={listing.id}
                  mode="listing"
                  onBookingClick={(id) => navigate(`/bookings/${id}`)}
                />
              </TabsContent>
            )}
          </Tabs>
        )}
      </div>
    </ErrorBoundary>
  );
}

export default ShortletListingPage;
