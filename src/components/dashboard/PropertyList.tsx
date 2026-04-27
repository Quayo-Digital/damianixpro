import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Property } from '@/services/property';
import { Skeleton } from '@/components/ui/skeleton';
import { useNavigate } from 'react-router-dom';
import { Home } from 'lucide-react';
import { Link } from 'react-router-dom';

interface PropertyListProps {
  properties?: Property[];
  isLoading?: boolean;
}

export function PropertyList({ properties = [], isLoading = false }: PropertyListProps) {
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <div className="rounded-lg border border-border bg-card text-card-foreground shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b p-4">
          <h3 className="font-semibold">Your Properties</h3>
          <span className="text-sm text-muted-foreground">Loading…</span>
        </div>
        <div className="space-y-4 p-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="flex items-center space-x-4">
              <Skeleton className="h-10 w-10 rounded-md" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (properties.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-card p-10 text-center text-card-foreground shadow-sm">
        <h3 className="mb-2 text-lg font-medium">No properties found</h3>
        <p className="text-muted-foreground">You have not added any properties yet.</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border bg-card text-card-foreground shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b p-4">
        <h3 className="font-semibold">Your Properties</h3>
        <Link
          to="/properties"
          className="text-sm font-medium text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
        >
          View all in properties
        </Link>
      </div>
      <div className="overflow-auto p-4">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Property</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-[140px] text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {properties.slice(0, 5).map((property) => (
              <TableRow key={property.id}>
                <TableCell>
                  <div className="flex items-center space-x-3">
                    {property.imageUrl ? (
                      <img
                        src={property.imageUrl}
                        alt={property.name}
                        className="h-10 w-10 rounded-md object-cover"
                      />
                    ) : (
                      <div className="flex h-10 w-10 items-center justify-center rounded-md bg-muted">
                        <Home className="h-5 w-5 text-muted-foreground" />
                      </div>
                    )}
                    <span className="font-medium">{property.name}</span>
                  </div>
                </TableCell>
                <TableCell>{property.location}</TableCell>
                <TableCell>{property.type}</TableCell>
                <TableCell>
                  <Badge variant="secondary" className="bg-brand-light text-brand-primary">
                    {property.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    type="button"
                    size="sm"
                    className="min-w-[8rem]"
                    onClick={() => navigate(`/properties/${property.id}`)}
                  >
                    Open listing
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
