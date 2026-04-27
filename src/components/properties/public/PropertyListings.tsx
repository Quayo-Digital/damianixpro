import { Link } from 'react-router-dom';
import { Building2, Filter, MapPin, Bed, Bath, Home, Ruler } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Property } from '@/services/property/types';
import { PropertyLeaseSummaryBadges } from '@/components/properties/PropertyLeaseSummaryBadges';
import { UserPreferences } from '@/types/preferences';
import { getPreferenceMatchScore } from '@/utils/preferenceFilters';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';

interface PropertyListingsProps {
  loading: boolean;
  preferences: UserPreferences | null | undefined;
  preferencesLoading?: boolean;
  salesModeActive?: boolean;
  filteredProperties: Property[];
  currentProperties: Property[];
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onNextPage: () => void;
  onPrevPage: () => void;
  onSwitchCity?: (city: string) => void;
  onClearFilters: () => void;
}

export function PropertyListings({
  loading,
  preferences,
  preferencesLoading = false,
  salesModeActive = false,
  filteredProperties,
  currentProperties,
  currentPage,
  totalPages,
  onPageChange,
  onNextPage,
  onPrevPage,
  onSwitchCity,
  onClearFilters,
}: PropertyListingsProps) {
  const showMatchScore = !preferencesLoading && !!preferences;

  const getMatchScorePercent = (property: Property): number => {
    if (!preferences) return 0;
    return Math.round(getPreferenceMatchScore(property, preferences) * 100);
  };

  return (
    <>
      {loading ? (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <Card
              key={i}
              className="h-[400px] animate-pulse overflow-hidden rounded-2xl border-border bg-card/90"
            >
              <div className="h-48 rounded-t-2xl bg-muted" />
              <CardContent className="p-4">
                <div className="mb-2 h-6 w-3/4 rounded bg-muted" />
                <div className="mb-4 h-4 w-1/2 rounded bg-muted" />
                <div className="mb-2 h-4 w-full rounded bg-muted" />
                <div className="h-4 w-2/3 rounded bg-muted" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredProperties.length > 0 ? (
        <>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {currentProperties.map((property) => (
              <Card
                key={property.id}
                className="group h-full overflow-hidden rounded-2xl border-border bg-card/95 shadow-[0_14px_34px_rgba(16,24,40,0.1)] backdrop-blur-md transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_20px_48px_rgba(16,24,40,0.14)] dark:bg-card dark:shadow-[0_14px_34px_rgba(0,0,0,0.35)]"
              >
                <Link to={`/public/properties/${property.id}`} className="block">
                  <div className="relative h-48 overflow-hidden">
                    <img
                      src={property.imageUrl || '/placeholder.svg'}
                      alt={property.name}
                      loading="lazy"
                      decoding="async"
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-black/10 to-transparent" />
                    <Badge className="absolute right-3 top-3 border border-border bg-card/95 text-foreground backdrop-blur-sm">
                      {property.type.charAt(0).toUpperCase() + property.type.slice(1)}
                    </Badge>
                    <PropertyLeaseSummaryBadges
                      property={property}
                      className="absolute bottom-3 left-3 z-10 max-w-[calc(100%-1.5rem)]"
                    />
                  </div>
                </Link>
                <CardContent className="p-4">
                  <Link to={`/public/properties/${property.id}`} className="block">
                    <h3 className="premium-title mb-1 line-clamp-1 text-xl transition-colors group-hover:text-primary">
                      {property.name}
                    </h3>
                  </Link>
                  <div className="mb-3 flex items-center text-muted-foreground">
                    <MapPin className="mr-1 h-4 w-4 flex-shrink-0" />
                    <span className="line-clamp-1 text-sm">
                      {property.location} - {property.address}
                    </span>
                  </div>

                  <div className="mb-3 flex flex-wrap items-center gap-3 text-sm">
                    {property.bedrooms && (
                      <div className="flex items-center">
                        <Bed className="mr-1 h-4 w-4" />
                        <span>{property.bedrooms} bed</span>
                      </div>
                    )}
                    {property.bathrooms && (
                      <div className="flex items-center">
                        <Bath className="mr-1 h-4 w-4" />
                        <span>{property.bathrooms} bath</span>
                      </div>
                    )}
                    {property.squareFeet && (
                      <div className="flex items-center">
                        <Ruler className="mr-1 h-4 w-4" />
                        <span>{property.squareFeet} sqft</span>
                      </div>
                    )}
                  </div>

                  {showMatchScore && (
                    <div className="mb-2">
                      <Badge
                        variant="secondary"
                        className="rounded-full border border-emerald-200 bg-emerald-50 text-emerald-800"
                      >
                        Match Score: {getMatchScorePercent(property)}%
                      </Badge>
                    </div>
                  )}

                  {property.features && property.features.length > 0 && (
                    <div className="my-2 flex flex-wrap gap-1">
                      {property.features.slice(0, 3).map((feature) => (
                        <Badge
                          key={feature}
                          variant="outline"
                          className="rounded-full border-primary/25 bg-primary/5 text-xs"
                        >
                          {feature}
                        </Badge>
                      ))}
                      {property.features.length > 3 && (
                        <Badge
                          variant="outline"
                          className="rounded-full border-primary/25 bg-primary/5 text-xs"
                        >
                          +{property.features.length - 3}
                        </Badge>
                      )}
                    </div>
                  )}

                  <Separator className="my-3" />

                  <div className="flex items-center justify-between">
                    <div className="text-lg font-semibold text-primary">{property.price}</div>
                    <Button size="sm" variant="outline" className="rounded-full" asChild>
                      <Link to={`/public/properties/${property.id}`}>View Details</Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-8">
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      onClick={onPrevPage}
                      className={
                        currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'
                      }
                    />
                  </PaginationItem>

                  {[...Array(totalPages)].map((_, index) => {
                    const pageNumber = index + 1;
                    // Only show 5 page numbers at a time with ellipsis
                    if (
                      pageNumber === 1 ||
                      pageNumber === totalPages ||
                      (pageNumber >= currentPage - 1 && pageNumber <= currentPage + 1)
                    ) {
                      return (
                        <PaginationItem key={pageNumber}>
                          <PaginationLink
                            onClick={() => onPageChange(pageNumber)}
                            isActive={currentPage === pageNumber}
                          >
                            {pageNumber}
                          </PaginationLink>
                        </PaginationItem>
                      );
                    }
                    // Add ellipsis if needed
                    if (pageNumber === currentPage - 2 || pageNumber === currentPage + 2) {
                      return (
                        <PaginationItem key={`ellipsis-${pageNumber}`}>
                          <span className="flex h-9 w-9 items-center justify-center">...</span>
                        </PaginationItem>
                      );
                    }
                    return null;
                  })}

                  <PaginationItem>
                    <PaginationNext
                      onClick={onNextPage}
                      className={
                        currentPage === totalPages
                          ? 'pointer-events-none opacity-50'
                          : 'cursor-pointer'
                      }
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </>
      ) : (
        <div className="glass-panel rounded-2xl py-12 text-center">
          <div className="mx-auto mb-5 h-44 w-full max-w-md overflow-hidden rounded-xl border border-border">
            <img
              src="/sales/sales-demo-residential-modern-estate.png"
              alt="Sample property preview"
              loading="lazy"
              decoding="async"
              className="h-full w-full object-cover"
            />
          </div>
          <Building2 className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
          {salesModeActive ? (
            <>
              <h3 className="mb-2 text-xl font-medium">No matching SALE listings yet</h3>
              <p className="mb-6 text-muted-foreground">
                Try clearing filters, checking another city, or contacting sales for off-market
                opportunities.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-2">
                <Button variant="outline" className="rounded-full" onClick={onClearFilters}>
                  Clear Filters
                </Button>
                <Button
                  variant="outline"
                  className="rounded-full"
                  onClick={() => onSwitchCity?.('Abuja')}
                  disabled={!onSwitchCity}
                >
                  Switch to Abuja
                </Button>
                <Button asChild className="rounded-full">
                  <Link to="/contact">Contact Sales</Link>
                </Button>
              </div>
            </>
          ) : (
            <>
              <h3 className="mb-2 text-xl font-medium">No properties found</h3>
              <p className="mb-6 text-muted-foreground">
                Try adjusting your search filters or check back later for new listings
              </p>
              <Button variant="outline" className="rounded-full" onClick={onClearFilters}>
                Clear Filters
              </Button>
            </>
          )}
        </div>
      )}
    </>
  );
}
