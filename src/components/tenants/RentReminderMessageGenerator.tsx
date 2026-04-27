import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import {
  MessageSquare,
  Copy,
  CheckCircle,
  Mail,
  Smartphone,
  Link as LinkIcon,
  Calendar,
  Clock,
  AlertCircle,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface PaymentHistory {
  period: string;
  paid: boolean;
  paidDate?: string;
  daysLate?: number;
}

interface ReminderInputs {
  tenantName: string;
  propertyAddress: string;
  annualRent: number;
  dueDate: string;
  daysToDueDate: number; // Negative if overdue
  previousReminderCount: number;
  paymentHistory: PaymentHistory[];
  paymentLink: string;
}

interface ReminderMessages {
  sms: string;
  whatsapp: string;
  email: {
    subject: string;
    body: string;
  };
}

export function RentReminderMessageGenerator() {
  const [tenantName, setTenantName] = useState('');
  const [propertyAddress, setPropertyAddress] = useState('');
  const [annualRent, setAnnualRent] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [daysToDueDate, setDaysToDueDate] = useState('');
  const [previousReminderCount, setPreviousReminderCount] = useState('0');
  const [paymentHistoryJson, setPaymentHistoryJson] = useState('');
  const [paymentLink, setPaymentLink] = useState('');
  const [generatedMessages, setGeneratedMessages] = useState<ReminderMessages | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const { toast } = useToast();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-NG', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch {
      return dateString;
    }
  };

  const parsePaymentHistory = (): PaymentHistory[] => {
    if (!paymentHistoryJson.trim()) {
      return [];
    }
    try {
      const parsed = JSON.parse(paymentHistoryJson);
      return Array.isArray(parsed) ? parsed : [parsed];
    } catch {
      return [];
    }
  };

  const analyzePaymentHistory = (history: PaymentHistory[]) => {
    const totalPayments = history.length;
    const paidCount = history.filter((h) => h.paid).length;
    const onTimeCount = history.filter((h) => h.paid && (h.daysLate || 0) <= 0).length;
    const averageDaysLate =
      history
        .filter((h) => h.paid && h.daysLate && h.daysLate > 0)
        .reduce((sum, h) => sum + (h.daysLate || 0), 0) / paidCount || 0;

    return {
      totalPayments,
      paidCount,
      onTimeCount,
      paymentRate: totalPayments > 0 ? paidCount / totalPayments : 0,
      averageDaysLate,
      isGoodPayer: paymentRate >= 0.8 && averageDaysLate <= 5,
    };
  };

  const generateReminderMessages = (): ReminderMessages | null => {
    if (!tenantName || !propertyAddress || !annualRent || !dueDate || !paymentLink) {
      return null;
    }

    const rent = parseFloat(annualRent);
    if (isNaN(rent) || rent <= 0) {
      return null;
    }

    const days = parseInt(daysToDueDate) || 0;
    const reminderCount = parseInt(previousReminderCount) || 0;
    const history = parsePaymentHistory();
    const historyAnalysis = analyzePaymentHistory(history);
    const isOverdue = days < 0;
    const daysOverdue = isOverdue ? Math.abs(days) : 0;
    const daysUntilDue = isOverdue ? 0 : days;

    const rentFormatted = formatCurrency(rent);
    const dueDateFormatted = formatDate(dueDate);

    // Determine tone based on days and reminder count
    let tone: 'polite' | 'firm' | 'professional';
    if (isOverdue) {
      if (daysOverdue <= 7 && reminderCount <= 1) {
        tone = 'firm';
      } else if (daysOverdue > 7 || reminderCount > 1) {
        tone = 'firm';
      } else {
        tone = 'firm';
      }
    } else {
      tone = 'polite';
    }

    // Base message components
    const greeting = `Dear ${tenantName},`;
    let opening = '';
    let mainMessage = '';
    let closing = '';
    let callToAction = '';

    if (tone === 'polite') {
      if (daysUntilDue > 7) {
        opening = `I hope this message finds you well.`;
        mainMessage = `This is a friendly reminder that your annual rent payment of ${rentFormatted} for ${propertyAddress} is due on ${dueDateFormatted} (in ${daysUntilDue} days).`;
      } else if (daysUntilDue > 3) {
        opening = `I hope you're doing well.`;
        mainMessage = `This is a gentle reminder that your annual rent payment of ${rentFormatted} for ${propertyAddress} is due on ${dueDateFormatted} (in ${daysUntilDue} days).`;
      } else {
        opening = `I hope this message finds you well.`;
        mainMessage = `This is a friendly reminder that your annual rent payment of ${rentFormatted} for ${propertyAddress} is due on ${dueDateFormatted} (in ${daysUntilDue} days).`;
      }

      if (historyAnalysis.isGoodPayer) {
        mainMessage += ` We appreciate your consistent payment history and wanted to reach out early.`;
      }

      closing = `Please arrange for payment at your earliest convenience.`;
      callToAction = `You can make payment securely using the link below:`;
    } else {
      // Firm tone (after due date)
      opening = `I hope you're doing well.`;

      if (daysOverdue <= 3) {
        mainMessage = `This is a reminder that your annual rent payment of ${rentFormatted} for ${propertyAddress} was due on ${dueDateFormatted} and is now ${daysOverdue} day${daysOverdue !== 1 ? 's' : ''} overdue.`;
      } else if (daysOverdue <= 7) {
        mainMessage = `This is an important reminder that your annual rent payment of ${rentFormatted} for ${propertyAddress} was due on ${dueDateFormatted} and is now ${daysOverdue} days overdue.`;
      } else {
        mainMessage = `This is a final reminder that your annual rent payment of ${rentFormatted} for ${propertyAddress} was due on ${dueDateFormatted} and is now ${daysOverdue} days overdue.`;
      }

      if (reminderCount > 0) {
        mainMessage += ` This is reminder #${reminderCount + 1}.`;
      }

      if (historyAnalysis.isGoodPayer && daysOverdue <= 7) {
        mainMessage += ` We understand that circumstances can arise, and we're here to help if you need to discuss payment arrangements.`;
      }

      closing = `Please make payment as soon as possible to avoid any complications.`;
      callToAction = `You can make payment securely using the link below:`;
    }

    const paymentLinkText = `Pay Now: ${paymentLink}`;
    const signature = `Thank you,\nProperty Management Team`;

    // Generate SMS version (160 characters or less, concise)
    let sms = '';
    if (isOverdue) {
      sms = `Hi ${tenantName}, your rent of ${rentFormatted} for ${propertyAddress} was due ${dueDateFormatted}. ${daysOverdue} day${daysOverdue !== 1 ? 's' : ''} overdue. Pay: ${paymentLink}`;
    } else {
      sms = `Hi ${tenantName}, rent reminder: ${rentFormatted} due ${dueDateFormatted} (${daysUntilDue} days). Pay: ${paymentLink}`;
    }

    // Truncate SMS if too long (keep link)
    if (sms.length > 160) {
      const linkLength = paymentLink.length;
      const maxContentLength = 160 - linkLength - 20; // Reserve space for link and padding
      sms = `Hi ${tenantName}, rent ${rentFormatted} due ${dueDateFormatted}. Pay: ${paymentLink}`;
      if (sms.length > 160) {
        sms = `Rent reminder: ${rentFormatted} due ${dueDateFormatted}. Pay: ${paymentLink}`;
      }
    }

    // Generate WhatsApp version (more conversational, can be longer)
    let whatsapp = `${greeting}\n\n`;
    whatsapp += `${opening}\n\n`;
    whatsapp += `${mainMessage}\n\n`;
    whatsapp += `${closing}\n\n`;
    whatsapp += `${callToAction}\n\n`;
    whatsapp += `${paymentLinkText}\n\n`;
    if (historyAnalysis.isGoodPayer && !isOverdue) {
      whatsapp += `We appreciate your timely payments and wanted to give you advance notice.\n\n`;
    }
    whatsapp += `${signature}`;

    // Generate Email version (formal, structured)
    const emailSubject = isOverdue
      ? `Rent Payment Reminder - ${daysOverdue} Day${daysOverdue !== 1 ? 's' : ''} Overdue`
      : `Rent Payment Reminder - Due in ${daysUntilDue} Day${daysUntilDue !== 1 ? 's' : ''}`;

    let emailBody = `${greeting}\n\n`;
    emailBody += `${opening}\n\n`;
    emailBody += `${mainMessage}\n\n`;

    if (historyAnalysis.totalPayments > 0) {
      emailBody += `Payment History: ${historyAnalysis.paidCount} of ${historyAnalysis.totalPayments} payments made on time.\n\n`;
    }

    emailBody += `${closing}\n\n`;
    emailBody += `${callToAction}\n\n`;
    emailBody += `${paymentLinkText}\n\n`;
    emailBody += `If you have already made this payment, please disregard this message. If you're experiencing any difficulties, please contact us to discuss payment arrangements.\n\n`;
    emailBody += `${signature}\n\n`;
    emailBody += `---\n`;
    emailBody += `Property: ${propertyAddress}\n`;
    emailBody += `Annual Rent: ${rentFormatted}\n`;
    emailBody += `Due Date: ${dueDateFormatted}\n`;
    if (isOverdue) {
      emailBody += `Days Overdue: ${daysOverdue}\n`;
    } else {
      emailBody += `Days Until Due: ${daysUntilDue}\n`;
    }

    return {
      sms,
      whatsapp,
      email: {
        subject: emailSubject,
        body: emailBody,
      },
    };
  };

  const handleGenerate = () => {
    const messages = generateReminderMessages();
    if (messages) {
      setGeneratedMessages(messages);
      toast({
        title: 'Messages Generated',
        description: 'Rent reminder messages have been generated for all channels.',
      });
    } else {
      toast({
        title: 'Missing Information',
        description: 'Please fill in all required fields.',
        variant: 'destructive',
      });
    }
  };

  const handleCopy = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    setCopied(type);
    toast({
      title: 'Copied',
      description: `${type.toUpperCase()} message copied to clipboard.`,
    });
    setTimeout(() => setCopied(null), 2000);
  };

  const days = parseInt(daysToDueDate) || 0;
  const isOverdue = days < 0;
  const daysOverdue = isOverdue ? Math.abs(days) : 0;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-blue-500" />
            Rent Reminder Message Generator
          </CardTitle>
          <CardDescription>
            Generate polite, professional rent reminder messages for SMS, WhatsApp, and Email with
            Flutterwave payment links
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Basic Information */}
          <div>
            <h3 className="mb-4 text-lg font-semibold">Tenant & Property Information</h3>
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
              <div>
                <Label htmlFor="propertyAddress">Property Address *</Label>
                <Input
                  id="propertyAddress"
                  value={propertyAddress}
                  onChange={(e) => setPropertyAddress(e.target.value)}
                  placeholder="123 Main Street, Lagos"
                />
              </div>
              <div>
                <Label htmlFor="annualRent">Annual Rent Amount (₦) *</Label>
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
            </div>
          </div>

          <Separator />

          {/* Payment Status */}
          <div>
            <h3 className="mb-4 text-lg font-semibold">Payment Status</h3>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="daysToDueDate">Days to Due Date (negative if overdue) *</Label>
                <Input
                  id="daysToDueDate"
                  type="number"
                  value={daysToDueDate}
                  onChange={(e) => setDaysToDueDate(e.target.value)}
                  placeholder="5 or -3"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Positive = days until due, Negative = days overdue
                </p>
                {isOverdue && (
                  <Badge variant="destructive" className="mt-2">
                    {daysOverdue} day{daysOverdue !== 1 ? 's' : ''} overdue
                  </Badge>
                )}
              </div>
              <div>
                <Label htmlFor="previousReminderCount">Previous Reminder Count</Label>
                <Input
                  id="previousReminderCount"
                  type="number"
                  value={previousReminderCount}
                  onChange={(e) => setPreviousReminderCount(e.target.value)}
                  placeholder="0"
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Payment History */}
          <div>
            <h3 className="mb-4 text-lg font-semibold">Payment History (Optional)</h3>
            <Label htmlFor="paymentHistoryJson">Payment History JSON</Label>
            <Textarea
              id="paymentHistoryJson"
              value={paymentHistoryJson}
              onChange={(e) => setPaymentHistoryJson(e.target.value)}
              placeholder='[{"period": "2024-01", "paid": true, "paidDate": "2024-01-05", "daysLate": 0}, {"period": "2023-12", "paid": true, "paidDate": "2023-12-03", "daysLate": 2}]'
              className="mt-2 font-mono text-sm"
              rows={4}
            />
            <p className="mt-1 text-xs text-gray-500">
              Optional: JSON array of payment history to personalize the message
            </p>
          </div>

          <Separator />

          {/* Payment Link */}
          <div>
            <h3 className="mb-4 text-lg font-semibold">Payment Link</h3>
            <div>
              <Label htmlFor="paymentLink">Payment Link (Flutterwave) *</Label>
              <Input
                id="paymentLink"
                value={paymentLink}
                onChange={(e) => setPaymentLink(e.target.value)}
                placeholder="https://checkout.flutterwave.com/xxx"
              />
              <p className="mt-1 text-xs text-gray-500">
                The payment link will be included in all message versions
              </p>
            </div>
          </div>

          <Button onClick={handleGenerate} className="w-full" size="lg">
            <MessageSquare className="mr-2 h-4 w-4" />
            Generate Messages
          </Button>
        </CardContent>
      </Card>

      {/* Generated Messages */}
      {generatedMessages && (
        <Card>
          <CardHeader>
            <CardTitle>Generated Messages</CardTitle>
            <CardDescription>Copy the appropriate message for each channel</CardDescription>
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
                  <Mail className="mr-2 h-4 w-4" />
                  Email
                </TabsTrigger>
              </TabsList>

              {/* SMS Tab */}
              <TabsContent value="sms" className="space-y-4">
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>SMS Guidelines</AlertTitle>
                  <AlertDescription>
                    SMS messages should be concise (160 characters or less). The payment link is
                    included.
                  </AlertDescription>
                </Alert>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Message ({generatedMessages.sms.length} characters)</Label>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleCopy(generatedMessages.sms, 'SMS')}
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
                    value={generatedMessages.sms}
                    readOnly
                    className="font-mono text-sm"
                    rows={3}
                  />
                </div>
              </TabsContent>

              {/* WhatsApp Tab */}
              <TabsContent value="whatsapp" className="space-y-4">
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>WhatsApp Guidelines</AlertTitle>
                  <AlertDescription>
                    WhatsApp messages can be more conversational and detailed. Use emojis if
                    appropriate for your brand.
                  </AlertDescription>
                </Alert>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Message</Label>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleCopy(generatedMessages.whatsapp, 'WhatsApp')}
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
                    value={generatedMessages.whatsapp}
                    readOnly
                    className="font-mono text-sm"
                    rows={12}
                  />
                </div>
              </TabsContent>

              {/* Email Tab */}
              <TabsContent value="email" className="space-y-4">
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Email Guidelines</AlertTitle>
                  <AlertDescription>
                    Email messages are formal and include detailed information. Use the subject line
                    and body separately.
                  </AlertDescription>
                </Alert>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>Subject Line</Label>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleCopy(generatedMessages.email.subject, 'Email Subject')}
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
                      value={generatedMessages.email.subject}
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
                        onClick={() => handleCopy(generatedMessages.email.body, 'Email Body')}
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
                      value={generatedMessages.email.body}
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
      )}
    </div>
  );
}
