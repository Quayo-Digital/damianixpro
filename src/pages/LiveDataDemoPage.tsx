import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RefreshCw, TrendingUp, MapPin, Building, DollarSign } from 'lucide-react';
import { PageLayout } from '@/components/layout/PageLayout';
import NigerianRealEstateDataService, { PropertyListingData, EconomicIndicator, MarketData } from '@/services/data/NigerianRealEstateDataService';
import LiveDataAnalyticsEngine from '@/services/analytics/LiveDataAnalyticsEngine';

const LiveDataDemoPage: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [propertyListings, setPropertyListings] = useState<PropertyListingData[]>([]);
  const [economicIndicators, setEconomicIndicators] = useState<EconomicIndicator[]>([]);
  const [marketData, setMarketData] = useState<MarketData[]>([]);
  const [lastUpdated, setLastUpdated] = useState<string>('');

  const dataService = new NigerianRealEstateDataService();
  const analyticsEngine = new LiveDataAnalyticsEngine();

  const refreshLiveData = async () => {
    setIsLoading(true);
    try {
      // Fetch live property listings
      const listings = await dataService.fetchPropertyListings({
        location: 'Lagos',
        limit: 10
      });
      setPropertyListings(listings);

      // Fetch economic indicators
      const indicators = await dataService.fetchEconomicIndicators();
      setEconomicIndicators(indicators);

      // Generate market insights
      const insights = await analyticsEngine.generateMarketInsights('Lagos');
      setMarketData([insights.marketTrends]);

      setLastUpdated(new Date().toLocaleString());
    } catch (error) {
      console.error('Failed to refresh live data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshLiveData();
  }, []);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getTrendIcon = (trend: string) => {
    return trend === 'UP' ? (
      <TrendingUp className="h-4 w-4 text-green-500" />
    ) : (
      <TrendingUp className="h-4 w-4 text-red-500 rotate-180" />
    );
  };

  return (
    <PageLayout>
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Live Nigerian Real Estate Data</h1>
            <p className="text-muted-foreground mt-2">
              Real-time property listings, market trends, and economic indicators
            </p>
            {lastUpdated && (
              <p className="text-sm text-muted-foreground mt-1">
                Last updated: {lastUpdated}
              </p>
            )}
          </div>
          <Button 
            onClick={refreshLiveData} 
            disabled={isLoading}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh Data
          </Button>
        </div>

        <Tabs defaultValue="listings" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="listings">Property Listings</TabsTrigger>
            <TabsTrigger value="market">Market Data</TabsTrigger>
            <TabsTrigger value="economic">Economic Indicators</TabsTrigger>
          </TabsList>

          <TabsContent value="listings" className="space-y-4">
            <div className="grid gap-4">
              {propertyListings.map((listing, index) => (
                <Card key={index}>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Building className="h-5 w-5" />
                        {listing.title}
                      </div>
                      <Badge variant="outline">{listing.category}</Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <MapPin className="h-4 w-4" />
                          {listing.location.city}, {listing.location.state}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                          <DollarSign className="h-4 w-4" />
                          {formatCurrency(listing.price)}
                        </div>
                      </div>
                      <div>
                        <p className="text-sm">Type: {listing.propertyType}</p>
                        <p className="text-sm">Size: {listing.size} sqm</p>
                        {listing.bedrooms && (
                          <p className="text-sm">{listing.bedrooms} bed, {listing.bathrooms} bath</p>
                        )}
                      </div>
                      <div>
                        <p className="text-sm">Agent: {listing.agent.name}</p>
                        <p className="text-sm">Source: {listing.source}</p>
                        <p className="text-sm">Posted: {new Date(listing.datePosted).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground mt-3 line-clamp-2">
                      {listing.description}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="market" className="space-y-4">
            <div className="grid gap-4">
              {marketData.map((market, index) => (
                <Card key={index}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5" />
                      Market Analysis - {market.location}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center p-4 bg-blue-50 rounded-lg">
                        <div className="text-2xl font-bold text-blue-600">
                          {formatCurrency(market.averagePrice)}
                        </div>
                        <div className="text-sm text-muted-foreground">Average Price</div>
                      </div>
                      <div className="text-center p-4 bg-green-50 rounded-lg">
                        <div className="text-2xl font-bold text-green-600">
                          {market.totalListings}
                        </div>
                        <div className="text-sm text-muted-foreground">Total Listings</div>
                      </div>
                      <div className="text-center p-4 bg-purple-50 rounded-lg">
                        <div className="text-2xl font-bold text-purple-600">
                          {market.averageDaysOnMarket}
                        </div>
                        <div className="text-sm text-muted-foreground">Avg Days on Market</div>
                      </div>
                      <div className="text-center p-4 bg-orange-50 rounded-lg">
                        <div className="text-2xl font-bold text-orange-600">
                          {market.priceChange30Days > 0 ? '+' : ''}{market.priceChange30Days.toFixed(1)}%
                        </div>
                        <div className="text-sm text-muted-foreground">30-Day Change</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="economic" className="space-y-4">
            <div className="grid gap-4">
              {economicIndicators.map((indicator, index) => (
                <Card key={index}>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold">{indicator.indicator}</h3>
                        <p className="text-sm text-muted-foreground">
                          Source: {indicator.source} | Date: {new Date(indicator.date).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center gap-2">
                          <span className="text-2xl font-bold">
                            {indicator.value}{indicator.unit}
                          </span>
                          {getTrendIcon(indicator.trend)}
                        </div>
                        <Badge 
                          variant={indicator.trend === 'UP' ? 'default' : 'destructive'}
                          className="mt-1"
                        >
                          {indicator.trend}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </PageLayout>
  );
};

export default LiveDataDemoPage;
