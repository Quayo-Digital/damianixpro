import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';
import { useAuthSession, useAuthActions } from '@/contexts/auth';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

type RedeemResult = { ok?: boolean; error?: string };

const errorMessages: Record<string, string> = {
  not_authenticated: 'You must be signed in to redeem this code.',
  invalid_code: 'Invalid or already used code.',
  super_admin_exists: 'A super admin is already configured for this project.',
};

export default function RedeemSuperAdmin() {
  const { user } = useAuthSession();
  const { refreshUserRole } = useAuthActions();
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleRedeem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id) {
      toast.error('You must be signed in to redeem this code.');
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase.rpc('redeem_super_admin_invite', {
        p_code: code.trim(),
      });

      if (error) {
        toast.error(error.message || 'Redeem failed.');
        return;
      }

      const result = data as RedeemResult | null;
      if (!result?.ok) {
        const key = result?.error ?? 'invalid_code';
        toast.error(errorMessages[key] ?? 'Could not redeem code.');
        return;
      }

      await refreshUserRole();
      toast.success('You are now the super admin!');
      setTimeout(() => navigate('/admin/dashboard'), 1200);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      toast.error('Unexpected error: ' + message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-secondary/50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Super Admin Setup</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center space-x-2 text-sm text-blue-600">
            <AlertCircle className="h-4 w-4" />
            <span>
              Enter your one-time super admin code while signed in. Only the first successful redeem
              becomes super admin.
            </span>
          </div>
          <form onSubmit={handleRedeem} className="space-y-4">
            <Input
              autoFocus
              placeholder="Enter super admin code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
            />
            <Button type="submit" className="w-full" disabled={loading || !code.trim()}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Verifying...
                </>
              ) : (
                'Redeem Code'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
