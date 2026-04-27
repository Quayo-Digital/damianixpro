import React, { useState } from 'react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Toggle } from '@/components/ui/toggle';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Check } from 'lucide-react';
import { Link } from 'react-router-dom';

interface PricingPlan {
  name: string;
  description: string;
  monthlyPrice: number;
  yearlyPrice: number;
  currency: string;
  features: string[];
  buttonText: string;
  buttonVariant: 'default' | 'outline';
  highlighted?: boolean;
  href: string;
}

export const PricingPlans: React.FC = () => {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');

  const plans: PricingPlan[] = [
    {
      name: 'Basic',
      description: 'Perfect for small landlords',
      monthlyPrice: 15000,
      yearlyPrice: 150000, // 10 months price for yearly (2 months free)
      currency: '₦',
      features: [
        'Up to 10 properties',
        'Basic tenant portal',
        'Maintenance tracking',
        'Email support',
      ],
      buttonText: 'Get Started',
      buttonVariant: 'outline',
      href: '/auth',
    },
    {
      name: 'Professional',
      description: 'For growing property managers',
      monthlyPrice: 35000,
      yearlyPrice: 350000, // 10 months price for yearly (2 months free)
      currency: '₦',
      features: [
        'Up to 50 properties',
        'Advanced tenant portal',
        'Maintenance management',
        'Financial reporting',
        'Priority support',
      ],
      buttonText: 'Get Started',
      buttonVariant: 'default',
      highlighted: true,
      href: '/auth',
    },
    {
      name: 'Enterprise',
      description: 'For large property portfolios',
      monthlyPrice: 75000,
      yearlyPrice: 750000, // 10 months price for yearly (2 months free)
      currency: '₦',
      features: [
        'Unlimited properties',
        'Custom tenant portal',
        'Advanced analytics',
        'API access',
        'Dedicated support',
      ],
      buttonText: 'Contact Sales',
      buttonVariant: 'outline',
      href: '/auth',
    },
  ];

  const formatPrice = (price: number): string => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    })
      .format(price)
      .replace('NGN', '₦');
  };

  const getYearlySavings = (monthly: number, yearly: number): string => {
    const monthlyCostForYear = monthly * 12;
    const savings = monthlyCostForYear - yearly;
    return formatPrice(savings);
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-16">
      <div className="mb-12 text-center">
        <h2 className="mb-4 text-3xl font-bold md:text-4xl">Affordable Pricing Plans</h2>
        <p className="mx-auto mb-2 max-w-2xl text-lg text-muted-foreground">
          Choose the plan that fits your needs with transparent pricing tailored for the Nigerian
          market.
        </p>
        <p className="mb-8 text-base font-semibold text-green-600 dark:text-green-400">
          For Landlords & Property Managers
        </p>

        {/* Billing toggle */}
        <div className="mb-8 flex items-center justify-center gap-4">
          <span
            className={`text-sm font-medium ${billingCycle === 'monthly' ? 'text-foreground' : 'text-muted-foreground'}`}
          >
            Monthly
          </span>
          <Switch
            checked={billingCycle === 'yearly'}
            onCheckedChange={(checked) => setBillingCycle(checked ? 'yearly' : 'monthly')}
          />
          <span className="flex items-center gap-1.5 text-sm font-medium">
            <span
              className={billingCycle === 'yearly' ? 'text-foreground' : 'text-muted-foreground'}
            >
              Yearly
            </span>
            {billingCycle === 'yearly' && (
              <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-800 dark:bg-green-950/50 dark:text-green-200">
                Save 16%
              </span>
            )}
          </span>
        </div>

        {/* Alternative toggle group implementation */}
        <div className="hidden">
          <ToggleGroup
            type="single"
            value={billingCycle}
            onValueChange={(value) => value && setBillingCycle(value as 'monthly' | 'yearly')}
          >
            <ToggleGroupItem value="monthly" aria-label="Monthly billing">
              Monthly
            </ToggleGroupItem>
            <ToggleGroupItem value="yearly" aria-label="Yearly billing">
              Yearly
              <span className="ml-1.5 rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-800 dark:bg-green-950/50 dark:text-green-200">
                Save 16%
              </span>
            </ToggleGroupItem>
          </ToggleGroup>
        </div>
      </div>

      <div className="grid gap-8 md:grid-cols-3">
        {plans.map((plan, index) => (
          <Card
            key={index}
            className={`overflow-hidden ${
              plan.highlighted
                ? 'relative border-2 border-green-500 bg-gradient-to-b from-card to-green-50 shadow-lg dark:border-green-600 dark:from-card dark:to-green-950/35'
                : 'border border-border bg-background'
            }`}
          >
            {plan.highlighted && (
              <div className="absolute left-1/2 top-6 z-20 -translate-x-1/2 transform rounded-full bg-green-500 px-4 py-1 text-sm font-medium text-primary-foreground dark:bg-green-600">
                Most Popular
              </div>
            )}

            <CardHeader className={plan.highlighted ? 'pt-16' : ''}>
              <CardTitle>{plan.name}</CardTitle>
              <CardDescription>{plan.description}</CardDescription>
              <div className="mt-4">
                <div className="flex items-baseline">
                  <span className="text-3xl font-bold">
                    {formatPrice(billingCycle === 'monthly' ? plan.monthlyPrice : plan.yearlyPrice)}
                  </span>
                  <span className="ml-1 text-muted-foreground">
                    /{billingCycle === 'monthly' ? 'month' : 'year'}
                  </span>
                </div>
                {billingCycle === 'yearly' && (
                  <p className="mt-1 text-xs font-medium text-green-600 dark:text-green-400">
                    Save {getYearlySavings(plan.monthlyPrice, plan.yearlyPrice)} per year
                  </p>
                )}
              </div>
            </CardHeader>

            <CardContent>
              <ul className="mb-6 space-y-3">
                {plan.features.map((feature, featureIndex) => (
                  <li key={featureIndex} className="flex items-center">
                    <div className="mr-2 flex h-5 w-5 items-center justify-center rounded-full bg-green-100 dark:bg-green-950/50">
                      <Check className="h-3 w-3 text-green-600 dark:text-green-400" />
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
                  className={`w-full ${
                    plan.highlighted
                      ? 'bg-gradient-to-r from-green-600 to-green-400 text-primary-foreground hover:from-green-700 hover:to-green-500'
                      : ''
                  }`}
                >
                  {plan.buttonText}
                </Button>
              </Link>
            </CardFooter>
          </Card>
        ))}
      </div>

      <div className="mt-12 text-center text-sm text-muted-foreground">
        <p>All prices are in Nigerian Naira (₦). Yearly plans are billed annually.</p>
        <p className="mt-2">
          Need a custom solution?{' '}
          <Link
            to="/contact"
            className="font-medium text-green-600 hover:text-green-700 hover:underline dark:text-green-400 dark:hover:text-green-300"
          >
            Contact our sales team
          </Link>
          .
        </p>
      </div>
    </div>
  );
};
