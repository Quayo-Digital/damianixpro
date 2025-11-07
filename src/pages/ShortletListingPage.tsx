/**
 * Short-Let Listing Page
 * View and manage a single short-let listing
 */

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ShortletCalendar } from '@/components/shortlet/ShortletCalendar';
import { BookingFlow } from '@/components/shortlet/BookingFlow';
import { ShortletListingForm } from '@/components/shortlet/ShortletListingForm';
import { BookingList } from '@/components/shortlet/BookingList';
import { ReviewList } from '@/components/shortlet/ReviewList';
import { ImageGallery } from '@/components/shortlet/ImageGallery';
import { useAuth } from '@/contexts/auth';
import { getListingById } from '@/services/shortlet/api/listings';
import { Loader2, ArrowLeft, Edit, Calendar as CalendarIcon, Home } from 'lucide-react';
import type { Listing } from '@/services/shortlet/types';

export function ShortletListingPage() {
  const { listingId } = useParams<{ listingId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [listing, setListing] = useState<Listing | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('view');
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (listingId) {
      loadListing();
    }
  }, [listingId]);

  const loadListing = async () => {
    if (!listingId) return;
    setIsLoading(true);
    try {
      const data = await getListingById(listingId);
      setListing(data);
    } catch (error) {
      console.error('Error loading listing:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const isOwner = listing?.owner_id === user?.id;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">Listing not found</p>
            <Button onClick={() => navigate('/shortlets')} className="mt-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Listings
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
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
        {isOwner && (
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setIsEditing(!isEditing)}
            >
              <Edit className="h-4 w-4 mr-2" />
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
                loadListing();
              }}
              onCancel={() => setIsEditing(false)}
            />
          </CardContent>
        </Card>
      ) : (
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="view">View & Book</TabsTrigger>
            <TabsTrigger value="reviews">Reviews</TabsTrigger>
            {isOwner && (
              <>
                <TabsTrigger value="calendar">
                  <CalendarIcon className="h-4 w-4 mr-2" />
                  Calendar
                </TabsTrigger>
                <TabsTrigger value="bookings">Bookings</TabsTrigger>
              </>
            )}
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

          <TabsContent value="reviews" className="space-y-6">
            <ReviewList listingId={listing.id} showStatistics={true} />
          </TabsContent>

          {isOwner && (
            <>
              <TabsContent value="calendar" className="space-y-6">
                <ShortletCalendar
                  listingId={listing.id}
                  listingTitle={listing.title}
                  mode="manage"
                />
              </TabsContent>

              <TabsContent value="bookings" className="space-y-6">
                <BookingList 
                  listingId={listing.id}
                  mode="listing"
                  onBookingClick={(id) => navigate(`/bookings/${id}`)}
                />
              </TabsContent>
            </>
          )}
        </Tabs>
      )}
    </div>
  );
}

