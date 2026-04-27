import { useEffect, useState } from 'react';
import { Loader2, Shield } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { logger } from '@/utils/logger';
import { qrCodeToImgSrc } from '@/components/security/mfaUtils';
import { formatMfaSetupError, prepareTotpEnrollment } from '@/utils/mfaTotpEnrollment';

type Props = {
  onEnrolled: () => void;
  onSignOut: () => Promise<void>;
};

export function MfaEnrollmentScreen({ onEnrolled, onSignOut }: Props) {
  const [factorId, setFactorId] = useState<string | null>(null);
  const [qrSrc, setQrSrc] = useState('');
  const [secret, setSecret] = useState('');
  const [verifyCode, setVerifyCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      setLoading(true);
      setError('');
      try {
        const data = await prepareTotpEnrollment();
        if (cancelled) return;

        setFactorId(data.factorId);
        setQrSrc(qrCodeToImgSrc(data.qrCode));
        setSecret(data.secret);
      } catch (e: unknown) {
        if (!cancelled) {
          setError(formatMfaSetupError(e));
          logger.error('MFA enroll init failed', e);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const handleEnable = async () => {
    if (!factorId || verifyCode.length < 6) {
      setError('Enter the 6-digit code from your authenticator app.');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      const challenge = await supabase.auth.mfa.challenge({ factorId });
      if (challenge.error) throw challenge.error;
      const verify = await supabase.auth.mfa.verify({
        factorId,
        challengeId: challenge.data.id,
        code: verifyCode.replace(/\s/g, ''),
      });
      if (verify.error) throw verify.error;
      toast.success('Two-factor authentication enabled');
      onEnrolled();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Verification failed';
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
            <Shield className="h-6 w-6 text-primary" aria-hidden />
          </div>
          <CardTitle>Secure your account</CardTitle>
          <CardDescription>
            Your role requires two-factor authentication. Scan the QR code with an authenticator app
            (Google Authenticator, Authy, 1Password, etc.), then enter the code to continue.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {loading ? (
            <div className="flex flex-col items-center gap-3 py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" aria-hidden />
              <p className="text-sm text-muted-foreground">Preparing authenticator setup…</p>
            </div>
          ) : (
            <>
              {qrSrc ? (
                <div className="flex flex-col items-center gap-2">
                  <img
                    src={qrSrc}
                    alt="Scan with your authenticator app to add this account"
                    className="max-h-48 w-48 rounded-md border bg-white p-2"
                  />
                </div>
              ) : null}
              {secret ? (
                <p className="break-all text-center text-xs text-muted-foreground">
                  If you cannot scan the code, enter this secret manually:{' '}
                  <span className="font-mono text-foreground">{secret}</span>
                </p>
              ) : null}
              <div className="space-y-2">
                <Label htmlFor="mfa-enroll-code">Authenticator code</Label>
                <InputOTP
                  id="mfa-enroll-code"
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
              <Button type="button" className="w-full" onClick={handleEnable} disabled={submitting}>
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Verifying…
                  </>
                ) : (
                  'Confirm and continue'
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
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
