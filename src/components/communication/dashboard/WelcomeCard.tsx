
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';

interface WelcomeCardProps {
  name: string;
  property: string;
  leaseStart: string;
  leaseEnd: string;
  nextPayment: string;
  paymentAmount: number;
  onMakePayment: () => void;
}

export function WelcomeCard({
  name,
  property,
  leaseStart,
  leaseEnd,
  nextPayment,
  paymentAmount,
  onMakePayment,
}: WelcomeCardProps) {
  // Helper function to safely format dates
  const formatDate = (dateString: string) => {
    if (!dateString || dateString === 'N/A' || dateString === 'Loading...') {
      return 'N/A';
    }
    
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return 'N/A';
      }
      return format(date, 'MMM d, yyyy');
    } catch (error) {
      return 'N/A';
    }
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle>Welcome, {name}</CardTitle>
        <CardDescription>{property}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col md:flex-row gap-4 md:items-center md:justify-between">
          <div>
            <p className="text-sm text-muted-foreground mb-1">Lease Period</p>
            <p className="font-medium">
              {formatDate(leaseStart)} - {formatDate(leaseEnd)}
            </p>
          </div>
          
          <div className="bg-secondary/50 px-4 py-3 rounded-lg">
            <p className="text-sm text-muted-foreground mb-1">Next Payment Due</p>
            <div className="flex items-baseline gap-2">
              <p className="font-medium">{formatDate(nextPayment)}</p>
              <p className="font-bold">₦{paymentAmount?.toLocaleString() || '0'}</p>
            </div>
          </div>
          
          <Button onClick={onMakePayment}>Make Payment</Button>
        </div>
      </CardContent>
    </Card>
  );
}
