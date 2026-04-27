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
import {
  Webhook,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Info,
  Clock,
  CreditCard,
  Building2,
  Smartphone,
} from 'lucide-react';

interface WebhookData {
  transactionStatus: string;
  amount: string;
  reference: string;
  channel: string;
  timestamp: string;
  gatewayResponse?: string;
  customerEmail?: string;
  eventType?: string;
}

interface WebhookInterpretation {
  paymentSuccess: boolean;
  failureReason?: string;
  systemActions: {
    action: string;
    priority: 'high' | 'medium' | 'low';
    description: string;
  }[];
  userMessage: {
    title: string;
    message: string;
    severity: 'success' | 'info' | 'warning' | 'error';
  };
  transactionDetails: {
    status: string;
    amount: string;
    reference: string;
    channel: string;
    timestamp: string;
    formattedDate: string;
  };
}

export function PaymentWebhookInterpreter() {
  const [webhookData, setWebhookData] = useState<WebhookData>({
    transactionStatus: '',
    amount: '',
    reference: '',
    channel: '',
    timestamp: '',
    gatewayResponse: '',
    customerEmail: '',
    eventType: '',
  });
  const [interpretation, setInterpretation] = useState<WebhookInterpretation | null>(null);
  const [rawJson, setRawJson] = useState('');

  const formatCurrency = (amount: string) => {
    const numAmount = parseFloat(amount) || 0;
    // Flutterwave amounts are usually in Naira; some legacy payloads use kobo — treat large values as kobo
    const nairaAmount = numAmount >= 100 ? numAmount / 100 : numAmount;
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
    }).format(nairaAmount);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      return date.toLocaleString('en-NG', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        timeZoneName: 'short',
      });
    } catch {
      return dateString;
    }
  };

  const getChannelIcon = (channel: string) => {
    switch (channel.toLowerCase()) {
      case 'card':
        return <CreditCard className="h-4 w-4" />;
      case 'bank':
      case 'bank_transfer':
      case 'transfer':
        return <Building2 className="h-4 w-4" />;
      case 'ussd':
        return <Smartphone className="h-4 w-4" />;
      default:
        return <CreditCard className="h-4 w-4" />;
    }
  };

  const getChannelName = (channel: string) => {
    switch (channel.toLowerCase()) {
      case 'card':
        return 'Card Payment';
      case 'bank':
      case 'bank_transfer':
      case 'transfer':
        return 'Bank Transfer';
      case 'ussd':
        return 'USSD';
      default:
        return channel || 'Unknown';
    }
  };

  const interpretWebhook = (): WebhookInterpretation => {
    const status = webhookData.transactionStatus.toLowerCase();
    const eventType = webhookData.eventType?.toLowerCase() || '';
    const gatewayResponse = webhookData.gatewayResponse?.toLowerCase() || '';
    const channel = webhookData.channel?.toLowerCase() || '';

    // Determine payment success
    const paymentSuccess =
      status === 'success' ||
      status === 'successful' ||
      eventType === 'charge.success' ||
      eventType === 'transfer.success' ||
      eventType === 'refund.success';

    // Determine failure reason
    let failureReason: string | undefined;
    if (!paymentSuccess) {
      if (status === 'failed' || eventType === 'charge.failed' || eventType === 'transfer.failed') {
        if (gatewayResponse.includes('insufficient') || gatewayResponse.includes('balance')) {
          failureReason = 'Insufficient funds in the account';
        } else if (gatewayResponse.includes('declined') || gatewayResponse.includes('reject')) {
          failureReason = 'Transaction declined by bank or card issuer';
        } else if (gatewayResponse.includes('expired') || gatewayResponse.includes('timeout')) {
          failureReason = 'Transaction expired or timed out';
        } else if (gatewayResponse.includes('invalid') || gatewayResponse.includes('error')) {
          failureReason = 'Invalid transaction details or system error';
        } else if (gatewayResponse.includes('fraud') || gatewayResponse.includes('suspicious')) {
          failureReason = 'Transaction flagged for security reasons';
        } else if (gatewayResponse.includes('network') || gatewayResponse.includes('connection')) {
          failureReason = 'Network connectivity issue';
        } else if (gatewayResponse.includes('limit') || gatewayResponse.includes('exceeded')) {
          failureReason = 'Transaction limit exceeded';
        } else {
          failureReason = gatewayResponse || 'Payment failed for unknown reason';
        }
      } else if (status === 'pending' || eventType.includes('pending')) {
        failureReason = 'Transaction is still pending verification';
      } else if (status === 'abandoned' || eventType.includes('abandoned')) {
        failureReason = 'Transaction was abandoned by user';
      } else {
        failureReason = 'Payment status unclear - requires manual verification';
      }
    }

    // Determine system actions
    const systemActions: WebhookInterpretation['systemActions'] = [];

    if (paymentSuccess) {
      if (eventType === 'charge.success') {
        systemActions.push({
          action: 'Update Transaction Status',
          priority: 'high',
          description: 'Mark transaction as successful in database',
        });
        systemActions.push({
          action: 'Confirm Booking/Order',
          priority: 'high',
          description: 'Activate the associated booking or order',
        });
        systemActions.push({
          action: 'Update Wallet Balance',
          priority: 'medium',
          description: 'Credit the amount to user wallet or owner account',
        });
        systemActions.push({
          action: 'Send Confirmation Email',
          priority: 'medium',
          description: 'Send payment confirmation email to customer',
        });
        systemActions.push({
          action: 'Update Payment Records',
          priority: 'low',
          description: 'Log payment in transaction history',
        });
      } else if (eventType === 'transfer.success') {
        systemActions.push({
          action: 'Update Payout Status',
          priority: 'high',
          description: 'Mark payout transaction as successful',
        });
        systemActions.push({
          action: 'Update Wallet Balance',
          priority: 'high',
          description: 'Deduct amount from wallet and mark as paid out',
        });
        systemActions.push({
          action: 'Send Payout Notification',
          priority: 'medium',
          description: 'Notify recipient of successful payout',
        });
      } else if (eventType === 'refund.success') {
        systemActions.push({
          action: 'Update Refund Status',
          priority: 'high',
          description: 'Mark refund transaction as completed',
        });
        systemActions.push({
          action: 'Update Booking Status',
          priority: 'high',
          description: 'Mark booking as refunded and cancel if applicable',
        });
        systemActions.push({
          action: 'Reverse Wallet Credit',
          priority: 'high',
          description: 'Deduct refunded amount from wallet balance',
        });
        systemActions.push({
          action: 'Send Refund Confirmation',
          priority: 'medium',
          description: 'Notify customer of successful refund',
        });
      }
    } else {
      systemActions.push({
        action: 'Update Transaction Status',
        priority: 'high',
        description: 'Mark transaction as failed in database',
      });
      systemActions.push({
        action: 'Log Failure Reason',
        priority: 'high',
        description: `Record failure reason: ${failureReason}`,
      });
      systemActions.push({
        action: 'Notify Customer',
        priority: 'medium',
        description: 'Send failure notification email to customer',
      });
      systemActions.push({
        action: 'Release Booking Hold',
        priority: 'medium',
        description: 'Release any held booking or inventory',
      });
      if (eventType === 'transfer.failed') {
        systemActions.push({
          action: 'Restore Wallet Balance',
          priority: 'high',
          description: 'Return failed transfer amount to wallet',
        });
        systemActions.push({
          action: 'Notify Recipient',
          priority: 'medium',
          description: 'Alert recipient of failed payout',
        });
      }
    }

    // Generate user-friendly message
    let userMessage: WebhookInterpretation['userMessage'];
    if (paymentSuccess) {
      if (eventType === 'charge.success') {
        userMessage = {
          title: 'Payment Successful',
          message: `Your payment of ${formatCurrency(webhookData.amount)} has been successfully processed via ${getChannelName(webhookData.channel)}. Transaction reference: ${webhookData.reference}. Your booking or order has been confirmed.`,
          severity: 'success',
        };
      } else if (eventType === 'transfer.success') {
        userMessage = {
          title: 'Payout Successful',
          message: `Your payout of ${formatCurrency(webhookData.amount)} has been successfully transferred. Reference: ${webhookData.reference}. The funds should reflect in your account shortly.`,
          severity: 'success',
        };
      } else if (eventType === 'refund.success') {
        userMessage = {
          title: 'Refund Processed',
          message: `Your refund of ${formatCurrency(webhookData.amount)} has been successfully processed. Reference: ${webhookData.reference}. The funds will be returned to your original payment method.`,
          severity: 'success',
        };
      } else {
        userMessage = {
          title: 'Transaction Successful',
          message: `Your transaction of ${formatCurrency(webhookData.amount)} was successful. Reference: ${webhookData.reference}.`,
          severity: 'success',
        };
      }
    } else {
      if (status === 'pending') {
        userMessage = {
          title: 'Payment Pending',
          message: `Your payment of ${formatCurrency(webhookData.amount)} is being processed. Please wait for confirmation. Reference: ${webhookData.reference}.`,
          severity: 'info',
        };
      } else {
        userMessage = {
          title: 'Payment Failed',
          message: `Your payment of ${formatCurrency(webhookData.amount)} could not be processed. ${failureReason || 'Please try again or contact support.'} Reference: ${webhookData.reference}.`,
          severity: 'error',
        };
      }
    }

    return {
      paymentSuccess,
      failureReason,
      systemActions,
      userMessage,
      transactionDetails: {
        status: webhookData.transactionStatus || 'Unknown',
        amount: formatCurrency(webhookData.amount),
        reference: webhookData.reference || 'N/A',
        channel: getChannelName(webhookData.channel),
        timestamp: webhookData.timestamp,
        formattedDate: formatDate(webhookData.timestamp),
      },
    };
  };

  const handleInterpret = () => {
    if (!webhookData.transactionStatus || !webhookData.amount || !webhookData.reference) {
      return;
    }
    const result = interpretWebhook();
    setInterpretation(result);
  };

  const handleParseJson = () => {
    try {
      const parsed = JSON.parse(rawJson);
      // Extract webhook structure (charge.* style events)
      const event = parsed.event || '';
      const data = parsed.data || {};

      setWebhookData({
        transactionStatus: data.status || webhookData.transactionStatus,
        amount: data.amount?.toString() || webhookData.amount,
        reference: data.reference || webhookData.reference,
        channel: data.channel || data.authorization?.channel || webhookData.channel,
        timestamp:
          data.paid_at || data.created_at || data.transaction_date || webhookData.timestamp,
        gatewayResponse: data.gateway_response || data.message || webhookData.gatewayResponse,
        customerEmail: data.customer?.email || webhookData.customerEmail,
        eventType: event || webhookData.eventType,
      });
    } catch (error) {
      alert('Invalid JSON format. Please check your input.');
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'success':
        return 'bg-green-50 border-green-200';
      case 'error':
        return 'bg-red-50 border-red-200';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200';
      case 'info':
        return 'bg-blue-50 border-blue-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'error':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case 'info':
        return <Info className="h-5 w-5 text-blue-500" />;
      default:
        return <Info className="h-5 w-5 text-gray-500" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Webhook className="h-5 w-5 text-blue-500" />
            Flutterwave webhook interpreter
          </CardTitle>
          <CardDescription>
            Interpret Flutterwave (and compatible) webhook payloads for payment status, failure
            reasons, and required actions
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* JSON Parser */}
          <div>
            <Label htmlFor="rawJson">Or Paste Raw Webhook JSON</Label>
            <Textarea
              id="rawJson"
              value={rawJson}
              onChange={(e) => setRawJson(e.target.value)}
              placeholder='{"event": "charge.success", "data": {"status": "success", "amount": 5000000, "reference": "T123456789", "channel": "card", "paid_at": "2024-01-15T10:30:00Z"}}'
              className="mt-2 font-mono text-sm"
              rows={6}
            />
            <Button onClick={handleParseJson} className="mt-2" variant="outline" size="sm">
              Parse JSON
            </Button>
          </div>

          <Separator />

          {/* Webhook Data Inputs */}
          <div>
            <h3 className="mb-4 text-lg font-semibold">Webhook Data</h3>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="eventType">Event Type</Label>
                <Select
                  value={webhookData.eventType}
                  onValueChange={(value) => setWebhookData({ ...webhookData, eventType: value })}
                >
                  <SelectTrigger id="eventType">
                    <SelectValue placeholder="Select event type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="charge.success">charge.success</SelectItem>
                    <SelectItem value="charge.failed">charge.failed</SelectItem>
                    <SelectItem value="transfer.success">transfer.success</SelectItem>
                    <SelectItem value="transfer.failed">transfer.failed</SelectItem>
                    <SelectItem value="refund.success">refund.success</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="transactionStatus">Transaction Status *</Label>
                <Select
                  value={webhookData.transactionStatus}
                  onValueChange={(value) =>
                    setWebhookData({ ...webhookData, transactionStatus: value })
                  }
                >
                  <SelectTrigger id="transactionStatus">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="success">Success</SelectItem>
                    <SelectItem value="failed">Failed</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="abandoned">Abandoned</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="amount">Amount (in kobo) *</Label>
                <Input
                  id="amount"
                  type="number"
                  value={webhookData.amount}
                  onChange={(e) => setWebhookData({ ...webhookData, amount: e.target.value })}
                  placeholder="5000000"
                />
                <p className="mt-1 text-xs text-muted-foreground">
                  Use kobo if the payload uses kobo (1 Naira = 100 kobo); Flutterwave often uses
                  Naira
                </p>
              </div>
              <div>
                <Label htmlFor="reference">Transaction Reference *</Label>
                <Input
                  id="reference"
                  value={webhookData.reference}
                  onChange={(e) => setWebhookData({ ...webhookData, reference: e.target.value })}
                  placeholder="T123456789"
                />
              </div>
              <div>
                <Label htmlFor="channel">Payment Channel</Label>
                <Select
                  value={webhookData.channel}
                  onValueChange={(value) => setWebhookData({ ...webhookData, channel: value })}
                >
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
                <Label htmlFor="timestamp">Timestamp</Label>
                <Input
                  id="timestamp"
                  type="datetime-local"
                  value={webhookData.timestamp}
                  onChange={(e) => setWebhookData({ ...webhookData, timestamp: e.target.value })}
                />
              </div>
              <div className="md:col-span-2">
                <Label htmlFor="gatewayResponse">Gateway Response (Optional)</Label>
                <Input
                  id="gatewayResponse"
                  value={webhookData.gatewayResponse}
                  onChange={(e) =>
                    setWebhookData({ ...webhookData, gatewayResponse: e.target.value })
                  }
                  placeholder="Transaction declined by bank"
                />
              </div>
              <div className="md:col-span-2">
                <Label htmlFor="customerEmail">Customer Email (Optional)</Label>
                <Input
                  id="customerEmail"
                  type="email"
                  value={webhookData.customerEmail}
                  onChange={(e) =>
                    setWebhookData({ ...webhookData, customerEmail: e.target.value })
                  }
                  placeholder="customer@example.com"
                />
              </div>
            </div>
          </div>

          <Button onClick={handleInterpret} className="w-full" size="lg">
            <Webhook className="mr-2 h-4 w-4" />
            Interpret Webhook
          </Button>
        </CardContent>
      </Card>

      {/* Interpretation Results */}
      {interpretation && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Interpretation Results</CardTitle>
              <Badge
                variant={interpretation.paymentSuccess ? 'default' : 'destructive'}
                className={
                  interpretation.paymentSuccess
                    ? 'bg-green-100 text-green-800'
                    : 'bg-red-100 text-red-800'
                }
              >
                {interpretation.paymentSuccess ? 'Success' : 'Failed'}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* User Message */}
            <Alert className={getSeverityColor(interpretation.userMessage.severity)}>
              {getSeverityIcon(interpretation.userMessage.severity)}
              <AlertTitle>{interpretation.userMessage.title}</AlertTitle>
              <AlertDescription className="mt-2">
                {interpretation.userMessage.message}
              </AlertDescription>
            </Alert>

            {/* Transaction Details */}
            <div>
              <h3 className="mb-3 flex items-center gap-2 font-semibold">
                <Info className="h-5 w-5 text-blue-500" />
                Transaction Details
              </h3>
              <div className="grid grid-cols-2 gap-4 rounded-lg border bg-gray-50 p-4">
                <div>
                  <p className="text-sm text-gray-600">Status</p>
                  <p className="font-semibold">{interpretation.transactionDetails.status}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Amount</p>
                  <p className="font-semibold">{interpretation.transactionDetails.amount}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Reference</p>
                  <p className="font-mono text-sm font-semibold">
                    {interpretation.transactionDetails.reference}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Channel</p>
                  <div className="flex items-center gap-2">
                    {getChannelIcon(webhookData.channel)}
                    <p className="font-semibold">{interpretation.transactionDetails.channel}</p>
                  </div>
                </div>
                <div className="col-span-2">
                  <p className="text-sm text-gray-600">Timestamp</p>
                  <p className="font-semibold">
                    {interpretation.transactionDetails.formattedDate || 'N/A'}
                  </p>
                </div>
              </div>
            </div>

            {/* Failure Reason */}
            {interpretation.failureReason && (
              <Alert className="border-red-200 bg-red-50">
                <AlertTriangle className="h-4 w-4 text-red-500" />
                <AlertTitle>Failure Reason</AlertTitle>
                <AlertDescription className="mt-2">{interpretation.failureReason}</AlertDescription>
              </Alert>
            )}

            {/* System Actions */}
            <div>
              <h3 className="mb-3 flex items-center gap-2 font-semibold">
                <Clock className="h-5 w-5 text-blue-500" />
                Required System Actions
              </h3>
              <div className="space-y-3">
                {interpretation.systemActions.map((action, index) => (
                  <div
                    key={index}
                    className="flex items-start gap-3 rounded-lg border bg-gray-50 p-4"
                  >
                    <Badge className={getPriorityColor(action.priority)}>
                      {action.priority.toUpperCase()}
                    </Badge>
                    <div className="flex-1">
                      <p className="font-semibold">{action.action}</p>
                      <p className="mt-1 text-sm text-gray-600">{action.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
