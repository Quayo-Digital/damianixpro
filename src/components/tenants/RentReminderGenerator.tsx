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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Copy, CheckCircle, Bell, AlertCircle, FileWarning } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface PaymentHistory {
  month: string;
  paid: boolean;
  paidDate?: string;
  daysLate?: number;
}

interface TenantBehavior {
  averageDaysLate: number;
  missedPayments: number;
  totalPayments: number;
  lastPaymentDate?: string;
  communicationResponsiveness: 'excellent' | 'good' | 'fair' | 'poor';
}

interface ReminderData {
  tenantName: string;
  propertyAddress: string;
  annualRent: string;
  dueDate: string;
  daysOverdue: number;
  paymentHistory: PaymentHistory[];
  behaviorPattern: TenantBehavior;
  reminderType: 'polite' | 'firm' | 'final';
}

export function RentReminderGenerator() {
  const [tenantName, setTenantName] = useState('');
  const [propertyAddress, setPropertyAddress] = useState('');
  const [annualRent, setAnnualRent] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [daysOverdue, setDaysOverdue] = useState('');
  const [missedPayments, setMissedPayments] = useState('0');
  const [totalPayments, setTotalPayments] = useState('12');
  const [averageDaysLate, setAverageDaysLate] = useState('0');
  const [lastPaymentDate, setLastPaymentDate] = useState('');
  const [communicationResponsiveness, setCommunicationResponsiveness] = useState<string>('good');
  const [reminderType, setReminderType] = useState<'polite' | 'firm' | 'final'>('polite');

  const [generatedReminders, setGeneratedReminders] = useState({
    polite: '',
    firm: '',
    final: '',
  });

  const [copied, setCopied] = useState<string | null>(null);
  const { toast } = useToast();

  const formatCurrency = (amount: string) => {
    const num = parseFloat(amount.replace(/,/g, ''));
    if (isNaN(num)) return amount;
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
    }).format(num);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-NG', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const calculateBehaviorPattern = (): TenantBehavior => {
    const missed = parseInt(missedPayments) || 0;
    const total = parseInt(totalPayments) || 12;
    const avgLate = parseFloat(averageDaysLate) || 0;

    let responsiveness: TenantBehavior['communicationResponsiveness'] = 'good';
    if (missed === 0 && avgLate <= 3) {
      responsiveness = 'excellent';
    } else if (missed <= 1 && avgLate <= 7) {
      responsiveness = 'good';
    } else if (missed <= 2 && avgLate <= 14) {
      responsiveness = 'fair';
    } else {
      responsiveness = 'poor';
    }

    return {
      averageDaysLate: avgLate,
      missedPayments: missed,
      totalPayments: total,
      lastPaymentDate: lastPaymentDate || undefined,
      communicationResponsiveness: responsiveness,
    };
  };

  const generatePoliteReminder = (data: ReminderData): string => {
    const { tenantName, propertyAddress, annualRent, dueDate, daysOverdue, behaviorPattern } = data;
    const rentFormatted = formatCurrency(annualRent);
    const dueDateFormatted = formatDate(dueDate);

    let message = `Dear ${tenantName},\n\n`;

    message += `I hope this message finds you well.\n\n`;

    if (daysOverdue <= 3) {
      message += `This is a friendly reminder that your annual rent payment of ${rentFormatted} for ${dueDateFormatted} is now due. `;
      message += `We understand that annual payments can sometimes be delayed by a few days, and we wanted to reach out to ensure everything is on track.\n\n`;
    } else if (daysOverdue <= 7) {
      message += `This is a gentle reminder that your annual rent payment of ${rentFormatted} for ${dueDateFormatted} is now ${daysOverdue} days overdue. `;
      message += `We wanted to check in and see if there's anything we can assist with regarding the payment.\n\n`;
    } else {
      message += `This is a friendly reminder that your annual rent payment of ${rentFormatted} for ${dueDateFormatted} is now ${daysOverdue} days overdue. `;
      message += `We understand that circumstances can arise, and we're here to help if you need to discuss payment arrangements.\n\n`;
    }

    if (behaviorPattern.communicationResponsiveness === 'excellent') {
      message += `We appreciate your consistent payment history and wanted to reach out early to ensure we maintain our good relationship.\n\n`;
    } else if (behaviorPattern.communicationResponsiveness === 'good') {
      message += `We value our relationship and wanted to touch base regarding this payment.\n\n`;
    }

    message += `Please arrange for payment at your earliest convenience. You can make payment via:\n`;
    message += `• Bank Transfer\n`;
    message += `• Mobile Banking\n`;
    message += `• Cash Deposit\n\n`;

    message += `If you have already made the payment, please ignore this message. If you're experiencing any difficulties, please don't hesitate to reach out to discuss payment options.\n\n`;

    message += `Thank you for your attention to this matter.\n\n`;
    message += `Best regards,\n`;
    message += `Property Management Team`;

    return message;
  };

  const generateFirmReminder = (data: ReminderData): string => {
    const { tenantName, propertyAddress, annualRent, dueDate, daysOverdue, behaviorPattern } = data;
    const rentFormatted = formatCurrency(annualRent);
    const dueDateFormatted = formatDate(dueDate);

    let message = `Dear ${tenantName},\n\n`;

    message += `RE: OVERDUE ANNUAL RENT PAYMENT - ${dueDateFormatted}\n\n`;

    message += `We are writing to inform you that your annual rent payment of ${rentFormatted} for ${dueDateFormatted} is now ${daysOverdue} days overdue. `;

    if (daysOverdue <= 14) {
      message += `This matter requires your immediate attention.\n\n`;
    } else {
      message += `This is a matter of concern and requires your urgent attention.\n\n`;
    }

    if (behaviorPattern.missedPayments > 0) {
      message += `We note that this is not the first instance of delayed payment. `;
      if (behaviorPattern.missedPayments === 1) {
        message += `We had previously discussed the importance of timely payments.\n\n`;
      } else {
        message += `We have previously addressed this issue on ${behaviorPattern.missedPayments} occasion(s). `;
        message += `It is important that we maintain consistent payment schedules.\n\n`;
      }
    }

    message += `As per your lease agreement, annual rent payments are due on or before the specified date each year. `;
    message += `We require immediate payment to bring your account current.\n\n`;

    message += `Please arrange for payment immediately via one of the following methods:\n`;
    message += `• Bank Transfer (details provided in your lease agreement)\n`;
    message += `• Mobile Banking\n`;
    message += `• Cash Deposit at our office\n\n`;

    if (daysOverdue > 14) {
      message += `If payment is not received within the next 3 business days, we may need to consider further action as outlined in your lease agreement. `;
      message += `However, we would prefer to resolve this matter amicably.\n\n`;
    }

    message += `If you are experiencing financial difficulties, please contact us immediately to discuss a payment plan. `;
    message += `We are willing to work with you, but we need to hear from you.\n\n`;

    message += `We look forward to your prompt response and payment.\n\n`;
    message += `Sincerely,\n`;
    message += `Property Management Team`;

    return message;
  };

  const generateFinalNotice = (data: ReminderData): string => {
    const { tenantName, propertyAddress, annualRent, dueDate, daysOverdue, behaviorPattern } = data;
    const rentFormatted = formatCurrency(annualRent);
    const dueDateFormatted = formatDate(dueDate);

    let message = `Dear ${tenantName},\n\n`;

    message += `FINAL NOTICE: OVERDUE RENT PAYMENT\n`;
    message += `Property: ${propertyAddress}\n`;
    message += `Amount Due: ${rentFormatted}\n`;
    message += `Due Date: ${dueDateFormatted}\n`;
    message += `Days Overdue: ${daysOverdue} days\n\n`;

    message += `This is a final notice regarding your overdue rent payment. `;
    message += `Despite our previous communications, your account remains outstanding.\n\n`;

    if (behaviorPattern.missedPayments > 1) {
      message += `We have previously addressed payment issues on ${behaviorPattern.missedPayments} occasion(s), `;
      message += `and this continued non-payment is a serious breach of your lease agreement.\n\n`;
    }

    message += `As per the terms of your lease agreement, you are required to make annual rent payments on time. `;
    message += `Your failure to do so constitutes a breach of contract.\n\n`;

    message += `We are providing you with a final opportunity to resolve this matter before we proceed with legal remedies available to us under the lease agreement and Nigerian tenancy law.\n\n`;

    message += `REQUIRED ACTION:\n`;
    message += `You must pay the outstanding amount of ${rentFormatted} within 7 days of this notice. `;
    message += `Payment must be made in full via:\n`;
    message += `• Bank Transfer (account details in your lease agreement)\n`;
    message += `• Cash Deposit at our office during business hours\n\n`;

    message += `If you are experiencing genuine financial hardship, you must contact us within 48 hours to discuss a payment arrangement. `;
    message += `However, any payment plan must be agreed upon in writing and will not prevent the accrual of late fees as specified in your lease.\n\n`;

    message += `CONSEQUENCES OF NON-PAYMENT:\n`;
    message += `If payment is not received within the specified timeframe, we reserve the right to:\n`;
    message += `• Initiate legal proceedings for rent recovery\n`;
    message += `• Apply late fees as specified in your lease agreement\n`;
    message += `• Consider termination of your tenancy in accordance with the law\n\n`;

    message += `We sincerely hope it does not come to this. We value our relationship and would prefer to resolve this matter amicably. `;
    message += `However, we must protect our rights and interests as property owners.\n\n`;

    message += `Please treat this matter with the urgency it requires. Contact us immediately to arrange payment or discuss your situation.\n\n`;

    message += `This notice is sent without prejudice to our rights and remedies under the lease agreement and applicable law.\n\n`;

    message += `Yours sincerely,\n`;
    message += `Property Management Team\n`;
    message += `[Contact Information]`;

    return message;
  };

  const handleGenerate = () => {
    if (!tenantName || !propertyAddress || !annualRent || !dueDate) {
      toast({
        title: 'Missing Information',
        description: 'Please fill in Tenant Name, Property Address, Annual Rent, and Due Date',
        variant: 'destructive',
      });
      return;
    }

    const daysOverdueNum = parseInt(daysOverdue) || 0;
    const behaviorPattern = calculateBehaviorPattern();

    const reminderData: ReminderData = {
      tenantName,
      propertyAddress,
      annualRent,
      dueDate,
      daysOverdue: daysOverdueNum,
      paymentHistory: [], // Can be expanded later
      behaviorPattern,
      reminderType,
    };

    const polite = generatePoliteReminder(reminderData);
    const firm = generateFirmReminder(reminderData);
    const final = generateFinalNotice(reminderData);

    setGeneratedReminders({ polite, firm, final });
  };

  const handleCopy = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    setCopied(type);
    toast({
      title: 'Copied!',
      description: `${type} reminder copied to clipboard`,
    });
    setTimeout(() => setCopied(null), 2000);
  };

  const getRecommendedReminderType = (): 'polite' | 'firm' | 'final' => {
    const daysOverdueNum = parseInt(daysOverdue) || 0;
    const behaviorPattern = calculateBehaviorPattern();

    if (daysOverdueNum >= 21 || behaviorPattern.communicationResponsiveness === 'poor') {
      return 'final';
    } else if (daysOverdueNum >= 7 || behaviorPattern.missedPayments > 1) {
      return 'firm';
    } else {
      return 'polite';
    }
  };

  const recommendedType = getRecommendedReminderType();

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-primary" />
            Rent Reminder Generator
          </CardTitle>
          <CardDescription>
            Generate professional annual rent reminders based on payment history and tenant behavior
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Tenant Information */}
          <div>
            <h3 className="mb-4 text-lg font-semibold">Tenant Information</h3>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="tenantName">Tenant Name *</Label>
                <Input
                  id="tenantName"
                  value={tenantName}
                  onChange={(e) => setTenantName(e.target.value)}
                  placeholder="John Doe"
                />
              </div>
              <div className="md:col-span-2">
                <Label htmlFor="propertyAddress">Property Address *</Label>
                <Input
                  id="propertyAddress"
                  value={propertyAddress}
                  onChange={(e) => setPropertyAddress(e.target.value)}
                  placeholder="123 Main Street, Lagos"
                />
              </div>
              <div>
                <Label htmlFor="annualRent">Annual Rent (₦) *</Label>
                <Input
                  id="annualRent"
                  type="number"
                  value={annualRent}
                  onChange={(e) => setAnnualRent(e.target.value)}
                  placeholder="6000000"
                />
              </div>
              <div>
                <Label htmlFor="dueDate">Due Date *</Label>
                <Input
                  id="dueDate"
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="daysOverdue">Days Overdue</Label>
                <Input
                  id="daysOverdue"
                  type="number"
                  value={daysOverdue}
                  onChange={(e) => setDaysOverdue(e.target.value)}
                  placeholder="0"
                />
              </div>
              <div>
                <Label htmlFor="lastPaymentDate">Last Payment Date</Label>
                <Input
                  id="lastPaymentDate"
                  type="date"
                  value={lastPaymentDate}
                  onChange={(e) => setLastPaymentDate(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Payment History */}
          <div>
            <h3 className="mb-4 text-lg font-semibold">Payment History</h3>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div>
                <Label htmlFor="totalPayments">Total Payments (Years)</Label>
                <Input
                  id="totalPayments"
                  type="number"
                  value={totalPayments}
                  onChange={(e) => setTotalPayments(e.target.value)}
                  placeholder="1"
                />
              </div>
              <div>
                <Label htmlFor="missedPayments">Missed Payments</Label>
                <Input
                  id="missedPayments"
                  type="number"
                  value={missedPayments}
                  onChange={(e) => setMissedPayments(e.target.value)}
                  placeholder="0"
                />
              </div>
              <div>
                <Label htmlFor="averageDaysLate">Average Days Late</Label>
                <Input
                  id="averageDaysLate"
                  type="number"
                  value={averageDaysLate}
                  onChange={(e) => setAverageDaysLate(e.target.value)}
                  placeholder="0"
                />
              </div>
              <div>
                <Label htmlFor="communicationResponsiveness">Communication Responsiveness</Label>
                <Select
                  value={communicationResponsiveness}
                  onValueChange={setCommunicationResponsiveness}
                >
                  <SelectTrigger id="communicationResponsiveness">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="excellent">Excellent</SelectItem>
                    <SelectItem value="good">Good</SelectItem>
                    <SelectItem value="fair">Fair</SelectItem>
                    <SelectItem value="poor">Poor</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Recommendation */}
          {tenantName && dueDate && (
            <div className="rounded-lg border border-border bg-accent/40 p-4">
              <div className="mb-2 flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-primary" />
                <span className="font-semibold">Recommended Reminder Type:</span>
                <Badge
                  variant={
                    recommendedType === 'final'
                      ? 'destructive'
                      : recommendedType === 'firm'
                        ? 'default'
                        : 'secondary'
                  }
                >
                  {recommendedType === 'final'
                    ? 'Final Notice'
                    : recommendedType === 'firm'
                      ? 'Firm Reminder'
                      : 'Polite Reminder'}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                Based on days overdue ({parseInt(daysOverdue) || 0} days) and payment history, we
                recommend sending a{' '}
                <strong>
                  {recommendedType === 'final'
                    ? 'Final Notice'
                    : recommendedType === 'firm'
                      ? 'Firm Reminder'
                      : 'Polite Reminder'}
                </strong>
                .
              </p>
            </div>
          )}

          <Button onClick={handleGenerate} className="w-full" size="lg">
            <Bell className="mr-2 h-4 w-4" />
            Generate All Reminders
          </Button>
        </CardContent>
      </Card>

      {/* Generated Reminders */}
      {generatedReminders.polite && (
        <Card>
          <CardHeader>
            <CardTitle>Generated Reminders</CardTitle>
            <CardDescription>
              Review and copy the appropriate reminder based on your situation
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="polite" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="polite" className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4" />
                  Polite
                </TabsTrigger>
                <TabsTrigger value="firm" className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  Firm
                </TabsTrigger>
                <TabsTrigger value="final" className="flex items-center gap-2">
                  <FileWarning className="h-4 w-4" />
                  Final Notice
                </TabsTrigger>
              </TabsList>

              <TabsContent value="polite" className="space-y-4">
                <div className="relative">
                  <Textarea
                    value={generatedReminders.polite}
                    readOnly
                    className="min-h-[400px] font-medium"
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute right-2 top-2"
                    onClick={() => handleCopy(generatedReminders.polite, 'Polite')}
                  >
                    {copied === 'Polite' ? (
                      <CheckCircle className="h-4 w-4 text-primary" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Use for: Early reminders (0-7 days overdue), good payment history, first-time
                  delays for annual rent
                </p>
              </TabsContent>

              <TabsContent value="firm" className="space-y-4">
                <div className="relative">
                  <Textarea
                    value={generatedReminders.firm}
                    readOnly
                    className="min-h-[400px] font-medium"
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute right-2 top-2"
                    onClick={() => handleCopy(generatedReminders.firm, 'Firm')}
                  >
                    {copied === 'Firm' ? (
                      <CheckCircle className="h-4 w-4 text-primary" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Use for: 7-21 days overdue, repeated late payments, requires immediate attention
                </p>
              </TabsContent>

              <TabsContent value="final" className="space-y-4">
                <div className="relative">
                  <Textarea
                    value={generatedReminders.final}
                    readOnly
                    className="min-h-[500px] font-medium"
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute right-2 top-2"
                    onClick={() => handleCopy(generatedReminders.final, 'Final')}
                  >
                    {copied === 'Final' ? (
                      <CheckCircle className="h-4 w-4 text-primary" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Use for: 21+ days overdue, multiple missed annual rent payments, legal action may
                  be required
                </p>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
