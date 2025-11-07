import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  TrendingUp, TrendingDown, BarChart3, PieChart, 
  MapPin, DollarSign, Users, Building, 
  AlertTriangle, CheckCircle, Clock, Target 
} from 'lucide-react';
import RealEstateAnalyticsEngine, { 
  MarketTrend, InvestmentAnalysis, NeighborhoodInsights, PredictiveInsights 
} from '@/services/analytics/RealEstateAnalyticsEngine';

const AnalyticsDashboard: React.FC = () => {
  const [analyticsEngine] = useState(() => new RealEstateAnalyticsEngine());
  const [selectedLocation, setSelectedLocation] = useState('lagos');
  const [selectedPropertyType, setSelectedPropertyType] = useState<'RESIDENTIAL' | 'COMMERCIAL' | 'LAND' | 'INDUSTRIAL'>('RESIDENTIAL');
  const [marketTrend, setMarketTrend] = useState<MarketTrend | null>(null);
  const [investmentAnalysis, setInvestmentAnalysis] = useState<InvestmentAnalysis | null>(null);
  const [neighborhoodInsights, setNeighborhoodInsights] = useState<NeighborhoodInsights | null>(null);
  const [predictiveInsights, setPredictiveInsights] = useState<PredictiveInsights | null>(null);
  const [loading, setLoading] = useState(false);

  const locations = [
    { value: 'lagos', label: 'Lagos' },
    { value: 'abuja', label: 'Abuja' },
    { value: 'port-harcourt', label: 'Port Harcourt' }
  ];

  const propertyTypes = [
    { value: 'RESIDENTIAL', label: 'Residential' },
    { value: 'COMMERCIAL', label: 'Commercial' },
    { value: 'LAND', label: 'Land' },
    { value: 'INDUSTRIAL', label: 'Industrial' }
  ];

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      const [trend, investment, neighborhood, predictive] = await Promise.all([
        analyticsEngine.analyzeMarketTrends(selectedLocation, selectedPropertyType),
        analyticsEngine.analyzeInvestment('sample-property', 25000000, selectedLocation, selectedPropertyType),
        analyticsEngine.analyzeNeighborhood(selectedLocation),
        analyticsEngine.generatePredictiveInsights(selectedLocation, selectedPropertyType, '1Y')
      ]);

      setMarketTrend(trend);
      setInvestmentAnalysis(investment);
      setNeighborhoodInsights(neighborhood);
      setPredictiveInsights(predictive);
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAnalytics();
  }, [selectedLocation, selectedPropertyType]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatPercentage = (value: number) => {
    return `${(value * 100).toFixed(1)}%`;
  };

  const getTrendIcon = (value: number) => {
    return value > 0 ? <TrendingUp className="h-4 w-4 text-green-500" /> : <TrendingDown className="h-4 w-4 text-red-500" />;
  };

  const getBadgeVariant = (value: string) => {
    switch (value) {
      case 'HIGH': case 'BUY': case 'POSITIVE': case 'A+': case 'A': return 'default';
      case 'MEDIUM': case 'HOLD': case 'NEUTRAL': case 'B+': case 'B': return 'secondary';
      case 'LOW': case 'SELL': case 'WATCH': case 'NEGATIVE': case 'C+': case 'C': case 'D': return 'destructive';
      default: return 'outline';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Real Estate Analytics</h1>
          <p className="text-muted-foreground">Advanced market intelligence and investment insights</p>
        </div>
        <div className="flex gap-2">
          <Select value={selectedLocation} onValueChange={setSelectedLocation}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {locations.map(location => (
                <SelectItem key={location.value} value={location.value}>
                  {location.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={selectedPropertyType} onValueChange={(value: any) => setSelectedPropertyType(value)}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {propertyTypes.map(type => (
                <SelectItem key={type.value} value={type.value}>
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={loadAnalytics} disabled={loading}>
            {loading ? 'Loading...' : 'Refresh'}
          </Button>
        </div>
      </div>

      <Tabs defaultValue="market-trends" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="market-trends">Market Trends</TabsTrigger>
          <TabsTrigger value="investment">Investment Analysis</TabsTrigger>
          <TabsTrigger value="neighborhood">Neighborhood</TabsTrigger>
          <TabsTrigger value="predictions">Predictions</TabsTrigger>
        </TabsList>

        {/* Market Trends Tab */}
        <TabsContent value="market-trends" className="space-y-4">
          {marketTrend && (
            <>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Average Price</CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{formatCurrency(marketTrend.currentAvgPrice)}</div>
                    <div className="flex items-center text-xs text-muted-foreground">
                      {getTrendIcon(marketTrend.priceChange1Year)}
                      <span className="ml-1">{formatPercentage(marketTrend.priceChange1Year)} YoY</span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Demand Score</CardTitle>
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{marketTrend.demandScore.toFixed(0)}/100</div>
                    <Progress value={marketTrend.demandScore} className="mt-2" />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Supply Score</CardTitle>
                    <BarChart3 className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{marketTrend.supplyScore.toFixed(0)}/100</div>
                    <Progress value={marketTrend.supplyScore} className="mt-2" />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Liquidity</CardTitle>
                    <PieChart className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{marketTrend.liquidityScore.toFixed(0)}/100</div>
                    <Progress value={marketTrend.liquidityScore} className="mt-2" />
                  </CardContent>
                </Card>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Market Assessment</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span>Growth Potential:</span>
                      <Badge variant={getBadgeVariant(marketTrend.growthPotential)}>
                        {marketTrend.growthPotential}
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Risk Level:</span>
                      <Badge variant={getBadgeVariant(marketTrend.riskLevel)}>
                        {marketTrend.riskLevel}
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Recommendation:</span>
                      <Badge variant={getBadgeVariant(marketTrend.recommendedAction)}>
                        {marketTrend.recommendedAction}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Price Changes</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span>30 Days:</span>
                      <div className="flex items-center">
                        {getTrendIcon(marketTrend.priceChange30Days)}
                        <span className="ml-1">{formatPercentage(marketTrend.priceChange30Days)}</span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>90 Days:</span>
                      <div className="flex items-center">
                        {getTrendIcon(marketTrend.priceChange90Days)}
                        <span className="ml-1">{formatPercentage(marketTrend.priceChange90Days)}</span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>1 Year:</span>
                      <div className="flex items-center">
                        {getTrendIcon(marketTrend.priceChange1Year)}
                        <span className="ml-1">{formatPercentage(marketTrend.priceChange1Year)}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </>
          )}
        </TabsContent>

        {/* Investment Analysis Tab */}
        <TabsContent value="investment" className="space-y-4">
          {investmentAnalysis && (
            <>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Expected ROI</CardTitle>
                    <Target className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{investmentAnalysis.expectedROI.toFixed(1)}%</div>
                    <p className="text-xs text-muted-foreground">Annual return</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Cash Flow</CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{formatCurrency(investmentAnalysis.cashFlow)}</div>
                    <p className="text-xs text-muted-foreground">Monthly net income</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Payback Period</CardTitle>
                    <Clock className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{investmentAnalysis.paybackPeriod.toFixed(1)}</div>
                    <p className="text-xs text-muted-foreground">Years to break even</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Overall Score</CardTitle>
                    <CheckCircle className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{investmentAnalysis.overallScore.toFixed(0)}/100</div>
                    <Progress value={investmentAnalysis.overallScore} className="mt-2" />
                  </CardContent>
                </Card>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <CheckCircle className="h-5 w-5 text-green-500" />
                      Key Factors
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {investmentAnalysis.keyFactors.map((factor, index) => (
                        <li key={index} className="text-sm flex items-start gap-2">
                          <div className="w-1.5 h-1.5 bg-green-500 rounded-full mt-2 flex-shrink-0" />
                          {factor}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5 text-yellow-500" />
                      Risks
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {investmentAnalysis.risks.map((risk, index) => (
                        <li key={index} className="text-sm flex items-start gap-2">
                          <div className="w-1.5 h-1.5 bg-yellow-500 rounded-full mt-2 flex-shrink-0" />
                          {risk}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-blue-500" />
                      Opportunities
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {investmentAnalysis.opportunities.map((opportunity, index) => (
                        <li key={index} className="text-sm flex items-start gap-2">
                          <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 flex-shrink-0" />
                          {opportunity}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Investment Recommendation</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-lg">{investmentAnalysis.recommendation}</p>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        {/* Neighborhood Analysis Tab */}
        <TabsContent value="neighborhood" className="space-y-4">
          {neighborhoodInsights && (
            <>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Investment Grade</CardTitle>
                    <Building className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{neighborhoodInsights.investmentGrade}</div>
                    <Badge variant={getBadgeVariant(neighborhoodInsights.investmentGrade)} className="mt-2">
                      {neighborhoodInsights.futureOutlook}
                    </Badge>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Population Growth</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{neighborhoodInsights.populationGrowth.toFixed(1)}%</div>
                    <p className="text-xs text-muted-foreground">Annual growth rate</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Employment Rate</CardTitle>
                    <BarChart3 className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{neighborhoodInsights.employmentRate}%</div>
                    <Progress value={neighborhoodInsights.employmentRate} className="mt-2" />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Average Income</CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{formatCurrency(neighborhoodInsights.averageIncome)}</div>
                    <p className="text-xs text-muted-foreground">Monthly household income</p>
                  </CardContent>
                </Card>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Quality of Life Scores</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>School Rating</span>
                        <span>{neighborhoodInsights.schoolRating}/100</span>
                      </div>
                      <Progress value={neighborhoodInsights.schoolRating} />
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>Transport Score</span>
                        <span>{neighborhoodInsights.transportScore}/100</span>
                      </div>
                      <Progress value={neighborhoodInsights.transportScore} />
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>Amenities Score</span>
                        <span>{neighborhoodInsights.amenitiesScore}/100</span>
                      </div>
                      <Progress value={neighborhoodInsights.amenitiesScore} />
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>Safety Score</span>
                        <span>{(100 - neighborhoodInsights.crimeRate).toFixed(0)}/100</span>
                      </div>
                      <Progress value={100 - neighborhoodInsights.crimeRate} />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Development Projects</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {neighborhoodInsights.developmentProjects.map((project, index) => (
                        <li key={index} className="text-sm flex items-start gap-2">
                          <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 flex-shrink-0" />
                          {project}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </div>
            </>
          )}
        </TabsContent>

        {/* Predictions Tab */}
        <TabsContent value="predictions" className="space-y-4">
          {predictiveInsights && (
            <>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Price Projection</CardTitle>
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{formatCurrency(predictiveInsights.priceProjection)}</div>
                    <p className="text-xs text-muted-foreground">1 year forecast</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Confidence Level</CardTitle>
                    <CheckCircle className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{predictiveInsights.confidenceLevel}%</div>
                    <Progress value={predictiveInsights.confidenceLevel} className="mt-2" />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Optimistic</CardTitle>
                    <TrendingUp className="h-4 w-4 text-green-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{formatCurrency(predictiveInsights.scenarios.optimistic)}</div>
                    <p className="text-xs text-muted-foreground">Best case scenario</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Pessimistic</CardTitle>
                    <TrendingDown className="h-4 w-4 text-red-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{formatCurrency(predictiveInsights.scenarios.pessimistic)}</div>
                    <p className="text-xs text-muted-foreground">Worst case scenario</p>
                  </CardContent>
                </Card>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-green-500" />
                      Market Drivers
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {predictiveInsights.marketDrivers.map((driver, index) => (
                        <li key={index} className="text-sm flex items-start gap-2">
                          <div className="w-1.5 h-1.5 bg-green-500 rounded-full mt-2 flex-shrink-0" />
                          {driver}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5 text-yellow-500" />
                      Risk Factors
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {predictiveInsights.riskFactors.map((risk, index) => (
                        <li key={index} className="text-sm flex items-start gap-2">
                          <div className="w-1.5 h-1.5 bg-yellow-500 rounded-full mt-2 flex-shrink-0" />
                          {risk}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Scenario Analysis</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                      <span className="font-medium text-green-800">Optimistic Scenario</span>
                      <span className="text-green-600 font-bold">{formatCurrency(predictiveInsights.scenarios.optimistic)}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                      <span className="font-medium text-blue-800">Realistic Scenario</span>
                      <span className="text-blue-600 font-bold">{formatCurrency(predictiveInsights.scenarios.realistic)}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-red-50 rounded-lg">
                      <span className="font-medium text-red-800">Pessimistic Scenario</span>
                      <span className="text-red-600 font-bold">{formatCurrency(predictiveInsights.scenarios.pessimistic)}</span>
                    </div>
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

export default AnalyticsDashboard;
