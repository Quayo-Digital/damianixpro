// Blockchain Predictions Component
// Completes the predictions section for the analytics dashboard

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Brain, Activity } from 'lucide-react';
import { cn } from '@/lib/utils';
import { MarketPrediction } from '@/types/blockchainAnalytics';

interface BlockchainPredictionsProps {
  predictions: MarketPrediction[];
  onGenerateAnalysis: () => void;
  canUseAIInsights: boolean;
  isLoading: boolean;
}

export function BlockchainPredictions({
  predictions,
  onGenerateAnalysis,
  canUseAIInsights,
  isLoading,
}: BlockchainPredictionsProps) {
  // Format currency values
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <div className="grid gap-4">
      {predictions.map((prediction) => (
        <Card key={prediction.id}>
          <CardContent className="p-4">
            <div className="mb-3 flex items-center justify-between">
              <h4 className="font-semibold">{prediction.metric}</h4>
              <Badge variant="outline">{prediction.confidence}% confidence</Badge>
            </div>

            <div className="mb-4 grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-muted-foreground">Current Value</div>
                <div className="text-xl font-bold">{formatCurrency(prediction.currentValue)}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Predicted Value</div>
                <div
                  className={cn(
                    'text-xl font-bold',
                    prediction.predictedValue > prediction.currentValue
                      ? 'text-green-600'
                      : 'text-red-600'
                  )}
                >
                  {formatCurrency(prediction.predictedValue)}
                </div>
              </div>
            </div>

            <div className="mb-4">
              <div className="mb-2 text-sm font-medium">Key Factors</div>
              <div className="space-y-2">
                {prediction.factors.map((factor, index) => (
                  <div key={index} className="flex items-center justify-between text-sm">
                    <span>{factor.name}</span>
                    <div className="flex items-center space-x-2">
                      <Badge
                        variant="outline"
                        className={cn(
                          factor.impact === 'positive' && 'border-green-200 text-green-600',
                          factor.impact === 'negative' && 'border-red-200 text-red-600',
                          factor.impact === 'neutral' && 'border-gray-200 text-gray-600'
                        )}
                      >
                        {factor.impact}
                      </Badge>
                      <span className="text-muted-foreground">
                        {(factor.weight * 100).toFixed(0)}% weight
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="text-xs text-muted-foreground">
              Methodology: {prediction.methodology}
            </div>
          </CardContent>
        </Card>
      ))}

      {predictions.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <Activity className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
            <h3 className="mb-2 text-lg font-semibold">No Predictions Available</h3>
            <p className="mb-4 text-muted-foreground">
              AI predictions will appear here based on market analysis and historical data.
            </p>
            <Button onClick={onGenerateAnalysis} disabled={!canUseAIInsights || isLoading}>
              <Brain className="mr-2 h-4 w-4" />
              Generate Predictions
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
