
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, WalletCards } from 'lucide-react';
import { Button } from '@/components/ui/button';

// Sample data for tenant financial overview
const paymentHistory = [
  { month: 'Jan', payment: 50000, expenses: 2000 },
  { month: 'Feb', payment: 50000, expenses: 3500 },
  { month: 'Mar', payment: 50000, expenses: 2800 },
  { month: 'Apr', payment: 50000, expenses: 1500 },
  { month: 'May', payment: 50000, expenses: 2200 },
  { month: 'Jun', payment: 50000, expenses: 3000 },
];

const expenseBreakdown = [
  { name: 'Electricity', value: 12000 },
  { name: 'Water', value: 8000 },
  { name: 'Internet', value: 15000 },
  { name: 'Maintenance', value: 18000 },
];

const EXPENSE_COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

export const FinancialOverview = () => {
  const [timeframe, setTimeframe] = useState('6months');

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  // Calculate savings (difference between rent payment and expenses)
  const calculateSavings = () => {
    const totalPayment = paymentHistory.reduce((sum, item) => sum + item.payment, 0);
    const totalExpenses = paymentHistory.reduce((sum, item) => sum + item.expenses, 0);
    return totalPayment - totalExpenses;
  };

  const savingsAmount = calculateSavings();

  // Forecast data for the next 3 months (simplified calculation)
  const forecastData = [
    { month: 'Jul', projected: 50000, expenses: 2600 },
    { month: 'Aug', projected: 50000, expenses: 2800 },
    { month: 'Sep', projected: 50000, expenses: 3000 },
  ];

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-xl font-semibold">Financial Overview</CardTitle>
            <CardDescription>Track your rental payments and expenses</CardDescription>
          </div>
          <Select
            defaultValue={timeframe}
            onValueChange={setTimeframe}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select timeframe" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="3months">Last 3 months</SelectItem>
              <SelectItem value="6months">Last 6 months</SelectItem>
              <SelectItem value="1year">Last year</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        <div className="mb-6 grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="p-3 pb-0">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Payments</CardTitle>
            </CardHeader>
            <CardContent className="p-3 pt-2">
              <div className="text-2xl font-bold">{formatCurrency(300000)}</div>
              <p className="text-xs text-muted-foreground">Last 6 months</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="p-3 pb-0">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Expenses</CardTitle>
            </CardHeader>
            <CardContent className="p-3 pt-2">
              <div className="text-2xl font-bold">{formatCurrency(15000)}</div>
              <p className="text-xs text-muted-foreground">Last 6 months</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="p-3 pb-0">
              <CardTitle className="text-sm font-medium text-muted-foreground">Savings</CardTitle>
            </CardHeader>
            <CardContent className="p-3 pt-2">
              <div className="text-2xl font-bold">{formatCurrency(savingsAmount)}</div>
              <p className="text-xs text-muted-foreground">
                <span className="text-green-600">↑ 4%</span> from last period
              </p>
            </CardContent>
          </Card>
        </div>
        
        <Tabs defaultValue="cashflow" className="w-full">
          <TabsList className="mb-4 grid grid-cols-3">
            <TabsTrigger value="cashflow">Cash Flow</TabsTrigger>
            <TabsTrigger value="expenses">Expense Breakdown</TabsTrigger>
            <TabsTrigger value="forecast">Forecast</TabsTrigger>
          </TabsList>
          
          <TabsContent value="cashflow">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Monthly Cash Flow</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ChartContainer config={{}}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={paymentHistory}
                        margin={{ top: 20, right: 30, left: 0, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="month" />
                        <YAxis tickFormatter={(value) => `₦${value/1000}K`} />
                        <ChartTooltip 
                          content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                              return (
                                <ChartTooltipContent 
                                  className="dark:bg-slate-800"
                                  payload={payload}
                                  formatter={(value) => formatCurrency(Number(value))}
                                />
                              );
                            }
                            return null;
                          }}
                        />
                        <Bar dataKey="payment" name="Rent Payment" fill="#9b87f5" />
                        <Bar dataKey="expenses" name="Expenses" fill="#FF8042" />
                      </BarChart>
                    </ResponsiveContainer>
                  </ChartContainer>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="expenses">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Expense Breakdown</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col md:flex-row items-center justify-between">
                <div className="w-full md:w-1/2 h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={expenseBreakdown}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      >
                        {expenseBreakdown.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={EXPENSE_COLORS[index % EXPENSE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="w-full md:w-1/2">
                  <ul className="space-y-2">
                    {expenseBreakdown.map((item, index) => (
                      <li key={item.name} className="flex items-center justify-between">
                        <span className="flex items-center">
                          <span 
                            className="inline-block w-3 h-3 mr-2 rounded-full" 
                            style={{ backgroundColor: EXPENSE_COLORS[index % EXPENSE_COLORS.length] }}
                          />
                          {item.name}
                        </span>
                        <span className="font-medium">{formatCurrency(item.value)}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="forecast">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">3-Month Forecast</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={[...paymentHistory.slice(-3), ...forecastData]}
                      margin={{ top: 20, right: 30, left: 0, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="month" />
                      <YAxis tickFormatter={(value) => `₦${value/1000}K`} />
                      <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                      <Line 
                        type="monotone" 
                        dataKey="payment" 
                        name="Actual Payment" 
                        stroke="#9b87f5" 
                        strokeWidth={2} 
                      />
                      <Line 
                        type="monotone" 
                        dataKey="projected" 
                        name="Projected Payment" 
                        stroke="#9b87f5" 
                        strokeDasharray="5 5"
                        strokeWidth={2} 
                      />
                      <Line 
                        type="monotone" 
                        dataKey="expenses" 
                        name="Expenses" 
                        stroke="#FF8042"
                        strokeWidth={2}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                
                <div className="mt-4 p-4 bg-muted rounded-md">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="h-4 w-4 text-green-500" />
                    <h4 className="font-medium">Financial Insights</h4>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Based on your payment history, you've maintained consistent payments while your expenses have fluctuated.
                    The forecast suggests a slight increase in expenses over the next 3 months.
                  </p>
                </div>
              </CardContent>
              <CardFooter>
                <Button variant="outline" className="gap-2">
                  <WalletCards className="h-4 w-4" />
                  View Financial Planning Tips
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};
