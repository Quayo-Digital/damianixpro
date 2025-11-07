
import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Toggle } from "@/components/ui/toggle";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Check } from "lucide-react";
import { Link } from "react-router-dom";

interface PricingPlan {
  name: string;
  description: string;
  monthlyPrice: number;
  yearlyPrice: number;
  currency: string;
  features: string[];
  buttonText: string;
  buttonVariant: "default" | "outline";
  highlighted?: boolean;
  href: string;
}

export const PricingPlans: React.FC = () => {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');

  const plans: PricingPlan[] = [
    {
      name: "Basic",
      description: "Perfect for small landlords",
      monthlyPrice: 15000,
      yearlyPrice: 150000, // 10 months price for yearly (2 months free)
      currency: "₦",
      features: [
        "Up to 10 properties",
        "Basic tenant portal",
        "Maintenance tracking",
        "Email support"
      ],
      buttonText: "Get Started",
      buttonVariant: "outline",
      href: "/auth"
    },
    {
      name: "Professional",
      description: "For growing property managers",
      monthlyPrice: 35000,
      yearlyPrice: 350000, // 10 months price for yearly (2 months free)
      currency: "₦",
      features: [
        "Up to 50 properties",
        "Advanced tenant portal",
        "Maintenance management",
        "Financial reporting",
        "Priority support"
      ],
      buttonText: "Get Started",
      buttonVariant: "default",
      highlighted: true,
      href: "/auth"
    },
    {
      name: "Enterprise",
      description: "For large property portfolios",
      monthlyPrice: 75000,
      yearlyPrice: 750000, // 10 months price for yearly (2 months free)
      currency: "₦",
      features: [
        "Unlimited properties",
        "Custom tenant portal",
        "Advanced analytics",
        "API access",
        "Dedicated support"
      ],
      buttonText: "Contact Sales",
      buttonVariant: "outline",
      href: "/auth"
    }
  ];

  const formatPrice = (price: number): string => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(price).replace('NGN', '₦');
  };

  const getYearlySavings = (monthly: number, yearly: number): string => {
    const monthlyCostForYear = monthly * 12;
    const savings = monthlyCostForYear - yearly;
    return formatPrice(savings);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-16">
      <div className="text-center mb-12">
        <h2 className="text-3xl md:text-4xl font-bold mb-4">Affordable Pricing Plans</h2>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
          Choose the plan that fits your needs with transparent pricing tailored for the Nigerian market.
        </p>
        
        {/* Billing toggle */}
        <div className="flex items-center justify-center gap-4 mb-8">
          <span className={`text-sm font-medium ${billingCycle === 'monthly' ? 'text-foreground' : 'text-muted-foreground'}`}>Monthly</span>
          <Switch
            checked={billingCycle === 'yearly'}
            onCheckedChange={(checked) => setBillingCycle(checked ? 'yearly' : 'monthly')}
          />
          <span className="text-sm font-medium flex items-center gap-1.5">
            <span className={billingCycle === 'yearly' ? 'text-foreground' : 'text-muted-foreground'}>Yearly</span>
            {billingCycle === 'yearly' && (
              <span className="bg-green-100 text-green-800 text-xs px-2 py-0.5 rounded-full">Save 16%</span>
            )}
          </span>
        </div>
        
        {/* Alternative toggle group implementation */}
        <div className="hidden">
          <ToggleGroup type="single" value={billingCycle} onValueChange={(value) => value && setBillingCycle(value as 'monthly' | 'yearly')}>
            <ToggleGroupItem value="monthly" aria-label="Monthly billing">Monthly</ToggleGroupItem>
            <ToggleGroupItem value="yearly" aria-label="Yearly billing">
              Yearly
              <span className="ml-1.5 bg-green-100 text-green-800 text-xs px-2 py-0.5 rounded-full">Save 16%</span>
            </ToggleGroupItem>
          </ToggleGroup>
        </div>
      </div>
      
      <div className="grid md:grid-cols-3 gap-8">
        {plans.map((plan, index) => (
          <Card 
            key={index} 
            className={`overflow-hidden ${plan.highlighted ? 
              'border-2 border-green-500 shadow-lg relative bg-gradient-to-b from-white to-green-50' : 
              'border border-border bg-background'}`}
          >
            {plan.highlighted && (
              <div className="absolute top-6 left-1/2 transform -translate-x-1/2 bg-green-500 text-white px-4 py-1 rounded-full text-sm font-medium z-20">
                Most Popular
              </div>
            )}
            
            <CardHeader className={plan.highlighted ? 'pt-16' : ''}>
              <CardTitle>{plan.name}</CardTitle>
              <CardDescription>{plan.description}</CardDescription>
              <div className="mt-4">
                <div className="flex items-baseline">
                  <span className="text-3xl font-bold">{formatPrice(billingCycle === 'monthly' ? plan.monthlyPrice : plan.yearlyPrice)}</span>
                  <span className="text-muted-foreground ml-1">
                    /{billingCycle === 'monthly' ? 'month' : 'year'}
                  </span>
                </div>
                {billingCycle === 'yearly' && (
                  <p className="text-xs text-green-600 font-medium mt-1">
                    Save {getYearlySavings(plan.monthlyPrice, plan.yearlyPrice)} per year
                  </p>
                )}
              </div>
            </CardHeader>
            
            <CardContent>
              <ul className="space-y-3 mb-6">
                {plan.features.map((feature, featureIndex) => (
                  <li key={featureIndex} className="flex items-center">
                    <div className="h-5 w-5 rounded-full bg-green-100 flex items-center justify-center mr-2">
                      <Check className="h-3 w-3 text-green-600" />
                    </div>
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
            
            <CardFooter>
              <Link to={plan.href} className="w-full">
                <Button 
                  variant={plan.buttonVariant} 
                  className={`w-full ${plan.highlighted ? 
                    'bg-gradient-to-r from-green-600 to-green-400 hover:from-green-700 hover:to-green-500 text-white' : ''}`}
                >
                  {plan.buttonText}
                </Button>
              </Link>
            </CardFooter>
          </Card>
        ))}
      </div>
      
      <div className="text-center mt-12 text-sm text-muted-foreground">
        <p>All prices are in Nigerian Naira (₦). Yearly plans are billed annually.</p>
        <p className="mt-2">Need a custom solution? <Link to="/contact" className="text-primary hover:underline">Contact our sales team</Link>.</p>
      </div>
    </div>
  );
};
