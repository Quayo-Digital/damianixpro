
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useState } from "react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useSubscription } from '@/hooks/useSubscription';
import { useAuth } from '@/contexts/auth';
import { Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from "@/components/ui/sonner";

const plans = [
  {
    name: "Basic",
    monthlyPrice: 20,
    yearlyPrice: 200,
    features: ["Feature 1", "Feature 2", "Feature 3"],
  },
  {
    name: "Pro",
    monthlyPrice: 50,
    yearlyPrice: 500,
    features: ["All Basic Features", "Feature 4", "Feature 5"],
  },
  {
    name: "Enterprise",
    monthlyPrice: 100,
    yearlyPrice: 1000,
    features: ["All Pro Features", "24/7 Support", "Custom Integrations"],
  },
];

export function SubscriptionPricingPlans() {
  const [billingCycle, setBillingCycle] = useState<"monthly" | "annually">("monthly");
  const { startSubscription, isProcessing } = useSubscription();
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleSubscription = (planName: string, interval: 'monthly' | 'annually', amount: number) => {
    if (!user) {
      navigate('/auth');
      toast.info('Please log in or sign up to subscribe.');
      return;
    }
    startSubscription(planName, interval, amount);
  };

  return (
    <div className="container mx-auto py-12">
      <div className="text-center mb-10">
        <h1 className="text-4xl font-bold">Our Pricing</h1>
        <p className="text-lg text-muted-foreground mt-2">
          Choose the plan that's right for you.
        </p>
      </div>

      <div className="flex justify-center items-center space-x-4 mb-8">
        <Label htmlFor="billing-cycle">Monthly</Label>
        <Switch
          id="billing-cycle"
          checked={billingCycle === "annually"}
          onCheckedChange={(checked) => setBillingCycle(checked ? "annually" : "monthly")}
        />
        <Label htmlFor="billing-cycle">Annually (Save 10%)</Label>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {plans.map((plan) => (
          <Card key={plan.name} className="flex flex-col">
            <CardHeader>
              <CardTitle>{plan.name}</CardTitle>
              <CardDescription>
                <span className="text-3xl font-bold">
                  ${billingCycle === "monthly" ? plan.monthlyPrice : plan.yearlyPrice}
                </span>
                /{billingCycle === "monthly" ? "mo" : "yr"}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-grow">
              <ul className="space-y-2">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-center">
                    <Check className="h-5 w-5 text-green-500 mr-2" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
            <CardFooter>
              <Button 
                className="w-full" 
                onClick={() => handleSubscription(
                  plan.name, 
                  billingCycle, 
                  billingCycle === 'monthly' ? plan.monthlyPrice : plan.yearlyPrice
                )}
                disabled={isProcessing}
              >
                {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Get Started
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}
