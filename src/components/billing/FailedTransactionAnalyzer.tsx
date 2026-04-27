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
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  AlertTriangle,
  CheckCircle,
  Copy,
  RefreshCw,
  CreditCard,
  Building2,
  Smartphone,
  Wifi,
  Wallet,
  Info,
  MessageSquare,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface TransactionFailure {
  reference: string;
  amount: number;
  channel: string;
  gatewayResponse: string;
  customerEmail?: string;
  customerName?: string;
  failureReason?: string;
  errorCode?: string;
}

interface FailureAnalysis {
  likelyCause: {
    category:
      | 'network'
      | 'insufficient-funds'
      | 'bank-issue'
      | 'card-issue'
      | 'system-error'
      | 'unknown';
    confidence: 'high' | 'medium' | 'low';
    explanation: string;
    indicators: string[];
  };
  alternativePaymentMethod: {
    method: 'bank-transfer' | 'ussd' | 'card-retry' | 'wallet' | 'cash';
    reason: string;
    instructions: string;
  };
  recommendedActions: {
    action: string;
    priority: 'high' | 'medium' | 'low';
    description: string;
  }[];
  retryMessage: {
    sms: string;
    whatsapp: string;
    email: {
      subject: string;
      body: string;
    };
  };
}

export function FailedTransactionAnalyzer() {
  const [reference, setReference] = useState('');
  const [amount, setAmount] = useState('');
  const [channel, setChannel] = useState('');
  const [gatewayResponse, setGatewayResponse] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [failureReason, setFailureReason] = useState('');
  const [errorCode, setErrorCode] = useState('');
  const [analysis, setAnalysis] = useState<FailureAnalysis | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const { toast } = useToast();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const analyzeFailure = (): FailureAnalysis | null => {
    if (!reference || !amount || !gatewayResponse) {
      return null;
    }

    const paymentAmount = parseFloat(amount);
    if (isNaN(paymentAmount) || paymentAmount <= 0) {
      return null;
    }

    const response = gatewayResponse.toLowerCase();
    const reason = failureReason.toLowerCase();
    const code = errorCode.toLowerCase();

    // Analyze likely cause
    let likelyCause: FailureAnalysis['likelyCause'];
    const indicators: string[] = [];

    // Network issues
    if (
      response.includes('network') ||
      response.includes('timeout') ||
      response.includes('connection') ||
      response.includes('unable to connect') ||
      response.includes('connection error') ||
      code.includes('timeout') ||
      code.includes('network')
    ) {
      likelyCause = {
        category: 'network',
        confidence: 'high',
        explanation:
          'The transaction failed due to a network connectivity issue. This is usually temporary and can be resolved by retrying the payment.',
        indicators: ['Network timeout', 'Connection error', 'Unable to connect'],
      };
    }
    // Insufficient funds
    else if (
      response.includes('insufficient') ||
      response.includes('balance') ||
      response.includes('fund') ||
      response.includes('low balance') ||
      response.includes('not enough') ||
      reason.includes('insufficient') ||
      code.includes('insufficient')
    ) {
      likelyCause = {
        category: 'insufficient-funds',
        confidence: 'high',
        explanation:
          'The transaction failed because there are insufficient funds in the account or card. The customer needs to ensure they have enough balance before retrying.',
        indicators: ['Insufficient funds', 'Low balance', 'Not enough balance'],
      };
    }
    // Bank issues
    else if (
      response.includes('bank') ||
      response.includes('declined by bank') ||
      response.includes('bank error') ||
      response.includes('banking system') ||
      response.includes('nibss') ||
      reason.includes('bank') ||
      code.includes('bank')
    ) {
      likelyCause = {
        category: 'bank-issue',
        confidence: 'medium',
        explanation:
          'The transaction was declined by the bank. This could be due to bank maintenance, security restrictions, or account limitations.',
        indicators: ['Bank declined', 'Bank error', 'Banking system issue'],
      };
    }
    // Card issues
    else if (
      response.includes('card') ||
      response.includes('expired') ||
      response.includes('invalid card') ||
      response.includes('card declined') ||
      response.includes('cvv') ||
      response.includes('pin') ||
      reason.includes('card') ||
      code.includes('card')
    ) {
      likelyCause = {
        category: 'card-issue',
        confidence: 'high',
        explanation:
          'The transaction failed due to a card-related issue. This could be an expired card, invalid card details, or card restrictions.',
        indicators: ['Card declined', 'Invalid card', 'Card expired'],
      };
    }
    // System errors
    else if (
      response.includes('system') ||
      response.includes('server') ||
      response.includes('internal error') ||
      response.includes('service unavailable') ||
      response.includes('maintenance') ||
      code.includes('500') ||
      code.includes('503')
    ) {
      likelyCause = {
        category: 'system-error',
        confidence: 'medium',
        explanation:
          'The transaction failed due to a system error on the payment gateway. This is usually temporary and should be resolved shortly.',
        indicators: ['System error', 'Service unavailable', 'Internal error'],
      };
    }
    // Unknown
    else {
      likelyCause = {
        category: 'unknown',
        confidence: 'low',
        explanation:
          'The exact cause of the failure is unclear. It could be a temporary issue. We recommend trying an alternative payment method or contacting support.',
        indicators: ['Unknown error', 'Unspecified failure'],
      };
    }

    // Determine best alternative payment method
    let alternativePaymentMethod: FailureAnalysis['alternativePaymentMethod'];

    if (likelyCause.category === 'network') {
      // Network issues - suggest USSD or Bank Transfer (more reliable)
      alternativePaymentMethod = {
        method: 'ussd',
        reason:
          'USSD payments are more reliable during network issues as they use a different connection method.',
        instructions:
          'Dial *906*[amount]*[reference]# on your mobile phone to complete the payment via USSD.',
      };
    } else if (likelyCause.category === 'insufficient-funds') {
      // Insufficient funds - suggest bank transfer (can use different account)
      alternativePaymentMethod = {
        method: 'bank-transfer',
        reason:
          'Bank transfer allows you to use a different account or add funds to your current account before paying.',
        instructions:
          'Transfer the amount directly to our bank account. Account details will be provided after selection.',
      };
    } else if (likelyCause.category === 'card-issue') {
      // Card issues - suggest bank transfer or USSD
      alternativePaymentMethod = {
        method: 'bank-transfer',
        reason:
          'Bank transfer bypasses card-related issues and is a reliable alternative payment method.',
        instructions:
          'Transfer the amount directly to our bank account. Account details will be provided after selection.',
      };
    } else if (likelyCause.category === 'bank-issue') {
      // Bank issues - suggest retry with card or USSD
      alternativePaymentMethod = {
        method: 'ussd',
        reason:
          'USSD payments use a different banking channel and may work when direct bank transfers fail.',
        instructions:
          'Dial *906*[amount]*[reference]# on your mobile phone to complete the payment via USSD.',
      };
    } else {
      // Default to bank transfer
      alternativePaymentMethod = {
        method: 'bank-transfer',
        reason:
          'Bank transfer is a reliable alternative that works independently of card or network issues.',
        instructions:
          'Transfer the amount directly to our bank account. Account details will be provided after selection.',
      };
    }

    // Generate recommended actions
    const recommendedActions: FailureAnalysis['recommendedActions'] = [];

    if (likelyCause.category === 'network') {
      recommendedActions.push({
        action: 'Retry Payment',
        priority: 'high',
        description:
          'Wait a few minutes and try the payment again. Network issues are usually temporary.',
      });
      recommendedActions.push({
        action: 'Try Alternative Method',
        priority: 'high',
        description: `Use ${alternativePaymentMethod.method === 'ussd' ? 'USSD' : 'Bank Transfer'} as an alternative payment method.`,
      });
      recommendedActions.push({
        action: 'Check Internet Connection',
        priority: 'medium',
        description: 'Ensure you have a stable internet connection before retrying the payment.',
      });
    } else if (likelyCause.category === 'insufficient-funds') {
      recommendedActions.push({
        action: 'Check Account Balance',
        priority: 'high',
        description:
          'Verify that you have sufficient funds in your account or card before retrying.',
      });
      recommendedActions.push({
        action: 'Add Funds',
        priority: 'high',
        description: 'Add funds to your account or card, then retry the payment.',
      });
      recommendedActions.push({
        action: 'Use Alternative Account',
        priority: 'medium',
        description: 'Consider using a different bank account or payment method if available.',
      });
    } else if (likelyCause.category === 'card-issue') {
      recommendedActions.push({
        action: 'Verify Card Details',
        priority: 'high',
        description: 'Check that your card number, expiry date, and CVV are correct.',
      });
      recommendedActions.push({
        action: 'Check Card Status',
        priority: 'high',
        description: 'Ensure your card is active, not expired, and not blocked by your bank.',
      });
      recommendedActions.push({
        action: 'Use Alternative Payment Method',
        priority: 'high',
        description: `Try ${alternativePaymentMethod.method === 'bank-transfer' ? 'Bank Transfer' : 'USSD'} instead.`,
      });
    } else if (likelyCause.category === 'bank-issue') {
      recommendedActions.push({
        action: 'Contact Your Bank',
        priority: 'medium',
        description:
          'Reach out to your bank to check if there are any restrictions on your account.',
      });
      recommendedActions.push({
        action: 'Try Alternative Method',
        priority: 'high',
        description: `Use ${alternativePaymentMethod.method === 'ussd' ? 'USSD' : 'Bank Transfer'} as an alternative.`,
      });
      recommendedActions.push({
        action: 'Retry Later',
        priority: 'medium',
        description: 'Bank issues are often temporary. Try again in a few hours.',
      });
    } else {
      recommendedActions.push({
        action: 'Retry Payment',
        priority: 'high',
        description: 'Try the payment again. The issue may have been temporary.',
      });
      recommendedActions.push({
        action: 'Try Alternative Method',
        priority: 'high',
        description: `Use ${alternativePaymentMethod.method === 'bank-transfer' ? 'Bank Transfer' : 'USSD'} as an alternative.`,
      });
      recommendedActions.push({
        action: 'Contact Support',
        priority: 'low',
        description: 'If the issue persists, contact our support team for assistance.',
      });
    }

    // Generate calm, reassuring retry message
    const customerNameText = customerName || 'Valued Customer';
    const amountFormatted = formatCurrency(paymentAmount);

    // SMS version (concise)
    const sms = `Hi ${customerNameText}, your payment of ${amountFormatted} (Ref: ${reference}) didn't go through. ${likelyCause.category === 'network' ? 'This looks like a temporary network issue.' : likelyCause.category === 'insufficient-funds' ? 'Please check your account balance.' : 'No worries - this happens sometimes.'} You can retry or use ${alternativePaymentMethod.method === 'bank-transfer' ? 'bank transfer' : 'USSD'}. Need help? Reply to this message.`;

    // WhatsApp version (conversational)
    let whatsapp = `Hi ${customerNameText},\n\n`;
    whatsapp += `I wanted to let you know that your payment of ${amountFormatted} (Reference: ${reference}) didn't complete successfully.\n\n`;
    whatsapp += `${likelyCause.explanation}\n\n`;
    whatsapp += `Don't worry - this happens sometimes and it's usually easy to resolve.\n\n`;
    whatsapp += `Here's what you can do:\n\n`;
    recommendedActions
      .filter((a) => a.priority === 'high')
      .slice(0, 2)
      .forEach((action, index) => {
        whatsapp += `${index + 1}. ${action.action}: ${action.description}\n\n`;
      });
    whatsapp += `Alternatively, you can use ${alternativePaymentMethod.method === 'bank-transfer' ? 'bank transfer' : 'USSD'} to complete your payment.\n\n`;
    whatsapp += `If you need any assistance or have questions, please don't hesitate to reach out. We're here to help!\n\n`;
    whatsapp += `Best regards,\nProperty Management Team`;

    // Email version (formal but reassuring)
    const emailSubject = `Payment Issue - Reference ${reference}`;
    let emailBody = `Dear ${customerNameText},\n\n`;
    emailBody += `We wanted to inform you that your payment of ${amountFormatted} (Reference: ${reference}) was not completed successfully.\n\n`;
    emailBody += `**What happened?**\n`;
    emailBody += `${likelyCause.explanation}\n\n`;
    emailBody += `**No need to worry** - payment issues are common and usually easy to resolve. Your payment attempt has been recorded, and you can easily retry or use an alternative method.\n\n`;
    emailBody += `**Recommended Next Steps:**\n\n`;
    recommendedActions
      .filter((a) => a.priority === 'high')
      .forEach((action, index) => {
        emailBody += `${index + 1}. **${action.action}**\n`;
        emailBody += `   ${action.description}\n\n`;
      });
    emailBody += `**Alternative Payment Method:**\n`;
    emailBody += `We recommend using ${alternativePaymentMethod.method === 'bank-transfer' ? 'Bank Transfer' : 'USSD'} as an alternative:\n`;
    emailBody += `${alternativePaymentMethod.reason}\n`;
    emailBody += `${alternativePaymentMethod.instructions}\n\n`;
    emailBody += `**Payment Details:**\n`;
    emailBody += `- Amount: ${amountFormatted}\n`;
    emailBody += `- Reference: ${reference}\n`;
    emailBody += `- Payment Channel: ${channel || 'Not specified'}\n\n`;
    emailBody += `If you have any questions or need assistance, please don't hesitate to contact us. We're here to help make this process as smooth as possible.\n\n`;
    emailBody += `Thank you for your patience.\n\n`;
    emailBody += `Best regards,\n`;
    emailBody += `Property Management Team\n\n`;
    emailBody += `---\n`;
    emailBody += `This is an automated message. If you have already completed this payment, please disregard this message.`;

    return {
      likelyCause,
      alternativePaymentMethod,
      recommendedActions,
      retryMessage: {
        sms,
        whatsapp,
        email: {
          subject: emailSubject,
          body: emailBody,
        },
      },
    };
  };

  const handleAnalyze = () => {
    const result = analyzeFailure();
    if (result) {
      setAnalysis(result);
      toast({
        title: 'Analysis Complete',
        description: 'Transaction failure has been analyzed and retry messages generated.',
      });
    } else {
      toast({
        title: 'Missing Information',
        description: 'Please fill in reference, amount, and gateway response.',
        variant: 'destructive',
      });
    }
  };

  const handleCopy = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    setCopied(type);
    toast({
      title: 'Copied',
      description: `${type} copied to clipboard.`,
    });
    setTimeout(() => setCopied(null), 2000);
  };

  const getCauseColor = (category: string) => {
    switch (category) {
      case 'network':
        return 'bg-blue-100 text-blue-800';
      case 'insufficient-funds':
        return 'bg-yellow-100 text-yellow-800';
      case 'bank-issue':
        return 'bg-orange-100 text-orange-800';
      case 'card-issue':
        return 'bg-red-100 text-red-800';
      case 'system-error':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getCauseIcon = (category: string) => {
    switch (category) {
      case 'network':
        return <Wifi className="h-5 w-5" />;
      case 'insufficient-funds':
        return <Wallet className="h-5 w-5" />;
      case 'bank-issue':
        return <Building2 className="h-5 w-5" />;
      case 'card-issue':
        return <CreditCard className="h-5 w-5" />;
      case 'system-error':
        return <AlertTriangle className="h-5 w-5" />;
      default:
        return <Info className="h-5 w-5" />;
    }
  };

  const getMethodIcon = (method: string) => {
    switch (method) {
      case 'bank-transfer':
        return <Building2 className="h-4 w-4" />;
      case 'ussd':
        return <Smartphone className="h-4 w-4" />;
      case 'card-retry':
        return <CreditCard className="h-4 w-4" />;
      default:
        return <Wallet className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5 text-blue-500" />
            Failed Transaction Analyzer
          </CardTitle>
          <CardDescription>
            Analyze failed Flutterwave transactions, identify causes, suggest alternatives, and
            generate calm retry messages
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Transaction Details */}
          <div>
            <h3 className="mb-4 text-lg font-semibold">Transaction Details</h3>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="reference">Transaction Reference *</Label>
                <Input
                  id="reference"
                  value={reference}
                  onChange={(e) => setReference(e.target.value)}
                  placeholder="T123456789"
                />
              </div>
              <div>
                <Label htmlFor="amount">Amount (₦) *</Label>
                <Input
                  id="amount"
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="6000000"
                />
              </div>
              <div>
                <Label htmlFor="channel">Payment Channel</Label>
                <Select value={channel} onValueChange={setChannel}>
                  <SelectTrigger id="channel">
                    <SelectValue placeholder="Select channel" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="card">Card</SelectItem>
                    <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                    <SelectItem value="ussd">USSD</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="gatewayResponse">Gateway Response *</Label>
                <Input
                  id="gatewayResponse"
                  value={gatewayResponse}
                  onChange={(e) => setGatewayResponse(e.target.value)}
                  placeholder="Transaction declined by bank"
                />
              </div>
              <div>
                <Label htmlFor="failureReason">Failure Reason (Optional)</Label>
                <Input
                  id="failureReason"
                  value={failureReason}
                  onChange={(e) => setFailureReason(e.target.value)}
                  placeholder="Insufficient funds"
                />
              </div>
              <div>
                <Label htmlFor="errorCode">Error Code (Optional)</Label>
                <Input
                  id="errorCode"
                  value={errorCode}
                  onChange={(e) => setErrorCode(e.target.value)}
                  placeholder="ERR_001"
                />
              </div>
              <div>
                <Label htmlFor="customerName">Customer Name (Optional)</Label>
                <Input
                  id="customerName"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="John Doe"
                />
              </div>
              <div>
                <Label htmlFor="customerEmail">Customer Email (Optional)</Label>
                <Input
                  id="customerEmail"
                  type="email"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  placeholder="customer@example.com"
                />
              </div>
            </div>
          </div>

          <Button onClick={handleAnalyze} className="w-full" size="lg">
            <RefreshCw className="mr-2 h-4 w-4" />
            Analyze Failure
          </Button>
        </CardContent>
      </Card>

      {/* Analysis Results */}
      {analysis && (
        <>
          {/* Likely Cause */}
          <Card>
            <CardHeader>
              <CardTitle>Failure Analysis</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <div className="flex items-start gap-3">
                  <div className={getCauseColor(analysis.likelyCause.category)}>
                    {getCauseIcon(analysis.likelyCause.category)}
                  </div>
                  <div className="flex-1">
                    <AlertTitle className="flex items-center gap-2">
                      <Badge className={getCauseColor(analysis.likelyCause.category)}>
                        {analysis.likelyCause.category.replace('-', ' ').toUpperCase()}
                      </Badge>
                      <Badge variant="outline">
                        {analysis.likelyCause.confidence.toUpperCase()} Confidence
                      </Badge>
                    </AlertTitle>
                    <AlertDescription className="mt-2">
                      <p className="mb-2 font-semibold">Likely Cause:</p>
                      <p>{analysis.likelyCause.explanation}</p>
                      {analysis.likelyCause.indicators.length > 0 && (
                        <div className="mt-3">
                          <p className="mb-1 text-sm font-semibold">Indicators:</p>
                          <div className="flex flex-wrap gap-2">
                            {analysis.likelyCause.indicators.map((indicator, index) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                {indicator}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </AlertDescription>
                  </div>
                </div>
              </Alert>

              {/* Alternative Payment Method */}
              <div className="rounded-lg border bg-gray-50 p-4">
                <div className="mb-2 flex items-center gap-2">
                  {getMethodIcon(analysis.alternativePaymentMethod.method)}
                  <h4 className="font-semibold">Recommended Alternative Payment Method</h4>
                </div>
                <p className="mb-2 text-sm text-gray-600">
                  <strong>
                    {analysis.alternativePaymentMethod.method.replace('-', ' ').toUpperCase()}
                  </strong>
                </p>
                <p className="mb-2 text-sm">{analysis.alternativePaymentMethod.reason}</p>
                <p className="text-sm font-medium">
                  {analysis.alternativePaymentMethod.instructions}
                </p>
              </div>

              {/* Recommended Actions */}
              <div>
                <h4 className="mb-3 font-semibold">Recommended Actions</h4>
                <div className="space-y-2">
                  {analysis.recommendedActions.map((action, index) => (
                    <div
                      key={index}
                      className="flex items-start gap-3 rounded-lg border bg-gray-50 p-3"
                    >
                      <Badge
                        variant={action.priority === 'high' ? 'destructive' : 'secondary'}
                        className={
                          action.priority === 'high'
                            ? 'bg-red-100 text-red-800'
                            : action.priority === 'medium'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-blue-100 text-blue-800'
                        }
                      >
                        {action.priority.toUpperCase()}
                      </Badge>
                      <div className="flex-1">
                        <p className="font-semibold">{action.action}</p>
                        <p className="text-sm text-gray-600">{action.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Retry Messages */}
          <Card>
            <CardHeader>
              <CardTitle>Retry Messages</CardTitle>
              <CardDescription>Calm, reassuring messages to send to the customer</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="sms" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="sms">
                    <Smartphone className="mr-2 h-4 w-4" />
                    SMS
                  </TabsTrigger>
                  <TabsTrigger value="whatsapp">
                    <MessageSquare className="mr-2 h-4 w-4" />
                    WhatsApp
                  </TabsTrigger>
                  <TabsTrigger value="email">
                    <MessageSquare className="mr-2 h-4 w-4" />
                    Email
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="sms" className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>SMS Message ({analysis.retryMessage.sms.length} characters)</Label>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleCopy(analysis.retryMessage.sms, 'SMS')}
                      >
                        {copied === 'SMS' ? (
                          <>
                            <CheckCircle className="mr-2 h-4 w-4" />
                            Copied
                          </>
                        ) : (
                          <>
                            <Copy className="mr-2 h-4 w-4" />
                            Copy
                          </>
                        )}
                      </Button>
                    </div>
                    <Textarea
                      value={analysis.retryMessage.sms}
                      readOnly
                      className="font-mono text-sm"
                      rows={4}
                    />
                  </div>
                </TabsContent>

                <TabsContent value="whatsapp" className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>WhatsApp Message</Label>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleCopy(analysis.retryMessage.whatsapp, 'WhatsApp')}
                      >
                        {copied === 'WhatsApp' ? (
                          <>
                            <CheckCircle className="mr-2 h-4 w-4" />
                            Copied
                          </>
                        ) : (
                          <>
                            <Copy className="mr-2 h-4 w-4" />
                            Copy
                          </>
                        )}
                      </Button>
                    </div>
                    <Textarea
                      value={analysis.retryMessage.whatsapp}
                      readOnly
                      className="font-mono text-sm"
                      rows={12}
                    />
                  </div>
                </TabsContent>

                <TabsContent value="email" className="space-y-4">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label>Email Subject</Label>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            handleCopy(analysis.retryMessage.email.subject, 'Email Subject')
                          }
                        >
                          {copied === 'Email Subject' ? (
                            <>
                              <CheckCircle className="mr-2 h-4 w-4" />
                              Copied
                            </>
                          ) : (
                            <>
                              <Copy className="mr-2 h-4 w-4" />
                              Copy
                            </>
                          )}
                        </Button>
                      </div>
                      <Input
                        value={analysis.retryMessage.email.subject}
                        readOnly
                        className="font-mono text-sm"
                      />
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label>Email Body</Label>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleCopy(analysis.retryMessage.email.body, 'Email Body')}
                        >
                          {copied === 'Email Body' ? (
                            <>
                              <CheckCircle className="mr-2 h-4 w-4" />
                              Copied
                            </>
                          ) : (
                            <>
                              <Copy className="mr-2 h-4 w-4" />
                              Copy
                            </>
                          )}
                        </Button>
                      </div>
                      <Textarea
                        value={analysis.retryMessage.email.body}
                        readOnly
                        className="font-mono text-sm"
                        rows={20}
                      />
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
