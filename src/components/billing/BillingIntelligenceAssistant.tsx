import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import {
  DollarSign,
  Wallet,
  CreditCard,
  AlertCircle,
  CheckCircle,
  Info,
  Calculator,
  TrendingUp,
  TrendingDown,
} from 'lucide-react';

interface BillingQuery {
  queryType:
    | 'payment-status'
    | 'amount-calculation'
    | 'payment-method'
    | 'penalty-discount'
    | 'wallet-balance'
    | 'partial-payment'
    | 'general';
  userRole: 'landlord' | 'agent' | 'tenant';
  context: string;
}

interface BillingResponse {
  explanation: string;
  breakdown?: {
    item: string;
    amount: number;
    description: string;
  }[];
  totalAmount?: number;
  paymentMethods?: string[];
  nextSteps?: string[];
  warnings?: string[];
  clarity: string;
}

export function BillingIntelligenceAssistant() {
  const [userRole, setUserRole] = useState<string>('tenant');
  const [queryType, setQueryType] = useState<string>('general');
  const [context, setContext] = useState('');
  const [response, setResponse] = useState<BillingResponse | null>(null);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const processQuery = (query: BillingQuery): BillingResponse => {
    const queryLower = query.context.toLowerCase();
    let explanation = '';
    const breakdown: BillingResponse['breakdown'] = [];
    let totalAmount = 0;
    const paymentMethods: string[] = [];
    const nextSteps: string[] = [];
    const warnings: string[] = [];
    let clarity = '';

    // PAYMENT STATUS QUERIES
    if (
      query.queryType === 'payment-status' ||
      queryLower.includes('paid') ||
      queryLower.includes('outstanding') ||
      queryLower.includes('balance')
    ) {
      if (query.userRole === 'tenant') {
        explanation = 'Let me explain your payment status in simple terms. ';

        if (
          queryLower.includes('outstanding') ||
          queryLower.includes('owe') ||
          queryLower.includes('balance')
        ) {
          explanation +=
            "You have an outstanding balance, which means there's money you still need to pay. ";
          explanation +=
            'This could be your annual rent, penalties for late payment, or other charges. ';
          explanation +=
            'To see exactly what you owe, check your payment history or contact your property manager.';

          warnings.push('Outstanding balances may accrue penalties if not paid on time.');
          nextSteps.push("Review your payment breakdown to see what's included");
          nextSteps.push('Contact your property manager if you have questions about any charges');
          nextSteps.push(
            'Make payment through your preferred method (Flutterwave card, bank transfer, or USSD)'
          );
        } else {
          explanation +=
            'Your payment status shows whether your rent and other charges have been paid. ';
          explanation +=
            "If everything is paid, you're all set. If there's a balance, you'll need to make a payment.";
        }
      } else if (query.userRole === 'landlord' || query.userRole === 'agent') {
        explanation =
          "Payment status shows what you've received from tenants and what's still outstanding. ";
        explanation +=
          'This helps you track your rental income and identify any payment issues early.';
      }
    }

    // AMOUNT CALCULATION QUERIES
    else if (
      query.queryType === 'amount-calculation' ||
      queryLower.includes('calculate') ||
      queryLower.includes('total') ||
      queryLower.includes('how much')
    ) {
      explanation = 'Let me break down the amounts for you. ';

      // Try to extract numbers from context
      const rentMatch =
        queryLower.match(/rent[:\s]+₦?([\d,]+)/i) || queryLower.match(/([\d,]+)[\s]*rent/i);
      const penaltyMatch =
        queryLower.match(/penalty[:\s]+₦?([\d,]+)/i) || queryLower.match(/([\d,]+)[\s]*penalty/i);
      const discountMatch =
        queryLower.match(/discount[:\s]+₦?([\d,]+)/i) || queryLower.match(/([\d,]+)[\s]*discount/i);

      let rent = 0;
      let penalty = 0;
      let discount = 0;

      if (rentMatch) {
        rent = parseFloat(rentMatch[1].replace(/,/g, '')) || 0;
      }
      if (penaltyMatch) {
        penalty = parseFloat(penaltyMatch[1].replace(/,/g, '')) || 0;
      }
      if (discountMatch) {
        discount = parseFloat(discountMatch[1].replace(/,/g, '')) || 0;
      }

      if (rent > 0) {
        breakdown.push({
          item: 'Annual Rent',
          amount: rent,
          description: 'Your yearly rental amount',
        });
        totalAmount += rent;
      }

      if (penalty > 0) {
        breakdown.push({
          item: 'Late Payment Penalty',
          amount: penalty,
          description: 'Additional charge for paying after the due date',
        });
        totalAmount += penalty;
      }

      if (discount > 0) {
        breakdown.push({
          item: 'Discount',
          amount: -discount,
          description: 'Reduction in your total amount',
        });
        totalAmount -= discount;
      }

      if (breakdown.length > 0) {
        explanation += `Here's the breakdown: `;
        breakdown.forEach((item) => {
          explanation += `${item.item}: ${formatCurrency(Math.abs(item.amount))}${item.amount < 0 ? ' (discount)' : ''}. `;
        });
        explanation += `Total amount: ${formatCurrency(totalAmount)}.`;
      } else {
        explanation +=
          'To calculate your total, I need to know: your annual rent amount, any penalties, and any discounts. ';
        explanation += 'Once you provide these, I can give you an exact breakdown.';
      }
    }

    // PAYMENT METHOD QUERIES
    else if (
      query.queryType === 'payment-method' ||
      queryLower.includes('pay') ||
      queryLower.includes('payment method') ||
      queryLower.includes('how to pay')
    ) {
      explanation = 'You can pay through Flutterwave using several methods: ';

      paymentMethods.push('Card Payment - Use your debit or credit card (Visa, Mastercard, Verve)');
      paymentMethods.push('Bank Transfer - Direct transfer from your bank account');
      paymentMethods.push('USSD - Dial *966*Amount# from your phone');

      explanation +=
        'Card payments are instant, bank transfers may take a few minutes, and USSD works with most Nigerian banks. ';
      explanation += 'All methods are secure and processed through Flutterwave.';

      if (query.userRole === 'tenant') {
        nextSteps.push('Choose your preferred payment method');
        nextSteps.push('Have your payment details ready (card, bank app, or phone for USSD)');
        nextSteps.push('Complete the payment through the platform');
      }
    }

    // PENALTY AND DISCOUNT QUERIES
    else if (
      query.queryType === 'penalty-discount' ||
      queryLower.includes('penalty') ||
      queryLower.includes('late fee') ||
      queryLower.includes('discount')
    ) {
      if (queryLower.includes('penalty') || queryLower.includes('late fee')) {
        explanation =
          'Penalties are additional charges applied when rent is paid after the due date. ';
        explanation +=
          'The amount depends on your lease agreement - it could be a fixed amount or a percentage of the rent. ';
        explanation +=
          'Penalties help ensure timely payments and cover the cost of delayed income.';

        if (query.userRole === 'tenant') {
          warnings.push('To avoid penalties, pay your annual rent on or before the due date');
          nextSteps.push('Check your lease agreement for the exact penalty amount');
          nextSteps.push(
            'Contact your property manager if you need to discuss payment arrangements'
          );
        }
      } else if (queryLower.includes('discount')) {
        explanation = 'Discounts are reductions in your total payment amount. ';
        explanation +=
          'They might be offered for early payment, long-term leases, or as promotional offers. ';
        explanation += 'Discounts reduce the total amount you need to pay.';

        if (query.userRole === 'tenant') {
          nextSteps.push('Check if you qualify for any discounts');
          nextSteps.push('Ask your property manager about available discounts');
        }
      }
    }

    // WALLET BALANCE QUERIES
    else if (
      query.queryType === 'wallet-balance' ||
      queryLower.includes('wallet') ||
      queryLower.includes('balance')
    ) {
      explanation =
        "Your wallet balance is money you've added to your account that can be used for payments. ";

      if (query.userRole === 'tenant') {
        explanation += 'You can add money to your wallet and use it to pay rent or other charges. ';
        explanation +=
          "This makes payments faster and easier - you don't need to enter payment details each time.";

        nextSteps.push('Check your current wallet balance in your account');
        nextSteps.push('Add funds to your wallet if needed');
        nextSteps.push('Use wallet balance to make payments automatically');
      } else if (query.userRole === 'landlord' || query.userRole === 'agent') {
        explanation += 'Tenants can add funds to their wallet for easier payments. ';
        explanation +=
          'You can see wallet balances in tenant accounts and track wallet-based payments.';
      }
    }

    // PARTIAL PAYMENT QUERIES
    else if (
      query.queryType === 'partial-payment' ||
      queryLower.includes('partial') ||
      queryLower.includes('installment') ||
      queryLower.includes('split payment')
    ) {
      explanation =
        'Partial payments allow you to pay your annual rent in smaller amounts over time. ';
      explanation +=
        'For example, instead of paying ₦6,000,000 all at once, you might pay ₦500,000 each month. ';
      explanation += 'However, this needs to be agreed upon with your property manager first.';

      if (query.userRole === 'tenant') {
        warnings.push(
          "Partial payments must be agreed upon in advance - don't assume you can split payments without permission"
        );
        nextSteps.push('Contact your property manager to discuss partial payment options');
        nextSteps.push('Get written agreement on the payment schedule');
        nextSteps.push('Make sure you understand any additional terms or charges');
      } else if (query.userRole === 'landlord' || query.userRole === 'agent') {
        explanation += 'You can set up payment plans for tenants who need to pay in installments. ';
        explanation +=
          'This helps tenants manage their finances while ensuring you receive payments regularly.';
      }
    }

    // GENERAL QUERIES
    else {
      explanation = 'I can help you understand billing and payments for your property management. ';
      explanation += 'In Nigeria, rent is typically paid annually (once per year), not monthly. ';
      explanation += 'You can pay through Flutterwave using cards, bank transfers, or USSD. ';
      explanation +=
        'If you have specific questions about your payments, amounts, or payment methods, just ask!';
    }

    // Add clarity statement
    clarity = 'All amounts are in Nigerian Naira (₦). ';
    clarity += 'Payments are processed securely through Flutterwave. ';
    clarity +=
      'If you have questions about specific amounts or charges, contact your property manager for the most accurate information.';

    return {
      explanation,
      breakdown: breakdown.length > 0 ? breakdown : undefined,
      totalAmount: totalAmount > 0 ? totalAmount : undefined,
      paymentMethods: paymentMethods.length > 0 ? paymentMethods : undefined,
      nextSteps: nextSteps.length > 0 ? nextSteps : undefined,
      warnings: warnings.length > 0 ? warnings : undefined,
      clarity,
    };
  };

  const handleQuery = () => {
    if (!context.trim()) {
      return;
    }

    const query: BillingQuery = {
      queryType: queryType as any,
      userRole: userRole as any,
      context: context.trim(),
    };

    const result = processQuery(query);
    setResponse(result);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-blue-500" />
            Billing Intelligence Assistant
          </CardTitle>
          <CardDescription>
            Get clear explanations about payments, billing, and financial matters
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Query Input */}
          <div>
            <h3 className="mb-4 text-lg font-semibold">Ask Your Question</h3>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="userRole">Your Role</Label>
                <Select value={userRole} onValueChange={setUserRole}>
                  <SelectTrigger id="userRole">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="tenant">Tenant</SelectItem>
                    <SelectItem value="landlord">Landlord</SelectItem>
                    <SelectItem value="agent">Agent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="queryType">Query Type</Label>
                <Select value={queryType} onValueChange={setQueryType}>
                  <SelectTrigger id="queryType">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="general">General Question</SelectItem>
                    <SelectItem value="payment-status">Payment Status</SelectItem>
                    <SelectItem value="amount-calculation">Amount Calculation</SelectItem>
                    <SelectItem value="payment-method">Payment Method</SelectItem>
                    <SelectItem value="penalty-discount">Penalty/Discount</SelectItem>
                    <SelectItem value="wallet-balance">Wallet Balance</SelectItem>
                    <SelectItem value="partial-payment">Partial Payment</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="mt-4">
              <Label htmlFor="context">Your Question *</Label>
              <Textarea
                id="context"
                value={context}
                onChange={(e) => setContext(e.target.value)}
                placeholder="e.g., How much do I owe? How do I pay my rent? What is my wallet balance? Calculate total: rent ₦6,000,000, penalty ₦50,000"
                className="min-h-[100px]"
              />
            </div>
          </div>

          <Button onClick={handleQuery} className="w-full" size="lg">
            <Calculator className="mr-2 h-4 w-4" />
            Get Explanation
          </Button>
        </CardContent>
      </Card>

      {/* Response */}
      {response && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Info className="h-5 w-5 text-green-500" />
              Explanation
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Main Explanation */}
            <Alert className="border-blue-200 bg-blue-50">
              <Info className="h-4 w-4 text-blue-500" />
              <AlertTitle>Clear Explanation</AlertTitle>
              <AlertDescription className="mt-2 text-base">{response.explanation}</AlertDescription>
            </Alert>

            {/* Breakdown */}
            {response.breakdown && response.breakdown.length > 0 && (
              <div>
                <h3 className="mb-3 flex items-center gap-2 font-semibold">
                  <Calculator className="h-5 w-5" />
                  Amount Breakdown
                </h3>
                <div className="space-y-2">
                  {response.breakdown.map((item, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between rounded-lg border bg-gray-50 p-3"
                    >
                      <div className="flex-1">
                        <p className="font-medium text-gray-800">{item.item}</p>
                        <p className="text-sm text-gray-600">{item.description}</p>
                      </div>
                      <p
                        className={`font-bold ${item.amount < 0 ? 'text-green-600' : 'text-gray-800'}`}
                      >
                        {item.amount < 0 ? '-' : ''}
                        {formatCurrency(Math.abs(item.amount))}
                      </p>
                    </div>
                  ))}
                  {response.totalAmount !== undefined && (
                    <div className="mt-3 flex items-center justify-between rounded-lg border-2 border-blue-200 bg-blue-50 p-4">
                      <p className="text-lg font-bold text-gray-800">Total Amount</p>
                      <p className="text-xl font-bold text-blue-600">
                        {formatCurrency(response.totalAmount)}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Payment Methods */}
            {response.paymentMethods && response.paymentMethods.length > 0 && (
              <div>
                <h3 className="mb-3 flex items-center gap-2 font-semibold">
                  <CreditCard className="h-5 w-5" />
                  Available Payment Methods
                </h3>
                <div className="space-y-2">
                  {response.paymentMethods.map((method, index) => (
                    <div
                      key={index}
                      className="flex items-start gap-2 rounded-lg border bg-gray-50 p-3"
                    >
                      <CheckCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-green-500" />
                      <p className="text-sm text-gray-700">{method}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Next Steps */}
            {response.nextSteps && response.nextSteps.length > 0 && (
              <div>
                <h3 className="mb-3 flex items-center gap-2 font-semibold">
                  <TrendingUp className="h-5 w-5 text-green-500" />
                  What to Do Next
                </h3>
                <ol className="space-y-2">
                  {response.nextSteps.map((step, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm">
                      <span className="mt-0.5 font-semibold text-blue-600">{index + 1}.</span>
                      <span className="text-gray-700">{step}</span>
                    </li>
                  ))}
                </ol>
              </div>
            )}

            {/* Warnings */}
            {response.warnings && response.warnings.length > 0 && (
              <div>
                <h3 className="mb-3 flex items-center gap-2 font-semibold">
                  <AlertCircle className="h-5 w-5 text-yellow-500" />
                  Important Notes
                </h3>
                <div className="space-y-2">
                  {response.warnings.map((warning, index) => (
                    <Alert key={index} className="border-yellow-200 bg-yellow-50">
                      <AlertCircle className="h-4 w-4 text-yellow-500" />
                      <AlertDescription className="text-sm">{warning}</AlertDescription>
                    </Alert>
                  ))}
                </div>
              </div>
            )}

            {/* Clarity Statement */}
            <Alert className="border-gray-200 bg-gray-50">
              <Info className="h-4 w-4 text-gray-500" />
              <AlertDescription className="text-xs text-gray-600">
                {response.clarity}
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
