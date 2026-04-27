import React, { useState, useEffect } from 'react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CalendarIcon, RefreshCw, XCircle, Clock } from 'lucide-react';
import { differenceInDays, format, parseISO } from 'date-fns';
import { getActiveLease } from '@/services/leases/leaseTerminationService';
import { useAuthSession } from '@/contexts/auth';
import { supabase } from '@/integrations/supabase/client';

export function LeaseExpirationNotice({
  onRenew,
  onTerminate,
}: {
  onRenew: () => void;
  onTerminate: () => void;
}) {
  const { user } = useAuthSession();
  const [lease, setLease] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [daysRemaining, setDaysRemaining] = useState<number | null>(null);

  useEffect(() => {
    const fetchLeaseData = async () => {
      if (!user?.id) return;

      setLoading(true);
      try {
        // Get the tenant_id from the tenants table using user_id
        const { data: tenantData, error: tenantError } = await supabase
          .from('tenants')
          .select('id')
          .eq('user_id', user.id)
          .single();

        if (tenantError) throw tenantError;

        if (tenantData) {
          const leaseData = await getActiveLease(tenantData.id);
          setLease(leaseData);

          if (leaseData && leaseData.end_date) {
            const endDate = parseISO(leaseData.end_date);
            const days = differenceInDays(endDate, new Date());
            setDaysRemaining(days);
          }
        }
      } catch (error) {
        console.error('Error fetching lease data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchLeaseData();
  }, [user?.id]);

  if (loading) {
    return (
      <Card className="animate-pulse">
        <CardHeader>
          <div className="h-6 w-3/4 rounded bg-muted"></div>
          <div className="mt-2 h-4 w-1/2 rounded bg-muted"></div>
        </CardHeader>
        <CardContent>
          <div className="h-20 rounded bg-muted"></div>
        </CardContent>
      </Card>
    );
  }

  if (!lease || !daysRemaining || daysRemaining > 90) {
    return null; // Don't show anything if no expiring lease or expiration is far away
  }

  return (
    <Card
      className={
        daysRemaining <= 30
          ? 'border-red-200 bg-red-50 dark:bg-red-900/10'
          : 'border-amber-200 bg-amber-50 dark:bg-amber-900/10'
      }
    >
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle>Lease Expiration Notice</CardTitle>
            <CardDescription>Your current lease for {lease.properties?.name}</CardDescription>
          </div>

          <Badge
            variant={daysRemaining <= 30 ? 'destructive' : 'outline'}
            className="flex items-center gap-1"
          >
            <Clock className="h-3 w-3" />
            <span>{daysRemaining} days remaining</span>
          </Badge>
        </div>
      </CardHeader>

      <CardContent>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <CalendarIcon className="h-4 w-4 text-muted-foreground" />
            <span>
              Lease Period: {format(parseISO(lease.start_date), 'MMM d, yyyy')} -
              <span className="font-semibold">
                {' '}
                {format(parseISO(lease.end_date), 'MMM d, yyyy')}
              </span>
            </span>
          </div>

          <p className="text-sm">
            {daysRemaining <= 30 ? (
              <span className="font-medium">
                Your lease is expiring soon. Please choose whether you would like to renew or
                terminate your lease.
              </span>
            ) : (
              <span>
                Your lease will be expiring in {daysRemaining} days. Please consider your options
                below.
              </span>
            )}
          </p>
        </div>
      </CardContent>

      <CardFooter className="flex gap-2 pt-0">
        <Button variant="outline" className="flex items-center gap-1" onClick={onRenew}>
          <RefreshCw className="mr-1 h-4 w-4" />
          <span>Request Renewal</span>
        </Button>

        <Button
          variant={daysRemaining <= 30 ? 'default' : 'outline'}
          className="flex items-center gap-1"
          onClick={onTerminate}
        >
          <XCircle className="mr-1 h-4 w-4" />
          <span>End Lease</span>
        </Button>
      </CardFooter>
    </Card>
  );
}
