import { Card, CardContent } from '@/components/ui/card';
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
import { Download } from 'lucide-react';
import { toast } from '@/components/ui/sonner';
import { OwnerPayout } from '@/utils/AccountingTypes';
import { useIsMobile } from '@/hooks/use-mobile';
import { PayoutCard } from './PayoutCard';

interface PayoutsTabProps {
  loading: boolean;
  ownerPayouts: OwnerPayout[];
}

export const PayoutsTab = ({ loading, ownerPayouts }: PayoutsTabProps) => {
  const isMobile = useIsMobile();

  const renderDesktopView = () => (
    <Card className="rounded-2xl border-border bg-card/95 backdrop-blur-md dark:bg-card">
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Owner</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="py-8 text-center">
                  Loading payouts...
                </TableCell>
              </TableRow>
            ) : ownerPayouts.length > 0 ? (
              ownerPayouts.map((payout) => (
                <TableRow key={payout.id}>
                  <TableCell>{new Date(payout.payout_date).toLocaleDateString()}</TableCell>
                  <TableCell>{payout.profiles?.full_name || 'Unknown'}</TableCell>
                  <TableCell className="text-right font-medium">
                    ₦{payout.amount.toLocaleString()}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={
                        payout.status === 'processed'
                          ? 'rounded-full bg-green-50 text-green-700'
                          : 'rounded-full bg-yellow-50 text-yellow-700'
                      }
                    >
                      {payout.status === 'processed' ? 'Processed' : 'Pending'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 rounded-full p-0 hover:bg-primary/10"
                      onClick={() => toast.success('Payment details downloaded')}
                    >
                      <Download className="h-4 w-4" />
                      <span className="sr-only">Download details</span>
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="py-8 text-center">
                  No payouts found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );

  const renderMobileView = () => (
    <div className="space-y-4">
      {loading ? (
        <p>Loading payouts...</p>
      ) : ownerPayouts.length > 0 ? (
        ownerPayouts.map((payout) => <PayoutCard key={payout.id} payout={payout} />)
      ) : (
        <p className="py-8 text-center text-muted-foreground">No payouts found</p>
      )}
    </div>
  );

  return isMobile ? renderMobileView() : renderDesktopView();
};
