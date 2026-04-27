import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Mail, CheckCircle2, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthSession } from '@/contexts/auth';
import { toast } from 'sonner';
import { logger } from '@/utils/logger';

/**
 * Supabase Auth email confirmation — works without premium or external KYC providers.
 */
export function AccountVerificationCard() {
  const { user } = useAuthSession();
  const [sending, setSending] = useState(false);

  if (!user?.email) {
    return null;
  }

  const confirmed = Boolean(user.email_confirmed_at);

  const handleResend = async () => {
    if (!user.email) return;
    setSending(true);
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: user.email,
        options: {
          emailRedirectTo: `${window.location.origin}/dashboard`,
        },
      });
      if (error) {
        toast.error(error.message || 'Could not send email');
        return;
      }
      toast.success('Check your inbox for the confirmation link.');
    } catch (e) {
      logger.error('Resend confirmation failed', e);
      toast.error('Could not send confirmation email. Try again later.');
    } finally {
      setSending(false);
    }
  };

  return (
    <Card className="mb-6">
      <CardHeader className="pb-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Mail className="h-5 w-5 text-primary" />
            Account email
          </CardTitle>
          {confirmed ? (
            <Badge variant="outline" className="border-emerald-300 bg-emerald-50 text-emerald-900">
              <CheckCircle2 className="mr-1 h-3.5 w-3.5" />
              Confirmed
            </Badge>
          ) : (
            <Badge variant="secondary">Not confirmed</Badge>
          )}
        </div>
        <CardDescription>
          {confirmed
            ? 'Your sign-in email is verified. Identity checks (BVN/NIN) are below when your plan includes them.'
            : 'Confirm your email to secure your account and satisfy some platform checks. This does not replace BVN/NIN verification.'}
        </CardDescription>
      </CardHeader>
      {!confirmed && (
        <CardContent className="pt-0">
          <Button type="button" onClick={() => void handleResend()} disabled={sending}>
            {sending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Sending…
              </>
            ) : (
              'Resend confirmation email'
            )}
          </Button>
        </CardContent>
      )}
    </Card>
  );
}
