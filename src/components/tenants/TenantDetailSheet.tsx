import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Mail, Phone, MapPin, Calendar, DollarSign, Building2 } from 'lucide-react';
import { Tenant } from '@/hooks/useTenants';
import { formatCurrency } from '@/lib/utils';
import { annualRentNgn } from '@/utils/nigeriaRent';

interface TenantDetailSheetProps {
  tenant: Tenant | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TenantDetailSheet({ tenant, open, onOpenChange }: TenantDetailSheetProps) {
  if (!tenant) return null;

  const fullName = `${tenant.first_name} ${tenant.last_name}`.trim() || 'Unknown';
  const initials =
    `${tenant.first_name?.[0] || ''}${tenant.last_name?.[0] || ''}`.toUpperCase() || '?';

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>Tenant Details</SheetTitle>
          <SheetDescription>View tenant information and lease details</SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src={tenant.user?.avatar_url} alt={fullName} />
              <AvatarFallback className="text-lg">{initials}</AvatarFallback>
            </Avatar>
            <div>
              <h3 className="text-lg font-semibold">{fullName}</h3>
              <Badge variant={tenant.status === 'active' ? 'default' : 'secondary'}>
                {tenant.status}
              </Badge>
            </div>
          </div>

          <Separator />

          <div className="space-y-3">
            <h4 className="text-sm font-medium text-muted-foreground">Contact Information</h4>
            {tenant.email && (
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <a href={`mailto:${tenant.email}`} className="text-sm hover:underline">
                  {tenant.email}
                </a>
              </div>
            )}
            {tenant.phone && (
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <a href={`tel:${tenant.phone}`} className="text-sm hover:underline">
                  {tenant.phone}
                </a>
              </div>
            )}
          </div>

          {tenant.property && (
            <>
              <Separator />
              <div className="space-y-3">
                <h4 className="text-sm font-medium text-muted-foreground">Property</h4>
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="font-medium">{tenant.property.title || tenant.property.type}</p>
                    {tenant.property.address && (
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <MapPin className="h-3 w-3" />
                        {tenant.property.address}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}

          {tenant.lease && (
            <>
              <Separator />
              <div className="space-y-3">
                <h4 className="text-sm font-medium text-muted-foreground">Lease Details</h4>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">
                      Annual rent:{' '}
                      {formatCurrency(annualRentNgn({ monthly_rent: tenant.lease.monthly_rent }))}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">
                      {new Date(tenant.lease.start_date).toLocaleDateString()} –{' '}
                      {new Date(tenant.lease.end_date).toLocaleDateString()}
                    </span>
                  </div>
                  <Badge variant="outline">{tenant.lease.status}</Badge>
                </div>
              </div>
            </>
          )}

          <div className="text-xs text-muted-foreground">
            <p>Added: {new Date(tenant.created_at).toLocaleDateString()}</p>
            <p>Last updated: {new Date(tenant.updated_at).toLocaleDateString()}</p>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
