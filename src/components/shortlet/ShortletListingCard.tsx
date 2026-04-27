/**
 * Short-Let Listing Card Component
 * Displays a short-let listing in card format
 */

import React from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  MapPin,
  Users,
  Star,
  Wifi,
  Car,
  UtensilsCrossed,
  Waves,
  Calendar,
  Edit,
  Trash2,
} from 'lucide-react';
import { format } from 'date-fns';
import type { Listing } from '@/services/shortlet/types';

interface ShortletListingCardProps {
  listing: Listing;
  onView?: (listingId: string) => void;
  onEdit?: (listingId: string) => void;
  onDelete?: (listingId: string) => void;
  showActions?: boolean;
  viewMode?: 'grid' | 'list';
}

export function ShortletListingCard({
  listing,
  onView,
  onEdit,
  onDelete,
  showActions = false,
  viewMode = 'grid',
}: ShortletListingCardProps) {
  const amenities = listing.amenities || {};

  // List view variant
  if (viewMode === 'list') {
    return (
      <Card className="overflow-hidden transition-shadow hover:shadow-lg">
        <div className="flex flex-col md:flex-row">
          {listing.property?.imageUrl && (
            <div className="h-48 flex-shrink-0 overflow-hidden bg-muted md:h-auto md:w-64">
              <img
                src={listing.property.imageUrl}
                alt={listing.title}
                loading="lazy"
                decoding="async"
                className="h-full w-full object-cover"
              />
            </div>
          )}
          <div className="flex flex-1 flex-col">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="mb-1 text-xl">{listing.title}</CardTitle>
                  <CardDescription className="mt-1 flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    {listing.property?.address || 'Location not specified'}
                  </CardDescription>
                </div>
                <Badge variant={listing.active ? 'default' : 'secondary'}>
                  {listing.active ? 'Active' : 'Inactive'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="flex-1 space-y-3">
              <p className="line-clamp-2 text-sm text-muted-foreground">{listing.description}</p>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Users className="h-4 w-4" />
                  <span>{listing.capacity} guests</span>
                </div>
                {listing.instant_book && (
                  <Badge variant="outline" className="text-xs">
                    Instant Book
                  </Badge>
                )}
              </div>
              {Object.keys(amenities).length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {amenities.wifi && (
                    <Badge variant="outline" className="text-xs">
                      <Wifi className="mr-1 h-3 w-3" />
                      WiFi
                    </Badge>
                  )}
                  {amenities.parking && (
                    <Badge variant="outline" className="text-xs">
                      <Car className="mr-1 h-3 w-3" />
                      Parking
                    </Badge>
                  )}
                  {amenities.kitchen && (
                    <Badge variant="outline" className="text-xs">
                      <UtensilsCrossed className="mr-1 h-3 w-3" />
                      Kitchen
                    </Badge>
                  )}
                  {amenities.pool && (
                    <Badge variant="outline" className="text-xs">
                      <Waves className="mr-1 h-3 w-3" />
                      Pool
                    </Badge>
                  )}
                </div>
              )}
            </CardContent>
            <CardFooter className="flex items-center justify-between border-t pt-4">
              <div>
                <p className="text-2xl font-bold">₦{Number(listing.base_price).toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">per night</p>
              </div>
              {showActions ? (
                <div className="flex gap-2">
                  {onEdit && (
                    <Button variant="outline" size="sm" onClick={() => onEdit(String(listing.id))}>
                      <Edit className="mr-2 h-4 w-4" />
                      Edit
                    </Button>
                  )}
                  {onDelete && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onDelete(String(listing.id))}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </Button>
                  )}
                </div>
              ) : (
                <Button onClick={() => onView?.(String(listing.id))}>
                  <Calendar className="mr-2 h-4 w-4" />
                  View & Book
                </Button>
              )}
            </CardFooter>
          </div>
        </div>
      </Card>
    );
  }

  // Grid view (default)
  return (
    <Card className="overflow-hidden transition-shadow hover:shadow-lg">
      {listing.property?.imageUrl && (
        <div className="aspect-video w-full overflow-hidden bg-muted">
          <img
            src={listing.property.imageUrl}
            alt={listing.title}
            loading="lazy"
            decoding="async"
            className="h-full w-full object-cover"
          />
        </div>
      )}
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="mb-1 text-xl">{listing.title}</CardTitle>
            <CardDescription className="mt-1 flex items-center gap-1">
              <MapPin className="h-4 w-4" />
              {listing.property?.address || 'Location not specified'}
            </CardDescription>
          </div>
          <Badge variant={listing.active ? 'default' : 'secondary'}>
            {listing.active ? 'Active' : 'Inactive'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="line-clamp-2 text-sm text-muted-foreground">{listing.description}</p>

        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Users className="h-4 w-4" />
            <span>{listing.capacity} guests</span>
          </div>
          {listing.instant_book && (
            <Badge variant="outline" className="text-xs">
              Instant Book
            </Badge>
          )}
        </div>

        {Object.keys(amenities).length > 0 && (
          <div className="flex flex-wrap gap-2">
            {amenities.wifi && (
              <Badge variant="outline" className="text-xs">
                <Wifi className="mr-1 h-3 w-3" />
                WiFi
              </Badge>
            )}
            {amenities.parking && (
              <Badge variant="outline" className="text-xs">
                <Car className="mr-1 h-3 w-3" />
                Parking
              </Badge>
            )}
            {amenities.kitchen && (
              <Badge variant="outline" className="text-xs">
                <UtensilsCrossed className="mr-1 h-3 w-3" />
                Kitchen
              </Badge>
            )}
            {amenities.pool && (
              <Badge variant="outline" className="text-xs">
                <Waves className="mr-1 h-3 w-3" />
                Pool
              </Badge>
            )}
          </div>
        )}

        <div className="flex items-center justify-between border-t pt-2">
          <div>
            <p className="text-2xl font-bold">₦{Number(listing.base_price).toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">per night</p>
          </div>
          {listing.cleaning_fee > 0 && (
            <div className="text-right">
              <p className="text-sm text-muted-foreground">
                + ₦{Number(listing.cleaning_fee).toLocaleString()}
              </p>
              <p className="text-xs text-muted-foreground">cleaning fee</p>
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter className="flex gap-2">
        {showActions ? (
          <>
            {onEdit && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onEdit(String(listing.id))}
                className="flex-1"
              >
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </Button>
            )}
            {onDelete && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onDelete(String(listing.id))}
                className="flex-1"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </Button>
            )}
          </>
        ) : (
          <Button className="flex-1" onClick={() => onView?.(String(listing.id))}>
            <Calendar className="mr-2 h-4 w-4" />
            View & Book
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
