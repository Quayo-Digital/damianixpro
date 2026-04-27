import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { PageLayout } from '@/components/layout/PageLayout';
import { CheckCircle2, Loader2, XCircle } from 'lucide-react';
import { flutterwaveVerify } from '@/services/payments/edgeFunctionApi';

export type FlutterwaveReturnContext = 'subscription' | 'payment';

/**
 * Flutterwave (and similar) browser return: query params status, tx_ref, transaction_id.
 */
export function FlutterwaveReturnView({ context }: { context: FlutterwaveReturnContext }) {
  const [searchParams] = useSearchParams();
  const txRef = searchParams.get('tx_ref') || searchParams.get('txRef');
  const statusParam = (searchParams.get('status') || '').toLowerCase();

  const [verifyState, setVerifyState] = useState<'idle' | 'loading' | 'ok' | 'fail'>('idle');
  const [verifyMessage, setVerifyMessage] = useState<string | null>(null);

  const idleTitle = context === 'subscription' ? 'Subscription' : 'Payment';
  const idleBody =
    context === 'subscription'
      ? 'If you completed a payment, open the link from your email or payment history. Otherwise start checkout from the pricing section.'
      : 'If you completed a payment, you can close this tab or continue below. If you landed here by mistake, go home or open your dashboard.';

  useEffect(() => {
    if (!txRef) {
      setVerifyState('idle');
      return;
    }
    if (statusParam === 'cancelled' || statusParam === 'canceled') {
      setVerifyState('fail');
      setVerifyMessage('Payment was cancelled.');
      return;
    }

    const successMessage =
      context === 'subscription'
        ? 'Payment received. Your subscription will update in a few moments.'
        : 'Payment received. If something still looks pending, refresh in a minute — webhooks can take a moment.';

    let cancelled = false;
    (async () => {
      setVerifyState('loading');
      try {
        const res = await flutterwaveVerify(txRef);
        const ok =
          res.status === 'success' &&
          res.data &&
          (res.data.status === 'successful' || res.data.status === 'succeeded');
        if (cancelled) return;
        if (ok) {
          setVerifyState('ok');
          setVerifyMessage(successMessage);
        } else {
          setVerifyState('fail');
          setVerifyMessage(
            res.message || 'Could not confirm payment. If you were charged, contact support.'
          );
        }
      } catch {
        if (!cancelled) {
          setVerifyState('fail');
          setVerifyMessage(
            'Could not verify payment. Your payment may still complete via webhook shortly.'
          );
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [txRef, statusParam, context]);

  return (
    <PageLayout>
      <div className="mx-auto max-w-lg py-16 text-center">
        {verifyState === 'loading' && (
          <>
            <Loader2 className="mx-auto mb-4 h-12 w-12 animate-spin text-primary" />
            <h1 className="text-2xl font-semibold">Confirming payment…</h1>
            <p className="mt-2 text-muted-foreground">
              Please wait while we verify your transaction.
            </p>
          </>
        )}

        {verifyState === 'ok' && (
          <>
            <CheckCircle2 className="mx-auto mb-4 h-12 w-12 text-green-600" />
            <h1 className="text-2xl font-semibold">Thank you</h1>
            <p className="mt-2 text-muted-foreground">{verifyMessage}</p>
          </>
        )}

        {verifyState === 'fail' && (
          <>
            <XCircle className="mx-auto mb-4 h-12 w-12 text-destructive" />
            <h1 className="text-2xl font-semibold">Payment status</h1>
            <p className="mt-2 text-muted-foreground">{verifyMessage}</p>
          </>
        )}

        {verifyState === 'idle' && !txRef && (
          <>
            <h1 className="text-2xl font-semibold">{idleTitle}</h1>
            <p className="mt-2 text-muted-foreground">{idleBody}</p>
          </>
        )}

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Button asChild>
            <Link to="/dashboard">Go to dashboard</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link to="/">Home</Link>
          </Button>
        </div>
      </div>
    </PageLayout>
  );
}
