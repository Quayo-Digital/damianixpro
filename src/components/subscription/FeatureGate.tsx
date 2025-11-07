import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Lock, Crown, Zap, Star, Building2, AlertTriangle } from 'lucide-react';
import { useSubscription } from '@/hooks/useSubscription';
import { SubscriptionTier } from '@/types/subscription';

interface FeatureGateProps {
  feature: string;
  requiredTier?: SubscriptionTier;
  requiredFeature?: string;
  usageKey?: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
  showUpgrade?: boolean;
  className?: string;
}

const tierIcons = {
  free: Star,
  starter: Zap,
  professional: Crown,
  enterprise: Building2,
  white_label: Building2
};

const tierNames = {
  free: 'Free',
  starter: 'Starter',
  professional: 'Professional',
  enterprise: 'Enterprise',
  white_label: 'White Label'
};

const tierColors = {
  free: 'bg-gray-100 text-gray-800',
  starter: 'bg-blue-100 text-blue-800',
  professional: 'bg-purple-100 text-purple-800',
  enterprise: 'bg-gold-100 text-gold-800',
  white_label: 'bg-indigo-100 text-indigo-800'
};

export const FeatureGate: React.FC<FeatureGateProps> = ({
  feature,
  requiredTier,
  requiredFeature,
  usageKey,
  children,
  fallback,
  showUpgrade = true,
  className = ''
}) => {
  const {
    hasFeatureAccess,
    checkFeatureUsage,
    currentSubscription,
    subscriptionPlans,
    createCheckout
  } = useSubscription();

  // Check if user has access to the feature
  const hasAccess = requiredFeature 
    ? hasFeatureAccess(requiredFeature)
    : requiredTier 
      ? currentSubscription?.tier && getTierLevel(currentSubscription.tier) >= getTierLevel(requiredTier)
      : true;

  // Check usage limits if specified
  const canUse = usageKey ? checkFeatureUsage(usageKey) : { allowed: true, remaining: Infinity };

  // If user has access and can use the feature, render children
  if (hasAccess && canUse.allowed) {
    return <div className={className}>{children}</div>;
  }

  // If custom fallback is provided, use it
  if (fallback) {
    return <div className={className}>{fallback}</div>;
  }

  // Default upgrade prompt
  const getRequiredPlan = () => {
    if (!requiredTier) return null;
    return subscriptionPlans?.find(plan => plan.tier === requiredTier);
  };

  const requiredPlan = getRequiredPlan();
  const TierIcon = requiredTier ? tierIcons[requiredTier] : Crown;

  const handleUpgrade = async () => {
    if (!requiredPlan) return;
    
    try {
      await createCheckout.mutateAsync({
        planId: requiredPlan.id,
        billingCycle: 'monthly'
      });
    } catch (error) {
      console.error('Upgrade error:', error);
    }
  };

  return (
    <div className={className}>
      <Card className="border-dashed border-2 border-gray-300">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center mb-2">
            <div className="relative">
              <TierIcon className="h-12 w-12 text-gray-400" />
              <Lock className="h-6 w-6 text-gray-500 absolute -bottom-1 -right-1 bg-white rounded-full p-1" />
            </div>
          </div>
          
          <CardTitle className="text-lg text-gray-700">
            Premium Feature
          </CardTitle>
          
          <CardDescription>
            {!hasAccess ? (
              <>
                This feature requires a{' '}
                {requiredTier && (
                  <Badge className={tierColors[requiredTier]}>
                    {tierNames[requiredTier]}
                  </Badge>
                )}{' '}
                subscription or higher.
              </>
            ) : (
              <>
                You've reached your usage limit for this feature.{' '}
                {canUse.reason && (
                  <span className="text-sm text-gray-600">
                    ({canUse.reason})
                  </span>
                )}
              </>
            )}
          </CardDescription>
        </CardHeader>

        <CardContent className="text-center space-y-4">
          {!hasAccess && requiredPlan && (
            <div className="space-y-2">
              <p className="text-sm text-gray-600">
                Upgrade to unlock this feature and many more:
              </p>
              
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="flex items-center justify-center space-x-2 mb-2">
                  <TierIcon className="h-5 w-5 text-blue-600" />
                  <span className="font-semibold">{requiredPlan.name}</span>
                </div>
                
                <div className="text-sm text-gray-600 mb-2">
                  Starting at{' '}
                  <span className="font-semibold text-blue-600">
                    ₦{(requiredPlan.pricing.monthly || 0).toLocaleString()}/month
                  </span>
                </div>
                
                {requiredPlan.trial_days > 0 && (
                  <Badge variant="outline" className="text-green-600 border-green-600">
                    {requiredPlan.trial_days}-day free trial
                  </Badge>
                )}
              </div>
            </div>
          )}

          {!canUse.allowed && hasAccess && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-2">
                  <p>
                    Current usage: {canUse.current_usage} / {canUse.limit}
                  </p>
                  {canUse.overage_allowed && (
                    <p className="text-sm">
                      You can continue using this feature with overage charges.
                    </p>
                  )}
                </div>
              </AlertDescription>
            </Alert>
          )}

          {showUpgrade && (
            <div className="flex flex-col sm:flex-row gap-2 justify-center">
              {!hasAccess && requiredPlan && (
                <Button 
                  onClick={handleUpgrade}
                  disabled={createCheckout.isPending}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Crown className="h-4 w-4 mr-2" />
                  {requiredPlan.trial_days > 0 ? 'Start Free Trial' : 'Upgrade Now'}
                </Button>
              )}
              
              <Button variant="outline" onClick={() => window.open('/pricing', '_blank')}>
                View All Plans
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

// Utility function to get tier hierarchy level
function getTierLevel(tier: SubscriptionTier): number {
  const levels = {
    free: 0,
    starter: 1,
    professional: 2,
    enterprise: 3,
    white_label: 4
  };
  return levels[tier] || 0;
}

// Higher-order component for feature gating
export function withFeatureGate<P extends object>(
  Component: React.ComponentType<P>,
  gateProps: Omit<FeatureGateProps, 'children'>
) {
  return function FeatureGatedComponent(props: P) {
    return (
      <FeatureGate {...gateProps}>
        <Component {...props} />
      </FeatureGate>
    );
  };
}

// Hook for programmatic feature checking
export function useFeatureGate(feature: string, requiredTier?: SubscriptionTier) {
  const { hasFeatureAccess, currentSubscription } = useSubscription();
  
  const hasAccess = requiredTier 
    ? currentSubscription?.tier && getTierLevel(currentSubscription.tier) >= getTierLevel(requiredTier)
    : hasFeatureAccess(feature);
    
  return {
    hasAccess,
    currentTier: currentSubscription?.tier,
    requiredTier
  };
}
