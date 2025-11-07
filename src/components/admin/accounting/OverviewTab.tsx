
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChartComponent } from '@/components/finance/charts/BarChartComponent';
import { PieChartComponent } from '@/components/finance/charts/PieChartComponent';
import { AccountingSummary } from "@/utils/AccountingTypes";

interface OverviewTabProps {
  accounting: AccountingSummary;
}

export const OverviewTab = ({ accounting }: OverviewTabProps) => {
    const chartData = [
      { name: 'Platform Fees', value: accounting.platformFees },
      { name: 'Agent Commissions', value: accounting.agentCommissions },
      { name: 'Owner Payouts', value: accounting.ownerPayouts },
      { name: 'Taxes', value: accounting.taxes }
    ];

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Total Revenue</CardTitle></CardHeader>
            <CardContent><div className="text-2xl font-bold">₦{accounting.totalRevenue.toLocaleString()}</div></CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Platform Fees</CardTitle></CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₦{accounting.platformFees.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {accounting.totalRevenue > 0 ? Math.round((accounting.platformFees / accounting.totalRevenue) * 100) : 0}% of revenue
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Agent Commissions</CardTitle></CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₦{accounting.agentCommissions.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {accounting.totalRevenue > 0 ? Math.round((accounting.agentCommissions / accounting.totalRevenue) * 100) : 0}% of revenue
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Pending Payouts</CardTitle></CardHeader>
            <CardContent><div className="text-2xl font-bold">₦{accounting.pendingPayouts.toLocaleString()}</div></CardContent>
          </Card>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader><CardTitle className="text-lg">Revenue Distribution</CardTitle></CardHeader>
            <CardContent className="h-80"><PieChartComponent data={chartData} /></CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="text-lg">Monthly Revenue</CardTitle></CardHeader>
            <CardContent className="h-80"><BarChartComponent /></CardContent>
          </Card>
        </div>
      </div>
    );
};
