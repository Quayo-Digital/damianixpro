import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { OwnerPayout } from '@/utils/AccountingTypes';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { toast } from '@/components/ui/sonner';

interface PayoutCardProps {
  payout: OwnerPayout;
}

export const PayoutCard = ({ payout }: PayoutCardProps) => (
  <Card>
    <CardHeader className="flex flex-row items-center justify-between pb-2">
      <CardTitle className="text-sm font-medium">
        {payout.profiles?.full_name || 'Unknown'}
      </CardTitle>
      <Badge
        variant="outline"
        className={
          payout.status === 'processed'
            ? 'bg-green-50 text-green-700'
            : 'bg-yellow-50 text-yellow-700'
        }
      >
        {payout.status === 'processed' ? 'Processed' : 'Pending'}
      </Badge>
    </CardHeader>
    <CardContent className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="font-medium">₦{payout.amount.toLocaleString()}</span>
      </div>
      <div className="flex items-center justify-between pt-2 text-xs text-muted-foreground">
        <span>{new Date(payout.payout_date).toLocaleDateString()}</span>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
          onClick={() => toast.success('Payment details downloaded')}
        >
          <Download className="h-4 w-4" />
          <span className="sr-only">Download details</span>
        </Button>
      </div>
    </CardContent>
  </Card>
);
