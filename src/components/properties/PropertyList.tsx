import { Property } from '@/services/property';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Edit } from 'lucide-react';

interface PropertyListProps {
  properties: Property[];
  isLoading?: boolean;
  onEdit?: (property: Property) => void;
  onRefresh?: () => void;
}

export function PropertyList({ properties, isLoading = false, onEdit }: PropertyListProps) {
  if (isLoading) {
    return (
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Property</TableHead>
              <TableHead className="hidden md:table-cell">Type</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {[...Array(5)].map((_, i) => (
              <TableRow key={i}>
                <TableCell>
                  <Skeleton className="mb-1 h-4 w-32" />
                  <Skeleton className="h-3 w-48" />
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  <Skeleton className="h-4 w-24" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-4 w-20" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-6 w-24 rounded-full" />
                </TableCell>
                <TableCell className="text-right">
                  <Skeleton className="h-8 w-8 rounded-md" />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  }

  if (properties.length === 0) {
    return (
      <div className="rounded-lg border p-10 text-center">
        <h3 className="mb-2 text-lg font-medium">No properties found</h3>
        <p className="mb-4 text-muted-foreground">
          There are no properties matching your filters. Try adjusting your search or add a new
          property.
        </p>
      </div>
    );
  }

  const getStatusVariant = (status: Property['status']) => {
    switch (status) {
      case 'Available':
        return 'default';
      case 'Rented':
        return 'secondary';
      case 'Sold':
        return 'destructive';
      case 'Under Maintenance':
        return 'outline';
      default:
        return 'default';
    }
  };

  return (
    <div className="overflow-auto rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Property</TableHead>
            <TableHead className="hidden md:table-cell">Type</TableHead>
            <TableHead>Price</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {properties.map((property) => (
            <TableRow key={property.id}>
              <TableCell>
                <div className="font-medium">{property.name}</div>
                <div className="hidden text-sm text-muted-foreground md:block">
                  {property.address}
                </div>
              </TableCell>
              <TableCell className="hidden capitalize md:table-cell">{property.type}</TableCell>
              <TableCell>
                {new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(
                  Number(property.price)
                )}
              </TableCell>
              <TableCell>
                <Badge variant={getStatusVariant(property.status)}>{property.status}</Badge>
              </TableCell>
              <TableCell className="text-right">
                {onEdit && (
                  <Button variant="ghost" size="icon" onClick={() => onEdit(property)}>
                    <Edit className="h-4 w-4" />
                    <span className="sr-only">Edit Property</span>
                  </Button>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
