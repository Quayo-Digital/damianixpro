import { useState } from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Star, Mail, Phone, MapPin, Clock, CheckCircle2 } from 'lucide-react';
import { Vendor } from './vendor-data';
import { VendorJobsDialog } from './VendorJobsDialog';

interface VendorCardProps {
  vendor: Vendor;
}

export function VendorCard({ vendor }: VendorCardProps) {
  const [showJobs, setShowJobs] = useState(false);

  const completionRate = Math.round((vendor.completedJobs / vendor.totalJobs) * 100);

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <CardTitle>{vendor.name}</CardTitle>
          <Badge variant={vendor.active ? 'default' : 'outline'}>
            {vendor.active ? 'Active' : 'Inactive'}
          </Badge>
        </div>
        <div className="mt-1 flex items-center gap-1 text-amber-500">
          {[...Array(5)].map((_, i) => (
            <Star
              key={i}
              className="h-4 w-4"
              fill={i < Math.floor(vendor.rating) ? 'currentColor' : 'none'}
            />
          ))}
          <span className="ml-1 text-sm text-muted-foreground">{vendor.rating.toFixed(1)}</span>
        </div>
      </CardHeader>
      <CardContent className="pb-2">
        <div className="mb-3">
          <Badge variant="outline" className="mb-2">
            {vendor.category}
          </Badge>
          <div className="mt-1 flex flex-wrap gap-1">
            {vendor.specialties.map((specialty, index) => (
              <Badge key={index} variant="secondary" className="text-xs">
                {specialty}
              </Badge>
            ))}
          </div>
        </div>

        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2">
            <Mail className="h-4 w-4 text-muted-foreground" />
            <span>{vendor.email}</span>
          </div>
          <div className="flex items-center gap-2">
            <Phone className="h-4 w-4 text-muted-foreground" />
            <span>{vendor.phone}</span>
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-muted-foreground" />
            <span>{vendor.address}</span>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-2 text-center">
          <div className="rounded-md bg-muted/30 p-2">
            <div className="text-lg font-medium">{vendor.totalJobs}</div>
            <div className="text-xs text-muted-foreground">Total Jobs</div>
          </div>
          <div className="rounded-md bg-muted/30 p-2">
            <div className="text-lg font-medium">{completionRate}%</div>
            <div className="text-xs text-muted-foreground">Completion</div>
          </div>
          <div className="rounded-md bg-muted/30 p-2">
            <div className="flex items-center justify-center gap-1">
              <Clock className="h-3 w-3" />
              <span className="text-sm font-medium">{vendor.responseTime}</span>
            </div>
            <div className="text-xs text-muted-foreground">Avg. Response</div>
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <div className="flex w-full justify-between">
          <Button variant="outline" size="sm" onClick={() => setShowJobs(true)}>
            View Jobs
          </Button>
          <Button size="sm">
            <CheckCircle2 className="mr-1 h-4 w-4" /> Assign Job
          </Button>
        </div>
      </CardFooter>

      {showJobs && (
        <VendorJobsDialog
          vendorId={vendor.id}
          vendorName={vendor.name}
          open={showJobs}
          onClose={() => setShowJobs(false)}
        />
      )}
    </Card>
  );
}
