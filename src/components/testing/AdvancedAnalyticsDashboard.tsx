import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  BarChart3, TrendingUp, Users, MapPin, Smartphone, 
  DollarSign, Target, Eye, Activity, Globe, RefreshCw
} from 'lucide-react';
import { useAdvancedAnalytics } from '@/utils/advanced-analytics-system';

export const AdvancedAnalyticsDashboard = () => {
  const {
    marketData,
    userBehavior,
    businessIntelligence,
    predictiveInsights,
    loading,
    error,
    generateReport,
    analyzeMarket
  } = useAdvancedAnalytics();

  const [activeTab, setActiveTab] = useState('market');
  const [selectedCity, setSelectedCity] = useState('lagos');
  const [marketAnalysis, setMarketAnalysis] = useState<any>(null);

  const handleAnalyzeMarket = async () => {
    const analysis = await analyzeMarket(selectedCity);
    setMarketAnalysis(analysis);
  };

  if (!marketData || !userBehavior || !businessIntelligence) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="h-8 w-8 animate-spin text-blue-600" />
        <span className="ml-2">Loading analytics data...</span>
      </div>
    );
  }

  const formatCurrency = (amount: number) => {
    return `₦${(amount / 1000000).toFixed(1)}M`;
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-blue-600" />
                Nigerian Property Market Analytics
              </CardTitle>
              <CardDescription>
                Advanced analytics and business intelligence for Nigerian real estate market
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="default" className="flex items-center gap-1">
                <Activity className="h-3 w-3" />
                Live Data
              </Badge>
              <Badge variant="secondary" className="flex items-center gap-1">
                <Globe className="h-3 w-3" />
                5 Cities
              </Badge>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium">National Avg Price</span>
            </div>
            <div className="text-2xl font-bold text-green-600 mt-1">
              {formatCurrency(marketData.nationalTrends.averagePrice)}
            </div>
            <div className="text-xs text-gray-600">
              +{formatPercentage(marketData.nationalTrends.priceGrowth)} YoY
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium">Total Users</span>
            </div>
            <div className="text-2xl font-bold mt-1">
              {businessIntelligence.customers.total.toLocaleString()}
            </div>
            <div className="text-xs text-gray-600">
              {businessIntelligence.customers.active.toLocaleString()} active
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-purple-600" />
              <span className="text-sm font-medium">Revenue</span>
            </div>
            <div className="text-2xl font-bold text-purple-600 mt-1">
              {formatCurrency(businessIntelligence.revenue.total)}
            </div>
            <div className="text-xs text-gray-600">
              +{formatPercentage(businessIntelligence.revenue.growth)} growth
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Smartphone className="h-4 w-4 text-orange-600" />
              <span className="text-sm font-medium">Mobile Usage</span>
            </div>
            <div className="text-2xl font-bold text-orange-600 mt-1">
              {userBehavior.deviceUsage.mobile}%
            </div>
            <div className="text-xs text-gray-600">Primary platform</div>
          </CardContent>
        </Card>
      </div>

      {/* Main Analytics Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="market">🏘️ Market Data</TabsTrigger>
          <TabsTrigger value="users">👥 User Behavior</TabsTrigger>
          <TabsTrigger value="business">💼 Business Intel</TabsTrigger>
          <TabsTrigger value="predictions">🔮 Predictions</TabsTrigger>
        </TabsList>

        <TabsContent value="market" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* City Analysis */}
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    City Market Analysis
                  </CardTitle>
                  <select 
                    value={selectedCity}
                    onChange={(e) => setSelectedCity(e.target.value)}
                    className="p-2 border rounded-md text-sm"
                  >
                    <option value="lagos">Lagos</option>
                    <option value="abuja">Abuja</option>
                    <option value="portHarcourt">Port Harcourt</option>
                    <option value="kano">Kano</option>
                    <option value="ibadan">Ibadan</option>
                  </select>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {(() => {
                  const cityData = marketData.cities[selectedCity as keyof typeof marketData.cities];
                  return (
                    <>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="font-medium">Avg Price:</span> {formatCurrency(cityData.averagePrice)}
                        </div>
                        <div>
                          <span className="font-medium">Growth:</span> +{formatPercentage(cityData.yearlyGrowth)}
                        </div>
                        <div>
                          <span className="font-medium">Inventory:</span> {cityData.inventory.toLocaleString()}
                        </div>
                        <div>
                          <span className="font-medium">Days on Market:</span> {cityData.daysOnMarket}
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Demand Score</span>
                          <span className="font-medium">{cityData.demandScore.toFixed(1)}/10</span>
                        </div>
                        <Progress value={cityData.demandScore * 10} className="h-2" />
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Supply Score</span>
                          <span className="font-medium">{cityData.supplyScore.toFixed(1)}/10</span>
                        </div>
                        <Progress value={cityData.supplyScore * 10} className="h-2" />
                      </div>
                      
                      <Button onClick={handleAnalyzeMarket} className="w-full" disabled={loading}>
                        <Eye className="h-4 w-4 mr-2" />
                        Analyze Market
                      </Button>
                    </>
                  );
                })()}
              </CardContent>
            </Card>

            {/* Market Analysis Results */}
            <Card>
              <CardHeader>
                <CardTitle>Market Analysis Results</CardTitle>
              </CardHeader>
              <CardContent>
                {marketAnalysis ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div>
                        <div className="text-2xl font-bold text-green-600">
                          {marketAnalysis.marketHealth}
                        </div>
                        <div className="text-xs text-gray-600">Market Health</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-blue-600">
                          {marketAnalysis.growthPotential}
                        </div>
                        <div className="text-xs text-gray-600">Growth Potential</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-purple-600">
                          {marketAnalysis.competitivePosition}
                        </div>
                        <div className="text-xs text-gray-600">Market Position</div>
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="font-medium mb-2">Key Recommendations</h4>
                      <div className="space-y-1 text-sm">
                        {marketAnalysis.recommendations.slice(0, 3).map((rec: string, i: number) => (
                          <div key={i} className="flex items-start gap-2">
                            <Target className="h-3 w-3 text-blue-600 mt-1 flex-shrink-0" />
                            <span>{rec}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Eye className="h-12 w-12 mx-auto mb-4" />
                    <p>Select a city and click "Analyze Market" to see insights</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Price Ranges */}
          <Card>
            <CardHeader>
              <CardTitle>National Price Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {Object.entries(marketData.cities.lagos.priceRanges).map(([range, data]) => (
                  <div key={range} className="p-4 border rounded-lg">
                    <div className="flex justify-between items-center mb-2">
                      <h4 className="font-medium capitalize">{range} Segment</h4>
                      <Badge variant="outline">{data.percentage}%</Badge>
                    </div>
                    <div className="text-sm text-gray-600">
                      {formatCurrency(data.min)} - {formatCurrency(data.max)}
                    </div>
                    <Progress value={data.percentage} className="h-2 mt-2" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Demographics */}
            <Card>
              <CardHeader>
                <CardTitle>User Demographics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {Object.entries(userBehavior.demographics).map(([age, percentage]) => (
                  <div key={age} className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Age {age}</span>
                      <span className="font-medium">{percentage}%</span>
                    </div>
                    <Progress value={percentage} className="h-2" />
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Device Usage */}
            <Card>
              <CardHeader>
                <CardTitle>Device & Network Usage</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-medium mb-3">Device Types</h4>
                  {Object.entries(userBehavior.deviceUsage).map(([device, percentage]) => (
                    <div key={device} className="space-y-2 mb-3">
                      <div className="flex justify-between text-sm">
                        <span className="capitalize">{device}</span>
                        <span className="font-medium">{percentage}%</span>
                      </div>
                      <Progress value={percentage} className="h-2" />
                    </div>
                  ))}
                </div>
                
                <div>
                  <h4 className="font-medium mb-3">Network Types</h4>
                  {Object.entries(userBehavior.networkAnalysis).map(([network, percentage]) => (
                    <div key={network} className="space-y-2 mb-3">
                      <div className="flex justify-between text-sm">
                        <span>{network}</span>
                        <span className="font-medium">{percentage}%</span>
                      </div>
                      <Progress value={percentage} className="h-2" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Conversion Funnel */}
          <Card>
            <CardHeader>
              <CardTitle>Conversion Funnel Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {Object.entries(userBehavior.conversionMetrics).map(([metric, value]) => (
                  <div key={metric} className="text-center p-4 border rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">
                      {typeof value === 'number' ? value.toFixed(1) : value}
                      {metric !== 'averageTimeToDecision' ? '%' : ' days'}
                    </div>
                    <div className="text-xs text-gray-600 mt-1">
                      {metric.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="business" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Revenue Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle>Revenue Analysis</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600 mb-2">
                    {formatCurrency(businessIntelligence.revenue.total)}
                  </div>
                  <div className="text-gray-600">Total Revenue</div>
                  <Badge variant="default" className="mt-2">
                    +{formatPercentage(businessIntelligence.revenue.growth)} growth
                  </Badge>
                </div>
                
                <div>
                  <h4 className="font-medium mb-3">Revenue by City</h4>
                  {Object.entries(businessIntelligence.revenue.byCity).map(([city, amount]) => (
                    <div key={city} className="space-y-2 mb-3">
                      <div className="flex justify-between text-sm">
                        <span>{city}</span>
                        <span className="font-medium">{formatCurrency(amount)}</span>
                      </div>
                      <Progress 
                        value={(amount / businessIntelligence.revenue.total) * 100} 
                        className="h-2" 
                      />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Customer Metrics */}
            <Card>
              <CardHeader>
                <CardTitle>Customer Analytics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Total Customers:</span> {businessIntelligence.customers.total.toLocaleString()}
                  </div>
                  <div>
                    <span className="font-medium">Active:</span> {businessIntelligence.customers.active.toLocaleString()}
                  </div>
                  <div>
                    <span className="font-medium">Churn Rate:</span> {formatPercentage(businessIntelligence.customers.churnRate)}
                  </div>
                  <div>
                    <span className="font-medium">Satisfaction:</span> {businessIntelligence.customers.satisfaction.toFixed(1)}/5
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Customer Satisfaction</span>
                    <span className="font-medium">{businessIntelligence.customers.satisfaction.toFixed(1)}/5</span>
                  </div>
                  <Progress value={(businessIntelligence.customers.satisfaction / 5) * 100} className="h-2" />
                </div>
                
                <div className="p-3 bg-blue-50 rounded-lg">
                  <div className="text-sm font-medium text-blue-800">Customer Lifetime Value</div>
                  <div className="text-lg font-bold text-blue-600">
                    {formatCurrency(businessIntelligence.customers.lifetimeValue)}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="predictions" className="space-y-6">
          {predictiveInsights && (
            <>
              {/* Market Forecasts */}
              <Card>
                <CardHeader>
                  <CardTitle>Market Forecasts</CardTitle>
                  <CardDescription>6-month predictions for Nigerian property market</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {predictiveInsights.marketForecasts.priceProjections.slice(0, 3).map((projection, index) => (
                      <div key={index} className="p-4 border rounded-lg">
                        <div className="text-sm text-gray-600">{projection.month}</div>
                        <div className="text-lg font-bold">{formatCurrency(projection.price)}</div>
                        <div className="text-xs text-green-600">
                          {projection.confidence}% confidence
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Opportunities */}
              <Card>
                <CardHeader>
                  <CardTitle>Growth Opportunities</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {predictiveInsights.opportunities.slice(0, 3).map((opportunity, index) => (
                      <div key={index} className="p-4 border rounded-lg">
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-medium">{opportunity.opportunity}</h4>
                          <Badge variant="default">
                            {opportunity.expectedROI}% ROI
                          </Badge>
                        </div>
                        <div className="text-sm text-gray-600 mb-2">
                          Timeframe: {opportunity.timeframe}
                        </div>
                        <div className="space-y-1">
                          <div className="flex justify-between text-sm">
                            <span>Potential Score</span>
                            <span className="font-medium">{opportunity.potential}/100</span>
                          </div>
                          <Progress value={opportunity.potential} className="h-2" />
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};
