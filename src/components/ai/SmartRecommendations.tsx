// Smart Property Recommendations Component

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import {
  Brain,
  Heart,
  MapPin,
  DollarSign,
  Home,
  Star,
  TrendingUp,
  Clock,
  Eye,
  Bookmark,
  X,
} from 'lucide-react';
import { SmartRecommendation, MatchingScore } from '@/types/preferences';
import { SmartMatchingService } from '@/services/ai/smartMatching';
import { useAuthSession } from '@/contexts/auth';
import { toast } from 'sonner';

interface SmartRecommendationsProps {
  limit?: number;
  showHeader?: boolean;
  className?: string;
}

export const SmartRecommendations: React.FC<SmartRecommendationsProps> = ({
  limit = 5,
  showHeader = true,
  className = '',
}) => {
  const { user } = useAuthSession();
  const [recommendations, setRecommendations] = useState<SmartRecommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user?.id) {
      loadRecommendations();
    }
  }, [user?.id, limit]);

  const loadRecommendations = async () => {
    try {
      setLoading(true);
      setError(null);

      const recs = await SmartMatchingService.getSmartRecommendations(user!.id, limit);
      setRecommendations(recs);

      // If no recommendations but no error, show helpful message
      if (recs.length === 0) {
        setError(
          'No recommendations available. Complete your preferences to get personalized suggestions.'
        );
      }
    } catch (err) {
      setError('Failed to load smart recommendations');
      console.error('Error loading recommendations:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleInteraction = async (
    propertyId: string,
    interactionType: 'view' | 'save' | 'apply' | 'reject'
  ) => {
    try {
      await SmartMatchingService.trackInteraction(user!.id, propertyId, interactionType);

      // Update recommendation status
      setRecommendations((prev) =>
        prev.map((rec) =>
          rec.property_id === propertyId
            ? { ...rec, status: interactionType === 'reject' ? 'dismissed' : 'viewed' }
            : rec
        )
      );

      // Show feedback
      const messages = {
        view: "Property viewed - we'll improve your recommendations",
        save: 'Property saved to your favorites',
        apply: 'Application submitted successfully',
        reject: "Thanks for the feedback - we'll improve your recommendations",
      };

      toast.success(messages[interactionType]);
    } catch (error) {
      toast.error('Failed to track interaction');
    }
  };

  const getScoreColor = (score: number): string => {
    if (score >= 0.8) return 'text-green-600';
    if (score >= 0.6) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getConfidenceBadgeVariant = (confidence: string) => {
    switch (confidence) {
      case 'high':
        return 'default';
      case 'medium':
        return 'secondary';
      case 'low':
        return 'outline';
      default:
        return 'outline';
    }
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <div className="flex items-center space-x-2">
            <Brain className="h-5 w-5 animate-pulse" />
            <CardTitle>AI Smart Recommendations</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="mb-2 h-4 w-3/4 rounded bg-gray-200"></div>
                <div className="h-3 w-1/2 rounded bg-gray-200"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={className}>
        <CardContent className="pt-6">
          <div className="text-center text-red-600">
            <Brain className="mx-auto mb-2 h-8 w-8 opacity-50" />
            <p>{error}</p>
            <Button variant="outline" size="sm" onClick={loadRecommendations} className="mt-2">
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (recommendations.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <div className="flex items-center space-x-2">
            <Brain className="h-5 w-5" />
            <CardTitle>AI Smart Recommendations</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground">
            <Brain className="mx-auto mb-2 h-8 w-8 opacity-50" />
            <p>No recommendations available yet.</p>
            <p className="text-sm">Complete your profile to get personalized suggestions!</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      {showHeader && (
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Brain className="h-5 w-5 text-purple-600" />
              <div>
                <CardTitle className="text-lg">AI Smart Recommendations</CardTitle>
                <CardDescription>
                  Personalized property matches based on your preferences
                </CardDescription>
              </div>
            </div>
            <Badge variant="secondary" className="bg-purple-100 text-purple-700">
              <TrendingUp className="mr-1 h-3 w-3" />
              Smart
            </Badge>
          </div>
        </CardHeader>
      )}

      <CardContent className="space-y-4">
        {recommendations.map((recommendation, index) => (
          <RecommendationCard
            key={recommendation.id}
            recommendation={recommendation}
            rank={index + 1}
            onInteraction={handleInteraction}
          />
        ))}

        <div className="flex justify-center pt-4">
          <Button variant="outline" onClick={loadRecommendations} className="text-sm">
            <Brain className="mr-2 h-4 w-4" />
            Refresh Recommendations
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

interface RecommendationCardProps {
  recommendation: SmartRecommendation;
  rank: number;
  onInteraction: (propertyId: string, type: 'view' | 'save' | 'apply' | 'reject') => void;
}

const RecommendationCard: React.FC<RecommendationCardProps> = ({
  recommendation,
  rank,
  onInteraction,
}) => {
  const { matching_score } = recommendation;
  const [property, setProperty] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // In a real implementation, this would fetch property details
    // For now, we'll simulate property data
    setTimeout(() => {
      setProperty({
        id: recommendation.property_id,
        name: `Premium Property ${rank}`,
        location: 'Victoria Island, Lagos',
        rent_amount: 2500000,
        bedrooms: 3,
        bathrooms: 2,
        property_type: 'apartment',
        images: [`/api/placeholder/300/200?text=Property${rank}`],
      });
      setLoading(false);
    }, 500);
  }, [recommendation.property_id, rank]);

  if (loading || !property) {
    return (
      <div className="animate-pulse rounded-lg border p-4">
        <div className="mb-2 h-4 w-3/4 rounded bg-gray-200"></div>
        <div className="h-3 w-1/2 rounded bg-gray-200"></div>
      </div>
    );
  }

  const getScoreColor = (score: number): string => {
    if (score >= 0.8) return 'text-green-600';
    if (score >= 0.6) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="rounded-lg border p-4 transition-shadow hover:shadow-md">
      {/* Header with rank and confidence */}
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Badge variant="outline" className="text-xs">
            #{rank}
          </Badge>
          <Badge
            variant={
              matching_score.confidence_level === 'high'
                ? 'default'
                : matching_score.confidence_level === 'medium'
                  ? 'secondary'
                  : 'outline'
            }
            className="text-xs"
          >
            {matching_score.confidence_level} confidence
          </Badge>
        </div>
        <div className="flex items-center space-x-1">
          <Star className="h-4 w-4 fill-current text-yellow-500" />
          <span className={`text-sm font-semibold ${getScoreColor(matching_score.overall_score)}`}>
            {Math.round(matching_score.overall_score * 100)}% match
          </span>
        </div>
      </div>

      {/* Property info */}
      <div className="mb-3 flex space-x-4">
        <div className="flex h-16 w-20 items-center justify-center rounded-md bg-gray-200">
          <Home className="h-6 w-6 text-gray-400" />
        </div>
        <div className="flex-1">
          <h4 className="text-sm font-semibold">{property.name}</h4>
          <div className="mt-1 flex items-center text-xs text-muted-foreground">
            <MapPin className="mr-1 h-3 w-3" />
            {property.location}
          </div>
          <div className="mt-1 flex items-center text-xs text-muted-foreground">
            <DollarSign className="mr-1 h-3 w-3" />₦{property.rent_amount.toLocaleString()}/year
          </div>
        </div>
      </div>

      {/* Match reasons */}
      <div className="mb-3">
        <p className="mb-1 text-xs font-medium text-muted-foreground">Why this matches:</p>
        <div className="flex flex-wrap gap-1">
          {matching_score.reasons.slice(0, 2).map((reason, idx) => (
            <Badge key={idx} variant="outline" className="text-xs">
              {reason}
            </Badge>
          ))}
        </div>
      </div>

      {/* Score breakdown */}
      <div className="mb-4 space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span>Budget Match</span>
          <span className={getScoreColor(matching_score.score_breakdown.budget_score)}>
            {Math.round(matching_score.score_breakdown.budget_score * 100)}%
          </span>
        </div>
        <Progress value={matching_score.score_breakdown.budget_score * 100} className="h-1" />

        <div className="flex items-center justify-between text-xs">
          <span>Location Match</span>
          <span className={getScoreColor(matching_score.score_breakdown.location_score)}>
            {Math.round(matching_score.score_breakdown.location_score * 100)}%
          </span>
        </div>
        <Progress value={matching_score.score_breakdown.location_score * 100} className="h-1" />
      </div>

      <Separator className="my-3" />

      {/* Action buttons */}
      <div className="flex items-center justify-between">
        <div className="flex space-x-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => onInteraction(property.id, 'view')}
            className="text-xs"
          >
            <Eye className="mr-1 h-3 w-3" />
            View
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => onInteraction(property.id, 'save')}
            className="text-xs"
          >
            <Bookmark className="mr-1 h-3 w-3" />
            Save
          </Button>
        </div>

        <div className="flex space-x-2">
          <Button size="sm" onClick={() => onInteraction(property.id, 'apply')} className="text-xs">
            Apply Now
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onInteraction(property.id, 'reject')}
            className="text-xs text-muted-foreground hover:text-red-600"
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SmartRecommendations;
