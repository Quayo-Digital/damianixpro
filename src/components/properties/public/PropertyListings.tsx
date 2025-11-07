
import { Link } from 'react-router-dom';
import { Building2, Filter, MapPin, Bed, Bath, Home, Ruler } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Property } from '@/services/property/types';
import { 
  Pagination, 
  PaginationContent, 
  PaginationItem, 
  PaginationLink, 
  PaginationNext, 
  PaginationPrevious
} from '@/components/ui/pagination';

interface PropertyListingsProps {
  loading: boolean;
  filteredProperties: Property[];
  currentProperties: Property[];
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onNextPage: () => void;
  onPrevPage: () => void;
  onClearFilters: () => void;
}

export function PropertyListings({ 
  loading, 
  filteredProperties,
  currentProperties,
  currentPage,
  totalPages,
  onPageChange,
  onNextPage,
  onPrevPage,
  onClearFilters 
}: PropertyListingsProps) {
  return (
    <>
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="h-[400px] animate-pulse">
              <div className="h-48 bg-muted rounded-t-lg" />
              <CardContent className="p-4">
                <div className="h-6 bg-muted rounded w-3/4 mb-2" />
                <div className="h-4 bg-muted rounded w-1/2 mb-4" />
                <div className="h-4 bg-muted rounded w-full mb-2" />
                <div className="h-4 bg-muted rounded w-2/3" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredProperties.length > 0 ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {currentProperties.map((property) => (
              <Link key={property.id} to={`/public/properties/${property.id}`} className="block group">
                <Card className="h-full transition-all duration-200 hover:shadow-md overflow-hidden">
                  <div className="h-48 relative overflow-hidden">
                    <img 
                      src={property.imageUrl || '/placeholder.svg'} 
                      alt={property.name}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                    <Badge className="absolute top-3 right-3 bg-primary/90">
                      {property.type.charAt(0).toUpperCase() + property.type.slice(1)}
                    </Badge>
                  </div>
                  <CardContent className="p-4">
                    <h3 className="text-xl font-semibold mb-1 group-hover:text-primary transition-colors line-clamp-1">
                      {property.name}
                    </h3>
                    <div className="flex items-center text-muted-foreground mb-3">
                      <MapPin className="h-4 w-4 mr-1 flex-shrink-0" />
                      <span className="text-sm line-clamp-1">{property.location} - {property.address}</span>
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-3 mb-3 text-sm">
                      {property.bedrooms && (
                        <div className="flex items-center">
                          <Bed className="h-4 w-4 mr-1" />
                          <span>{property.bedrooms} bed</span>
                        </div>
                      )}
                      {property.bathrooms && (
                        <div className="flex items-center">
                          <Bath className="h-4 w-4 mr-1" />
                          <span>{property.bathrooms} bath</span>
                        </div>
                      )}
                      {property.squareFeet && (
                        <div className="flex items-center">
                          <Ruler className="h-4 w-4 mr-1" />
                          <span>{property.squareFeet} sqft</span>
                        </div>
                      )}
                    </div>
                    
                    {property.features && property.features.length > 0 && (
                      <div className="flex flex-wrap gap-1 my-2">
                        {property.features.slice(0, 3).map((feature, index) => (
                          <Badge key={index} variant="outline" className="text-xs bg-primary/5">
                            {feature}
                          </Badge>
                        ))}
                        {property.features.length > 3 && (
                          <Badge variant="outline" className="text-xs bg-primary/5">
                            +{property.features.length - 3}
                          </Badge>
                        )}
                      </div>
                    )}
                    
                    <Separator className="my-3" />
                    
                    <div className="flex items-center justify-between">
                      <div className="font-medium text-lg">{property.price}</div>
                      <Button size="sm" variant="outline">View Details</Button>
                    </div>
                  </CardContent>
                </Card>
              </Link>
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
                      className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
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
                      className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"} 
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-12">
          <Building2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-xl font-medium mb-2">No properties found</h3>
          <p className="text-muted-foreground mb-6">
            Try adjusting your search filters or check back later for new listings
          </p>
          <Button variant="outline" onClick={onClearFilters}>
            Clear Filters
          </Button>
        </div>
      )}
    </>
  );
}
