'use client';

import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, Send, Download, Copy, Check } from 'lucide-react';
import { toast } from '@/components/ui/sonner';

const API_BASE = import.meta.env.VITE_VOICE_SERVER_URL || 'http://localhost:4000';

interface TransactionDetail {
  id: string;
  tenant_name: string;
  amount: number;
  status: string;
  payment_method: string;
  transaction_id: string;
  date: string;
  due_date?: string;
  paid_date?: string;
  created_at?: string;
}

export function TransactionDetailScreen() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [payment, setPayment] = useState<TransactionDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [resending, setResending] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!id) return;
    fetch(`${API_BASE}/api/payments/${id}`)
      .then((res) => {
        if (!res.ok) throw new Error('Payment not found');
        return res.json();
      })
      .then(setPayment)
      .catch(() => {
        toast.error('Failed to load transaction');
        setPayment(null);
      })
      .finally(() => setLoading(false));
  }, [id]);

  const handleResendLink = async () => {
    if (!id || !payment) return;
    setResending(true);
    try {
      const res = await fetch(`${API_BASE}/api/payments/${id}/resend-link`, {
        method: 'POST',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to resend');
      if (data.payment_link) {
        window.open(data.payment_link, '_blank');
        toast.success('Payment link opened in new tab');
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to resend payment link');
    } finally {
      setResending(false);
    }
  };

  const handleDownloadReceipt = async () => {
    if (!id) return;
    try {
      const res = await fetch(`${API_BASE}/api/payments/${id}/receipt`);
      if (!res.ok) throw new Error('Failed to fetch receipt');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `receipt-${id.slice(0, 8)}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success('Receipt downloaded');
    } catch {
      toast.error('Failed to download receipt');
    }
  };

  const copyTxRef = () => {
    if (!payment?.transaction_id || payment.transaction_id === '—') return;
    navigator.clipboard.writeText(payment.transaction_id);
    setCopied(true);
    toast.success('Reference copied');
    setTimeout(() => setCopied(false), 2000);
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'paid':
        return 'bg-emerald-100 text-emerald-800';
      case 'pending':
      case 'overdue':
        return 'bg-amber-100 text-amber-800';
      case 'cancelled':
        return 'bg-slate-100 text-slate-600';
      default:
        return 'bg-slate-100 text-slate-600';
    }
  };

  const canResend = payment && ['pending', 'overdue'].includes(payment.status?.toLowerCase());

  if (loading) {
    return (
      <div className="mx-auto max-w-2xl space-y-6 p-4">
        <Skeleton className="h-10 w-24" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!payment) {
    return (
      <div className="mx-auto max-w-2xl p-4">
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">Transaction not found.</p>
            <Button variant="outline" className="mt-4" onClick={() => navigate(-1)}>
              Go back
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-4">
      <Button variant="ghost" size="sm" className="-ml-2" onClick={() => navigate(-1)}>
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back
      </Button>

      <Card>
        <CardHeader>
          <CardTitle>Transaction Details</CardTitle>
          <CardDescription>Payment information and actions</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Tenant Name</p>
              <p className="font-medium">{payment.tenant_name}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Amount</p>
              <p className="text-xl font-semibold">₦{payment.amount.toLocaleString()}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Status</p>
              <Badge className={getStatusColor(payment.status)}>
                {payment.status?.toUpperCase()}
              </Badge>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Date</p>
              <p className="font-medium">{payment.date}</p>
            </div>
            <div className="space-y-1 sm:col-span-2">
              <p className="text-sm text-muted-foreground">Payment Method</p>
              <p className="font-medium">{payment.payment_method}</p>
            </div>
            <div className="space-y-1 sm:col-span-2">
              <p className="text-sm text-muted-foreground">Transaction Reference</p>
              <div className="flex items-center gap-2">
                <code className="rounded bg-slate-100 px-2 py-1 font-mono text-sm">
                  {payment.transaction_id}
                </code>
                {payment.transaction_id !== '—' && (
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={copyTxRef}>
                    {copied ? (
                      <Check className="h-4 w-4 text-emerald-600" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-3 border-t pt-6">
            {canResend && (
              <Button onClick={handleResendLink} disabled={resending}>
                <Send className="mr-2 h-4 w-4" />
                {resending ? 'Sending…' : 'Resend payment link'}
              </Button>
            )}
            <Button variant="outline" onClick={handleDownloadReceipt}>
              <Download className="mr-2 h-4 w-4" />
              Download receipt
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
