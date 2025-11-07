import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Brain, TrendingUp, Target, Zap, BarChart3, 
  RefreshCw, CheckCircle, Lightbulb, Home, Users
} from 'lucide-react';
import { useAdvancedAIML } from '@/utils/advanced-ai-ml-system';

export const SimpleAIMLDashboard = () => {
  const {
    predictPropertyPrice,
    predictMarketTrend,
    generateRecommendations,
    getModelMetrics,
    isTraining,
    loading
  } = useAdvancedAIML();

  const [propertyPrediction, setPropertyPrediction] = useState<any>(null);
  const [marketPrediction, setMarketPrediction] = useState<any>(null);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [modelMetrics, setModelMetrics] = useState<any[]>([]);

  const [propertyForm, setPropertyForm] = useState({
    city: 'lagos',
    size: 150,
    bedrooms: 3,
    bathrooms: 2,
    age: 5
  });

  const [selectedMarketCity, setSelectedMarketCity] = useState('lagos');

  useEffect(() => {
    const metrics = getModelMetrics();
    setModelMetrics(metrics);
  }, [getModelMetrics]);

  const handlePropertyPrediction = async () => {
    try {
      const prediction = await predictPropertyPrice(propertyForm);
      setPropertyPrediction(prediction);
    } catch (err) {
      console.error('Property prediction failed:', err);
    }
  };

  const handleMarketPrediction = async () => {
    try {
      const prediction = await predictMarketTrend(selectedMarketCity, '6months');
      setMarketPrediction(prediction);
    } catch (err) {
      console.error('Market prediction failed:', err);
    }
  };

  const handleGenerateRecommendations = async () => {
    try {
      const recs = await generateRecommendations({ type: 'investment' });
      setRecommendations(recs);
    } catch (err) {
      console.error('Recommendation generation failed:', err);
    }
  };

  const formatCurrency = (amount: number) => {
    return `₦${(amount / 1000000).toFixed(1)}M`;
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  return (
    <div className="space-y-6">
      {/* AI/ML System Status */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {modelMetrics.map((metric, index) => (
          <Card key={index}>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Brain className="h-4 w-4 text-purple-600" />
                <span className="text-sm font-medium">
                  {index === 0 ? 'Property' : index === 1 ? 'Market' : index === 2 ? 'User' : 'Investment'} AI
                </span>
              </div>
              <div className="text-2xl font-bold text-purple-600 mt-1">
                {formatPercentage(metric.accuracy * 100)}
              </div>
              <div className="text-xs text-gray-600">Accuracy</div>
              <Progress value={metric.accuracy * 100} className="h-1 mt-2" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* AI Capabilities Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-purple-600" />
            AI/ML Capabilities
          </CardTitle>
          <CardDescription>
            Advanced machine learning models for Nigerian property market analysis
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-3">
                <Home className="h-5 w-5 text-blue-600" />
                <div>
                  <div className="font-medium">Property Valuation</div>
                  <div className="text-sm text-gray-600">AI price prediction</div>
                </div>
              </div>
              <Badge variant="default">87%</Badge>
            </div>

            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-3">
                <TrendingUp className="h-5 w-5 text-green-600" />
                <div>
                  <div className="font-medium">Market Analysis</div>
                  <div className="text-sm text-gray-600">Trend forecasting</div>
                </div>
              </div>
              <Badge variant="default">82%</Badge>
            </div>

            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-3">
                <Users className="h-5 w-5 text-purple-600" />
                <div>
                  <div className="font-medium">User Behavior</div>
                  <div className="text-sm text-gray-600">Intent prediction</div>
                </div>
              </div>
              <Badge variant="default">79%</Badge>
            </div>

            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-3">
                <Target className="h-5 w-5 text-orange-600" />
                <div>
                  <div className="font-medium">Investment Score</div>
                  <div className="text-sm text-gray-600">ROI assessment</div>
                </div>
              </div>
              <Badge variant="default">84%</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick AI Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Property Price Prediction */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Home className="h-5 w-5" />
              Property AI
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs">City</Label>
                <Select value={propertyForm.city} onValueChange={(value) => setPropertyForm({...propertyForm, city: value})}>
                  <SelectTrigger className="h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="lagos">Lagos</SelectItem>
                    <SelectItem value="abuja">Abuja</SelectItem>
                    <SelectItem value="port harcourt">Port Harcourt</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Size (sqm)</Label>
                <Input
                  className="h-8"
                  type="number"
                  value={propertyForm.size}
                  onChange={(e) => setPropertyForm({...propertyForm, size: parseInt(e.target.value)})}
                />
              </div>
            </div>

            <Button onClick={handlePropertyPrediction} disabled={loading} className="w-full h-8" size="sm">
              {loading ? <RefreshCw className="h-3 w-3 mr-2 animate-spin" /> : <Brain className="h-3 w-3 mr-2" />}
              Predict Price
            </Button>

            {propertyPrediction && (
              <div className="p-3 bg-blue-50 rounded-lg">
                <div className="text-lg font-bold text-blue-600">
                  {formatCurrency(propertyPrediction.predictedPrice)}
                </div>
                <div className="text-xs text-gray-600">
                  Confidence: {formatPercentage(propertyPrediction.confidence * 100)}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Market Trend Analysis */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Market AI
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-xs">Select City</Label>
              <Select value={selectedMarketCity} onValueChange={setSelectedMarketCity}>
                <SelectTrigger className="h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="lagos">Lagos</SelectItem>
                  <SelectItem value="abuja">Abuja</SelectItem>
                  <SelectItem value="port harcourt">Port Harcourt</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button onClick={handleMarketPrediction} disabled={loading} className="w-full h-8" size="sm">
              {loading ? <RefreshCw className="h-3 w-3 mr-2 animate-spin" /> : <BarChart3 className="h-3 w-3 mr-2" />}
              Analyze {selectedMarketCity.charAt(0).toUpperCase() + selectedMarketCity.slice(1)} Market
            </Button>

            {marketPrediction && (
              <div className="p-3 bg-green-50 rounded-lg">
                <div className="text-lg font-bold text-green-600">
                  +{formatPercentage(marketPrediction.priceGrowth)}
                </div>
                <div className="text-xs text-gray-600">
                  6-month forecast for {marketPrediction.city}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  Confidence: {formatPercentage(marketPrediction.confidence * 100)}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* AI Recommendations */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5" />
              AI Insights
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button onClick={handleGenerateRecommendations} disabled={loading} className="w-full h-8" size="sm">
              {loading ? <RefreshCw className="h-3 w-3 mr-2 animate-spin" /> : <Lightbulb className="h-3 w-3 mr-2" />}
              Generate Insights
            </Button>

            {recommendations.length > 0 && (
              <div className="space-y-2">
                {recommendations.slice(0, 2).map((rec, index) => (
                  <div key={index} className="p-3 bg-purple-50 rounded-lg">
                    <div className="font-medium text-sm text-purple-800">{rec.title}</div>
                    <div className="text-xs text-purple-600 mt-1">
                      ROI: {rec.expectedROI}% | {rec.timeline}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Model Training Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            Model Training Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <div className="font-medium">AI Model Status</div>
              <div className="text-sm text-gray-600">
                {isTraining() ? 'Models are currently being retrained with latest Nigerian market data' : 'All AI models are up to date and ready for predictions'}
              </div>
            </div>
            <div className="flex items-center gap-2">
              {isTraining() ? (
                <Badge variant="secondary" className="flex items-center gap-1">
                  <RefreshCw className="h-3 w-3 animate-spin" />
                  Training
                </Badge>
              ) : (
                <Badge variant="default" className="flex items-center gap-1">
                  <CheckCircle className="h-3 w-3" />
                  Ready
                </Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent AI Predictions */}
      <Card>
        <CardHeader>
          <CardTitle>Recent AI Predictions</CardTitle>
          <CardDescription>Latest AI-generated insights for Nigerian property market</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="p-3 bg-blue-50 rounded-lg">
            <div className="flex items-center gap-2 mb-1">
              <Home className="h-4 w-4 text-blue-600" />
              <span className="font-medium text-blue-800">Property Valuation</span>
            </div>
            <div className="text-sm text-blue-700">
              3-bedroom apartment in Lekki predicted at ₦45.2M (85% confidence)
            </div>
          </div>

          <div className="p-3 bg-green-50 rounded-lg">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="h-4 w-4 text-green-600" />
              <span className="font-medium text-green-800">Market Forecast</span>
            </div>
            <div className="text-sm text-green-700">
              Lagos market expected to grow 12.5% over next 6 months
            </div>
          </div>

          <div className="p-3 bg-purple-50 rounded-lg">
            <div className="flex items-center gap-2 mb-1">
              <Lightbulb className="h-4 w-4 text-purple-600" />
              <span className="font-medium text-purple-800">AI Recommendation</span>
            </div>
            <div className="text-sm text-purple-700">
              High-yield rental opportunity identified in Abuja Central (15.2% ROI)
            </div>
          </div>

          <div className="p-3 bg-orange-50 rounded-lg">
            <div className="flex items-center gap-2 mb-1">
              <Target className="h-4 w-4 text-orange-600" />
              <span className="font-medium text-orange-800">Investment Score</span>
            </div>
            <div className="text-sm text-orange-700">
              Port Harcourt residential properties scored 78/100 for investment potential
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
