import { useState } from 'react';
import { Loader2, KeyRound } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import type { MfaFactorRow } from '@/components/security/mfaUtils';

type Props = {
  factor: MfaFactorRow;
  onSuccess: () => void;
  onSignOut: () => Promise<void>;
};

export function MfaChallengeScreen({ factor, onSuccess, onSignOut }: Props) {
  const [verifyCode, setVerifyCode] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (verifyCode.length < 6) {
      setError('Enter the code from your authenticator app.');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      const challenge = await supabase.auth.mfa.challenge({ factorId: factor.id });
      if (challenge.error) throw challenge.error;
      const verify = await supabase.auth.mfa.verify({
        factorId: factor.id,
        challengeId: challenge.data.id,
        code: verifyCode.replace(/\s/g, ''),
      });
      if (verify.error) throw verify.error;
      toast.success('Verified');
      onSuccess();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Invalid code';
      setError(msg);
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-muted/40 p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center">
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <KeyRound className="h-6 w-6 text-primary" aria-hidden />
          </div>
          <CardTitle>Two-factor verification</CardTitle>
          <CardDescription>
            Enter the 6-digit code from your authenticator app
            {factor.factor_type === 'phone' && factor.phone ? ` (${factor.phone})` : ''}.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="mfa-challenge-code">Authentication code</Label>
            <InputOTP
              id="mfa-challenge-code"
              maxLength={6}
              value={verifyCode}
              onChange={setVerifyCode}
              containerClassName="justify-center"
            >
              <InputOTPGroup>
                <InputOTPSlot index={0} />
                <InputOTPSlot index={1} />
                <InputOTPSlot index={2} />
                <InputOTPSlot index={3} />
                <InputOTPSlot index={4} />
                <InputOTPSlot index={5} />
              </InputOTPGroup>
            </InputOTP>
          </div>
          {error ? <p className="text-center text-sm text-destructive">{error}</p> : null}
          <Button type="button" className="w-full" onClick={handleSubmit} disabled={submitting}>
            {submitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Verifying…
              </>
            ) : (
              'Continue'
            )}
          </Button>
          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={() => void onSignOut()}
          >
            Sign out
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
