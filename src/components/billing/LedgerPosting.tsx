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
  BookOpen,
  CheckCircle,
  AlertTriangle,
  Calculator,
  Wallet,
  User,
  Building2,
  DollarSign,
  FileText,
} from 'lucide-react';
import { persistJournalEntries } from '@/services/payments/accounting';
import { useAuthSession } from '@/contexts/auth';
import { toast } from 'sonner';

interface Invoice {
  id: string;
  invoiceNumber: string;
  amountDue: number;
  amountPaid: number;
  dueDate: string;
  tenantId: string;
  propertyId: string;
  propertyName?: string;
  tenantName?: string;
}

interface PaymentData {
  paymentId: string;
  paymentReference: string;
  paymentAmount: number;
  paymentDate: string;
  tenantId: string;
  propertyId: string;
  paymentMethod: string;
  agentId?: string;
  agentCommissionRate?: number;
  platformFeeRate?: number;
  taxRate?: number;
}

interface LedgerEntry {
  account: string;
  debit: number;
  credit: number;
  description: string;
  reference: string;
}

interface LedgerPosting {
  paymentData: PaymentData;
  invoicesSettled: {
    invoice: Invoice;
    amountApplied: number;
    remainingBalance: number;
  }[];
  walletCredit: number;
  agentCommission: number;
  platformFee: number;
  taxAmount: number;
  landlordPayout: number;
  journalEntries: LedgerEntry[];
  totalsBalance: boolean;
  balanceCheck: {
    totalDebits: number;
    totalCredits: number;
    difference: number;
  };
}

export function LedgerPosting() {
  const { user } = useAuthSession();
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentReference, setPaymentReference] = useState('');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [tenantId, setTenantId] = useState('');
  const [propertyId, setPropertyId] = useState('');
  const [agentId, setAgentId] = useState('');
  const [agentCommissionRate, setAgentCommissionRate] = useState('3');
  const [platformFeeRate, setPlatformFeeRate] = useState('5');
  const [taxRate, setTaxRate] = useState('7.5');
  const [paymentMethod, setPaymentMethod] = useState('flutterwave');
  const [invoicesJson, setInvoicesJson] = useState('');
  const [posting, setPosting] = useState<LedgerPosting | null>(null);

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

  const calculateLedgerPosting = (): LedgerPosting | null => {
    if (!paymentAmount || !paymentReference || !tenantId || !propertyId) {
      return null;
    }

    const payment = parseFloat(paymentAmount);
    if (isNaN(payment) || payment <= 0) {
      return null;
    }

    // Parse invoices
    let invoices: Invoice[] = [];
    if (invoicesJson) {
      try {
        const parsed = JSON.parse(invoicesJson);
        invoices = Array.isArray(parsed) ? parsed : [parsed];
      } catch {
        // If JSON parsing fails, create a default invoice
        invoices = [
          {
            id: 'default-invoice',
            invoiceNumber: 'INV-001',
            amountDue: payment,
            amountPaid: 0,
            dueDate: paymentDate,
            tenantId,
            propertyId,
          },
        ];
      }
    } else {
      // Create default invoice if none provided
      invoices = [
        {
          id: 'default-invoice',
          invoiceNumber: 'INV-001',
          amountDue: payment,
          amountPaid: 0,
          dueDate: paymentDate,
          tenantId,
          propertyId,
        },
      ];
    }

    // Sort invoices by due date (oldest first) for FIFO settlement
    invoices.sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());

    // Calculate rates
    const agentRate = parseFloat(agentCommissionRate) / 100 || 0.03;
    const platformRate = parseFloat(platformFeeRate) / 100 || 0.05;
    const taxRateValue = parseFloat(taxRate) / 100 || 0.075;

    // Determine which invoices to settle (FIFO)
    const invoicesSettled: LedgerPosting['invoicesSettled'] = [];
    let remainingPayment = payment;

    for (const invoice of invoices) {
      if (remainingPayment <= 0) break;

      const outstandingAmount = invoice.amountDue - invoice.amountPaid;
      if (outstandingAmount <= 0) continue;

      const amountToApply = Math.min(remainingPayment, outstandingAmount);
      invoicesSettled.push({
        invoice,
        amountApplied: amountToApply,
        remainingBalance: outstandingAmount - amountToApply,
      });

      remainingPayment -= amountToApply;
    }

    // Calculate wallet credit (excess payment)
    const walletCredit = remainingPayment > 0 ? remainingPayment : 0;

    // Calculate breakdown from total payment
    const totalSettled = invoicesSettled.reduce((sum, item) => sum + item.amountApplied, 0);
    const effectivePayment = totalSettled; // Use settled amount for calculations

    const platformFee = effectivePayment * platformRate;
    const agentCommission = agentId ? effectivePayment * agentRate : 0;
    const taxAmount = effectivePayment * taxRateValue;
    const landlordPayout = effectivePayment - platformFee - agentCommission - taxAmount;

    // Create journal entries (double-entry accounting)
    const journalEntries: LedgerEntry[] = [];

    // 1. Debit: Cash/Bank Account (Payment received)
    journalEntries.push({
      account: 'Cash/Bank Account',
      debit: payment,
      credit: 0,
      description: `Payment received via ${paymentMethod}`,
      reference: paymentReference,
    });

    // 2. Credit: Accounts Receivable (Invoice settlement)
    invoicesSettled.forEach((settlement) => {
      journalEntries.push({
        account: 'Accounts Receivable',
        debit: 0,
        credit: settlement.amountApplied,
        description: `Settlement of invoice ${settlement.invoice.invoiceNumber}`,
        reference: settlement.invoice.invoiceNumber,
      });
    });

    // 3. Credit: Tenant Wallet (if excess payment)
    if (walletCredit > 0) {
      journalEntries.push({
        account: 'Tenant Wallet',
        debit: 0,
        credit: walletCredit,
        description: 'Excess payment credited to tenant wallet',
        reference: paymentReference,
      });
    }

    // 4. Debit: Platform Fee Expense (if applicable)
    // Credit: Platform Revenue
    if (platformFee > 0) {
      journalEntries.push({
        account: 'Platform Revenue',
        debit: 0,
        credit: platformFee,
        description: 'Platform service fee',
        reference: paymentReference,
      });
    }

    // 5. Debit: Agent Commission Expense
    // Credit: Agent Payable (if agent involved)
    if (agentCommission > 0 && agentId) {
      journalEntries.push({
        account: 'Agent Commission Payable',
        debit: 0,
        credit: agentCommission,
        description: `Agent commission (${(agentRate * 100).toFixed(1)}%)`,
        reference: paymentReference,
      });
    }

    // 6. Debit: Tax Expense
    // Credit: Tax Payable
    if (taxAmount > 0) {
      journalEntries.push({
        account: 'Tax Payable',
        debit: 0,
        credit: taxAmount,
        description: `VAT/Tax (${(taxRateValue * 100).toFixed(1)}%)`,
        reference: paymentReference,
      });
    }

    // 7. Debit: Owner Payout Payable
    // Credit: Owner Wallet (or direct payout)
    if (landlordPayout > 0) {
      journalEntries.push({
        account: 'Owner Payout Payable',
        debit: 0,
        credit: landlordPayout,
        description: 'Amount due to property owner',
        reference: paymentReference,
      });
    }

    // Calculate totals for balance check
    const totalDebits = journalEntries.reduce((sum, entry) => sum + entry.debit, 0);
    const totalCredits = journalEntries.reduce((sum, entry) => sum + entry.credit, 0);
    const difference = Math.abs(totalDebits - totalCredits);
    const totalsBalance = difference < 0.01; // Allow for floating point precision

    return {
      paymentData: {
        paymentId: `PAY-${Date.now()}`,
        paymentReference,
        paymentAmount: payment,
        paymentDate,
        tenantId,
        propertyId,
        paymentMethod,
        agentId: agentId || undefined,
        agentCommissionRate: agentRate,
        platformFeeRate: platformRate,
        taxRate: taxRateValue,
      },
      invoicesSettled,
      walletCredit,
      agentCommission,
      platformFee,
      taxAmount,
      landlordPayout,
      journalEntries,
      totalsBalance,
      balanceCheck: {
        totalDebits,
        totalCredits,
        difference,
      },
    };
  };

  const handlePost = async () => {
    const result = calculateLedgerPosting();
    if (!result) return;

    setPosting(result);

    const { success, batchId, error } = await persistJournalEntries(result.journalEntries, {
      entryDate: result.paymentData.paymentDate,
      sourceType: 'manual',
      propertyId: result.paymentData.propertyId || undefined,
      tenantId: result.paymentData.tenantId || undefined,
      createdBy: user?.id,
    });

    if (success) {
      toast.success(`Ledger posted successfully. Batch ID: ${batchId.slice(0, 8)}...`);
    } else {
      toast.error(`Failed to post ledger: ${error}`);
    }
  };

  const handleParseInvoices = () => {
    // Helper to parse invoice JSON
    try {
      const parsed = JSON.parse(invoicesJson);
      const invoices = Array.isArray(parsed) ? parsed : [parsed];
      setInvoicesJson(JSON.stringify(invoices, null, 2));
    } catch (error) {
      alert('Invalid JSON format. Please check your input.');
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-blue-500" />
            Billing Ledger Posting
          </CardTitle>
          <CardDescription>
            Post confirmed payments to the billing ledger with proper invoice settlement, commission
            splits, and journal entries
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Payment Details */}
          <div>
            <h3 className="mb-4 text-lg font-semibold">Payment Details</h3>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="paymentAmount">Payment Amount (₦) *</Label>
                <Input
                  id="paymentAmount"
                  type="number"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  placeholder="6000000"
                />
              </div>
              <div>
                <Label htmlFor="paymentReference">Payment Reference *</Label>
                <Input
                  id="paymentReference"
                  value={paymentReference}
                  onChange={(e) => setPaymentReference(e.target.value)}
                  placeholder="T123456789"
                />
              </div>
              <div>
                <Label htmlFor="paymentDate">Payment Date *</Label>
                <Input
                  id="paymentDate"
                  type="date"
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="paymentMethod">Payment Method</Label>
                <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                  <SelectTrigger id="paymentMethod">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="flutterwave">Flutterwave</SelectItem>
                    <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="ussd">USSD</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="tenantId">Tenant ID *</Label>
                <Input
                  id="tenantId"
                  value={tenantId}
                  onChange={(e) => setTenantId(e.target.value)}
                  placeholder="Tenant ID"
                />
              </div>
              <div>
                <Label htmlFor="propertyId">Property ID *</Label>
                <Input
                  id="propertyId"
                  value={propertyId}
                  onChange={(e) => setPropertyId(e.target.value)}
                  placeholder="Property ID"
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Commission & Fee Rates */}
          <div>
            <h3 className="mb-4 text-lg font-semibold">Commission & Fee Rates (%)</h3>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div>
                <Label htmlFor="platformFeeRate">Platform Fee Rate (%)</Label>
                <Input
                  id="platformFeeRate"
                  type="number"
                  step="0.1"
                  value={platformFeeRate}
                  onChange={(e) => setPlatformFeeRate(e.target.value)}
                  placeholder="5"
                />
              </div>
              <div>
                <Label htmlFor="agentCommissionRate">Agent Commission Rate (%)</Label>
                <Input
                  id="agentCommissionRate"
                  type="number"
                  step="0.1"
                  value={agentCommissionRate}
                  onChange={(e) => setAgentCommissionRate(e.target.value)}
                  placeholder="3"
                />
              </div>
              <div>
                <Label htmlFor="taxRate">Tax Rate (%)</Label>
                <Input
                  id="taxRate"
                  type="number"
                  step="0.1"
                  value={taxRate}
                  onChange={(e) => setTaxRate(e.target.value)}
                  placeholder="7.5"
                />
              </div>
            </div>
            <div className="mt-4">
              <Label htmlFor="agentId">Agent ID (Optional)</Label>
              <Input
                id="agentId"
                value={agentId}
                onChange={(e) => setAgentId(e.target.value)}
                placeholder="Leave empty if no agent"
              />
            </div>
          </div>

          <Separator />

          {/* Invoices */}
          <div>
            <h3 className="mb-4 text-lg font-semibold">Invoices to Settle</h3>
            <Label htmlFor="invoicesJson">
              Invoices JSON (Optional - will create default if empty)
            </Label>
            <Textarea
              id="invoicesJson"
              value={invoicesJson}
              onChange={(e) => setInvoicesJson(e.target.value)}
              placeholder='[{"id": "inv-1", "invoiceNumber": "INV-001", "amountDue": 6000000, "amountPaid": 0, "dueDate": "2024-01-15", "tenantId": "tenant-1", "propertyId": "prop-1"}]'
              className="mt-2 font-mono text-sm"
              rows={6}
            />
            <p className="mt-1 text-xs text-gray-500">
              Invoices will be settled in FIFO order (oldest due date first)
            </p>
          </div>

          <Button onClick={handlePost} className="w-full" size="lg">
            <Calculator className="mr-2 h-4 w-4" />
            Post to Ledger
          </Button>
        </CardContent>
      </Card>

      {/* Ledger Posting Results */}
      {posting && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Ledger Posting Results</CardTitle>
              <Badge
                variant={posting.totalsBalance ? 'default' : 'destructive'}
                className={
                  posting.totalsBalance ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }
              >
                {posting.totalsBalance ? 'Balanced' : 'Unbalanced'}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Balance Check */}
            <Alert
              className={
                posting.totalsBalance ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'
              }
            >
              {posting.totalsBalance ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : (
                <AlertTriangle className="h-5 w-5 text-red-500" />
              )}
              <AlertTitle>Balance Check</AlertTitle>
              <AlertDescription className="mt-2">
                <div className="space-y-1">
                  <p>
                    <strong>Total Debits:</strong>{' '}
                    {formatCurrency(posting.balanceCheck.totalDebits)}
                  </p>
                  <p>
                    <strong>Total Credits:</strong>{' '}
                    {formatCurrency(posting.balanceCheck.totalCredits)}
                  </p>
                  <p>
                    <strong>Difference:</strong> {formatCurrency(posting.balanceCheck.difference)}
                  </p>
                  {posting.totalsBalance ? (
                    <p className="font-semibold text-green-600">✓ Ledger is balanced</p>
                  ) : (
                    <p className="font-semibold text-red-600">
                      ⚠ Ledger is unbalanced - please review
                    </p>
                  )}
                </div>
              </AlertDescription>
            </Alert>

            {/* Payment Breakdown */}
            <div>
              <h3 className="mb-3 flex items-center gap-2 font-semibold">
                <DollarSign className="h-5 w-5 text-blue-500" />
                Payment Breakdown
              </h3>
              <div className="grid grid-cols-2 gap-4 rounded-lg border bg-gray-50 p-4">
                <div>
                  <p className="text-sm text-gray-600">Total Payment</p>
                  <p className="text-lg font-semibold">
                    {formatCurrency(posting.paymentData.paymentAmount)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Platform Fee</p>
                  <p className="font-semibold">
                    {formatCurrency(posting.platformFee)} (
                    {(posting.paymentData.platformFeeRate * 100).toFixed(1)}%)
                  </p>
                </div>
                {posting.agentCommission > 0 && (
                  <div>
                    <p className="text-sm text-gray-600">Agent Commission</p>
                    <p className="font-semibold">
                      {formatCurrency(posting.agentCommission)} (
                      {(posting.paymentData.agentCommissionRate! * 100).toFixed(1)}%)
                    </p>
                  </div>
                )}
                <div>
                  <p className="text-sm text-gray-600">Tax Amount</p>
                  <p className="font-semibold">
                    {formatCurrency(posting.taxAmount)} (
                    {(posting.paymentData.taxRate * 100).toFixed(1)}%)
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Landlord Payout</p>
                  <p className="font-semibold text-green-600">
                    {formatCurrency(posting.landlordPayout)}
                  </p>
                </div>
                {posting.walletCredit > 0 && (
                  <div>
                    <p className="text-sm text-gray-600">Wallet Credit</p>
                    <p className="font-semibold text-blue-600">
                      {formatCurrency(posting.walletCredit)}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Invoices Settled */}
            {posting.invoicesSettled.length > 0 && (
              <div>
                <h3 className="mb-3 flex items-center gap-2 font-semibold">
                  <FileText className="h-5 w-5 text-blue-500" />
                  Invoices Settled
                </h3>
                <div className="space-y-3">
                  {posting.invoicesSettled.map((settlement, index) => (
                    <div key={index} className="rounded-lg border bg-gray-50 p-4">
                      <div className="mb-2 flex items-center justify-between">
                        <div>
                          <p className="font-semibold">{settlement.invoice.invoiceNumber}</p>
                          <p className="text-sm text-gray-600">
                            Due: {formatDate(settlement.invoice.dueDate)}
                          </p>
                        </div>
                        <Badge variant="outline">Settled</Badge>
                      </div>
                      <div className="mt-3 grid grid-cols-3 gap-4">
                        <div>
                          <p className="text-xs text-gray-600">Amount Due</p>
                          <p className="font-semibold">
                            {formatCurrency(settlement.invoice.amountDue)}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-600">Amount Applied</p>
                          <p className="font-semibold text-green-600">
                            {formatCurrency(settlement.amountApplied)}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-600">Remaining Balance</p>
                          <p className="font-semibold text-red-600">
                            {formatCurrency(settlement.remainingBalance)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Journal Entries */}
            <div>
              <h3 className="mb-3 flex items-center gap-2 font-semibold">
                <BookOpen className="h-5 w-5 text-blue-500" />
                Journal Entries
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-gray-300">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="border border-gray-300 p-2 text-left">Account</th>
                      <th className="border border-gray-300 p-2 text-right">Debit (₦)</th>
                      <th className="border border-gray-300 p-2 text-right">Credit (₦)</th>
                      <th className="border border-gray-300 p-2 text-left">Description</th>
                      <th className="border border-gray-300 p-2 text-left">Reference</th>
                    </tr>
                  </thead>
                  <tbody>
                    {posting.journalEntries.map((entry, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="border border-gray-300 p-2 font-medium">{entry.account}</td>
                        <td className="border border-gray-300 p-2 text-right">
                          {entry.debit > 0 ? formatCurrency(entry.debit) : '-'}
                        </td>
                        <td className="border border-gray-300 p-2 text-right">
                          {entry.credit > 0 ? formatCurrency(entry.credit) : '-'}
                        </td>
                        <td className="border border-gray-300 p-2 text-sm text-gray-600">
                          {entry.description}
                        </td>
                        <td className="border border-gray-300 p-2 font-mono text-sm">
                          {entry.reference}
                        </td>
                      </tr>
                    ))}
                    <tr className="bg-gray-100 font-bold">
                      <td className="border border-gray-300 p-2">TOTAL</td>
                      <td className="border border-gray-300 p-2 text-right">
                        {formatCurrency(posting.balanceCheck.totalDebits)}
                      </td>
                      <td className="border border-gray-300 p-2 text-right">
                        {formatCurrency(posting.balanceCheck.totalCredits)}
                      </td>
                      <td className="border border-gray-300 p-2" colSpan={2}></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
