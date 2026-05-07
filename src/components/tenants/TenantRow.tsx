import { TableRow, TableCell } from '@/components/ui/table';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Home, Mail, Phone } from 'lucide-react';
import { Tenant } from '@/services/tenants/tenantApi';

interface TenantRowProps {
  tenant: Tenant;
  onViewTenant: (id: string) => void;
}

export function TenantRow({ tenant, onViewTenant }: TenantRowProps) {
  return (
    <TableRow>
      <TableCell>
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="bg-brand-light text-brand-primary">
              {tenant.first_name[0]}
              {tenant.last_name[0]}
            </AvatarFallback>
          </Avatar>
          <div>
            {tenant.first_name} {tenant.last_name}
          </div>
        </div>
      </TableCell>
      <TableCell>
        {tenant.properties.length > 0 ? (
          <div className="flex items-center gap-1">
            <Home className="h-4 w-4" />
            <span>{tenant.properties[0].name}</span>
          </div>
        ) : (
          <span className="text-sm italic text-muted-foreground">No property</span>
        )}
      </TableCell>
      <TableCell>
        <div className="space-y-1">
          <div className="flex items-center gap-1">
            <Mail className="h-3 w-3" />
            <span className="text-xs">{tenant.email}</span>
          </div>
          <div className="flex items-center gap-1">
            <Phone className="h-3 w-3" />
            <span className="text-xs">{tenant.phone}</span>
          </div>
        </div>
      </TableCell>
      <TableCell>
        <Badge
          variant={tenant.status === 'active' ? 'default' : 'secondary'}
          className={
            tenant.status === 'active' ? 'bg-primary/15 text-primary hover:bg-primary/20' : ''
          }
        >
          {tenant.status === 'active' ? 'Active' : 'Inactive'}
        </Badge>
      </TableCell>
      <TableCell>
        {tenant.rent_amount ? (
          <span>₦{tenant.rent_amount.toLocaleString()}</span>
        ) : (
          <span className="text-muted-foreground">-</span>
        )}
      </TableCell>
      <TableCell>
        <Button variant="ghost" size="sm" onClick={() => onViewTenant(tenant.id)}>
          View
        </Button>
      </TableCell>
    </TableRow>
  );
}
