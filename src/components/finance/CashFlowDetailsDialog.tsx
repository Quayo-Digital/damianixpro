
import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogClose
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ChartContainer } from '@/components/ui/chart';
import { 
  LineChart,
  Line,
  BarChart, 
  Bar,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip,
  Legend,
  ResponsiveContainer 
} from 'recharts';

interface CashFlowItem {
  month: string;
  inflow: number;
  outflow: number;
  projected?: boolean;
}

interface CashFlowDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cashFlowData: CashFlowItem[];
}

const CHART_COLORS = {
  inflow: '#0088FE',
  outflow: '#FF8042'
};

export function CashFlowDetailsDialog({ 
  open, 
  onOpenChange,
  cashFlowData
}: CashFlowDetailsDialogProps) {
  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  // Calculate total inflow and outflow
  const totalInflow = cashFlowData.reduce((sum, item) => sum + item.inflow, 0);
  const totalOutflow = cashFlowData.reduce((sum, item) => sum + item.outflow, 0);
  const netCashFlow = totalInflow - totalOutflow;

  // Filter actual vs projected data
  const actualData = cashFlowData.filter(item => !item.projected);
  const allData = cashFlowData;

  // Chart configuration
  const chartConfig = {
    inflow: { color: CHART_COLORS.inflow },
    outflow: { color: CHART_COLORS.outflow }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader className="sticky top-0 z-10 bg-background pb-4 pt-6">
          <DialogTitle>Cash Flow Analysis</DialogTitle>
          <DialogDescription>
            Detailed overview of your property cash flow
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6 pb-4">
          {/* Summary Section */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="p-4">
              <h3 className="text-sm font-medium text-muted-foreground mb-2">Total Cash In</h3>
              <p className="text-2xl font-bold">{formatAmount(totalInflow)}</p>
            </Card>
            <Card className="p-4">
              <h3 className="text-sm font-medium text-muted-foreground mb-2">Total Cash Out</h3>
              <p className="text-2xl font-bold">{formatAmount(totalOutflow)}</p>
            </Card>
            <Card className="p-4">
              <h3 className="text-sm font-medium text-muted-foreground mb-2">Net Cash Flow</h3>
              <p className={`text-2xl font-bold ${netCashFlow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatAmount(netCashFlow)}
              </p>
            </Card>
          </div>
          
          {/* Cash Flow Line Chart */}
          <div className="bg-white rounded-md p-4 border">
            <h2 className="text-lg font-semibold mb-4">Cash Flow Trend</h2>
            <div className="h-[300px]">
              <ChartContainer config={chartConfig}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={allData}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="month" />
                    <YAxis tickFormatter={(value) => `₦${value/1000000}M`} />
                    <Tooltip formatter={(value) => formatAmount(Number(value))} />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="inflow" 
                      name="Cash Inflow" 
                      stroke={CHART_COLORS.inflow}
                      strokeWidth={2}
                      dot={(props) => {
                        if (props.payload.projected) {
                          return (
                            <svg x={props.cx - 4} y={props.cy - 4} width={8} height={8}>
                              <circle cx="4" cy="4" r="4" stroke="none" fill={CHART_COLORS.inflow} opacity="0.6" />
                            </svg>
                          );
                        }
                        return (
                          <svg x={props.cx - 4} y={props.cy - 4} width={8} height={8}>
                            <circle cx="4" cy="4" r="4" stroke="none" fill={CHART_COLORS.inflow} />
                          </svg>
                        );
                      }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="outflow" 
                      name="Cash Outflow" 
                      stroke={CHART_COLORS.outflow}
                      strokeWidth={2}
                      dot={(props) => {
                        if (props.payload.projected) {
                          return (
                            <svg x={props.cx - 4} y={props.cy - 4} width={8} height={8}>
                              <circle cx="4" cy="4" r="4" stroke="none" fill={CHART_COLORS.outflow} opacity="0.6" />
                            </svg>
                          );
                        }
                        return (
                          <svg x={props.cx - 4} y={props.cy - 4} width={8} height={8}>
                            <circle cx="4" cy="4" r="4" stroke="none" fill={CHART_COLORS.outflow} />
                          </svg>
                        );
                      }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </ChartContainer>
            </div>
          </div>
          
          {/* Cash Flow Monthly Bar Chart */}
          <div className="bg-white rounded-md p-4 border">
            <h2 className="text-lg font-semibold mb-4">Monthly Cash Flow</h2>
            <div className="h-[300px]">
              <ChartContainer config={chartConfig}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart 
                    data={actualData} 
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis tickFormatter={(value) => `₦${value/1000000}M`} />
                    <Tooltip formatter={(value) => formatAmount(Number(value))} />
                    <Legend />
                    <Bar dataKey="inflow" name="Cash In" fill={CHART_COLORS.inflow} />
                    <Bar dataKey="outflow" name="Cash Out" fill={CHART_COLORS.outflow} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            </div>
          </div>
          
          {/* Detailed Cash Flow Table */}
          <div className="bg-white rounded-md p-4 border">
            <h2 className="text-lg font-semibold mb-4">Detailed Cash Flow</h2>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 px-4">Month</th>
                    <th className="text-right py-2 px-4">Cash In</th>
                    <th className="text-right py-2 px-4">Cash Out</th>
                    <th className="text-right py-2 px-4">Net Flow</th>
                    <th className="text-center py-2 px-4">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {cashFlowData.map((item, index) => {
                    const netFlow = item.inflow - item.outflow;
                    return (
                      <tr key={`${item.month}-${index}`} className="border-b">
                        <td className="py-2 px-4">
                          {item.month}
                          {item.projected && <span className="text-xs text-muted-foreground ml-2">(Projected)</span>}
                        </td>
                        <td className="text-right py-2 px-4">{formatAmount(item.inflow)}</td>
                        <td className="text-right py-2 px-4">{formatAmount(item.outflow)}</td>
                        <td className="text-right py-2 px-4 font-medium">
                          <span className={netFlow >= 0 ? 'text-green-600' : 'text-red-600'}>
                            {formatAmount(netFlow)}
                          </span>
                        </td>
                        <td className="text-center py-2 px-4">
                          {netFlow >= 0 ? 
                            <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">Positive</span> : 
                            <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs">Negative</span>
                          }
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="border-t font-medium">
                    <td className="py-2 px-4">Total</td>
                    <td className="text-right py-2 px-4">{formatAmount(totalInflow)}</td>
                    <td className="text-right py-2 px-4">{formatAmount(totalOutflow)}</td>
                    <td className="text-right py-2 px-4">
                      <span className={netCashFlow >= 0 ? 'text-green-600' : 'text-red-600'}>
                        {formatAmount(netCashFlow)}
                      </span>
                    </td>
                    <td className="text-center py-2 px-4">
                      {netCashFlow >= 0 ? 
                        <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">Positive</span> : 
                        <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs">Negative</span>
                      }
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>
        
        <div className="sticky bottom-0 bg-background pt-4 pb-6 border-t mt-4 flex justify-end">
          <DialogClose asChild>
            <Button>Close</Button>
          </DialogClose>
        </div>
      </DialogContent>
    </Dialog>
  );
}
