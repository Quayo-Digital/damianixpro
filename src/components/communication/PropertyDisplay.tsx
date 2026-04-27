import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuthSession } from '@/contexts/auth';
import { supabase } from '@/integrations/supabase/client';
import { mapSupabaseToProperty } from '@/services/property/utils';
import {
  isLeaseAgreementsRelationMissing,
  resolveLeaseAgreementsTablePresence,
} from '@/services/leases/enrichLeaseAgreements';
import { Building2, MapPin, Bed, Bath, Square, Calendar, DollarSign } from 'lucide-react';

/** Lease rows without PostgREST embed (FK may be missing on `lease_agreements` / `leases`). */
const LEASE_BASE_FIELDS = 'id, property_id, start_date, end_date, monthly_rent, status, created_at';

const PROPERTY_SELECT_FOR_DISPLAY =
  'id, name, address, city, state, shortlet_details, latitude, longitude, status, tour_url, amenities, features, owner_id, agent_id, organization_id, is_shortlet, created_at';

async function withMappedPropertyForLease<T extends { property_id?: string | null }>(
  leaseRow: T | null
): Promise<(T & { properties: ReturnType<typeof mapSupabaseToProperty> | null }) | null> {
  if (!leaseRow) return null;
  if (!leaseRow.property_id) {
    return { ...leaseRow, properties: null } as T & {
      properties: ReturnType<typeof mapSupabaseToProperty> | null;
    };
  }
  const { data: propRow } = await supabase
    .from('properties')
    .select(PROPERTY_SELECT_FOR_DISPLAY)
    .eq('id', leaseRow.property_id)
    .maybeSingle();
  return {
    ...leaseRow,
    properties: propRow ? mapSupabaseToProperty(propRow) : null,
  } as T & { properties: ReturnType<typeof mapSupabaseToProperty> | null };
}
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';

interface PropertyDisplayProps {
  className?: string;
}

export function PropertyDisplay({ className }: PropertyDisplayProps) {
  const { user } = useAuthSession();
  const [property, setProperty] = useState<any>(null);
  const [lease, setLease] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProperty = async () => {
      if (!user?.id) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);

        // Get tenant record
        const { data: tenant, error: tenantError } = await supabase
          .from('tenants')
          .select('id')
          .eq('user_id', user.id)
          .maybeSingle();

        if (tenantError || !tenant) {
          console.error('Error fetching tenant:', tenantError);
          setLoading(false);
          return;
        }

        // Get active lease - try both table names
        let leaseData = null;

        // Try leases table first (no embed — FK may be missing in PostgREST cache)
        const { data: leaseFromLeases, error: leaseError } = await supabase
          .from('leases')
          .select(LEASE_BASE_FIELDS)
          .eq('tenant_id', tenant.id)
          .eq('status', 'ACTIVE')
          .maybeSingle();

        if (!leaseError && leaseFromLeases) {
          leaseData = await withMappedPropertyForLease(leaseFromLeases);
        } else {
          const agreementsPresence = await resolveLeaseAgreementsTablePresence();
          if (agreementsPresence !== 'missing') {
            const { data: leaseFromAgreements, error: agreementError } = await supabase
              .from('lease_agreements')
              .select(LEASE_BASE_FIELDS)
              .eq('tenant_id', tenant.id)
              .eq('status', 'active')
              .maybeSingle();

            if (agreementError && !isLeaseAgreementsRelationMissing(agreementError)) {
              console.warn('PropertyDisplay: lease_agreements query failed:', agreementError);
            } else if (!agreementError && leaseFromAgreements) {
              leaseData = await withMappedPropertyForLease(leaseFromAgreements);
            }
          }
        }

        // If still no lease, try without status filter (in case status values differ)
        if (!leaseData) {
          const { data: anyLease, error: anyLeaseError } = await supabase
            .from('leases')
            .select(LEASE_BASE_FIELDS)
            .eq('tenant_id', tenant.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

          if (!anyLeaseError && anyLease) {
            leaseData = await withMappedPropertyForLease(anyLease);
          }
        }

        if (leaseData) {
          setLease(leaseData);
          // Property data is nested in the lease response
          const propertyData = (leaseData as any).properties || leaseData.property;
          if (propertyData) {
            setProperty(propertyData);
          }
        }
      } catch (error) {
        console.error('Error fetching property:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProperty();
  }, [user?.id]);

  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="flex gap-6">
            <Skeleton className="h-48 w-64 rounded-lg" />
            <div className="flex-1 space-y-4">
              <Skeleton className="h-8 w-3/4" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
              <div className="mt-4 flex gap-4">
                <Skeleton className="h-6 w-20" />
                <Skeleton className="h-6 w-20" />
                <Skeleton className="h-6 w-20" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!property) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="py-8 text-center">
            <Building2 className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
            <p className="text-muted-foreground">No active property found</p>
            <p className="mt-2 text-sm text-muted-foreground">
              You need an active lease to view property details.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const propertyName = property.name || property.title || 'Property';
  const propertyAddress = property.address || property.location || 'Address not available';
  const propertyImage = property.imageUrl || (property.images && property.images[0]) || null;
  const bedrooms = property.bedrooms;
  const bathrooms = property.bathrooms;
  const squareFeet = property.square_feet || property.area_sqm || property.squareFeet;
  // Nigeria: display annual rent (lease_price is annual, monthly_rent is derived)
  const annualRent =
    lease?.lease_price ?? ((lease?.monthly_rent || 0) * 12 || property.lease_price || 0);

  return (
    <Card className={className}>
      <CardContent className="p-6">
        <div className="flex flex-col gap-6 md:flex-row">
          {/* Property Image */}
          {propertyImage && (
            <div className="w-full md:w-64">
              <img
                src={propertyImage}
                alt={propertyName}
                className="h-48 w-full rounded-lg object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            </div>
          )}

          {/* Property Details */}
          <div className="flex-1 space-y-4">
            <div>
              <div className="mb-2 flex items-start justify-between">
                <h2 className="text-2xl font-bold">{propertyName}</h2>
                {(property.property_type || property.type) && (
                  <Badge variant="secondary" className="ml-2">
                    {property.property_type || property.type}
                  </Badge>
                )}
              </div>
              <div className="flex items-center text-muted-foreground">
                <MapPin className="mr-1 h-4 w-4" />
                <span>{propertyAddress}</span>
                {property.city && property.state && (
                  <span className="ml-2">
                    {property.city}, {property.state}
                  </span>
                )}
              </div>
            </div>

            {/* Property Features */}
            <div className="flex flex-wrap gap-4">
              {bedrooms !== null && bedrooms !== undefined && (
                <div className="flex items-center gap-2">
                  <Bed className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">
                    {bedrooms} Bedroom{bedrooms !== 1 ? 's' : ''}
                  </span>
                </div>
              )}
              {bathrooms !== null && bathrooms !== undefined && (
                <div className="flex items-center gap-2">
                  <Bath className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">
                    {bathrooms} Bathroom{bathrooms !== 1 ? 's' : ''}
                  </span>
                </div>
              )}
              {squareFeet && (
                <div className="flex items-center gap-2">
                  <Square className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">
                    {squareFeet} {property.area_sqm ? 'sqm' : 'sqft'}
                  </span>
                </div>
              )}
            </div>

            {/* Lease Information */}
            {lease && (
              <div className="grid grid-cols-1 gap-4 border-t pt-4 md:grid-cols-3">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Lease Start</p>
                    <p className="text-sm font-medium">
                      {lease.start_date ? format(new Date(lease.start_date), 'MMM d, yyyy') : 'N/A'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Lease End</p>
                    <p className="text-sm font-medium">
                      {lease.end_date ? format(new Date(lease.end_date), 'MMM d, yyyy') : 'N/A'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Annual Rent</p>
                    <p className="text-sm font-medium">₦{annualRent.toLocaleString()}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Property Description */}
            {property.description && (
              <div className="border-t pt-4">
                <p className="line-clamp-2 text-sm text-muted-foreground">{property.description}</p>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
