
import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { useAuth } from "@/contexts/auth";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, AlertCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function RedeemSuperAdmin() {
  const { user } = useAuth();
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleRedeem = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Fetch invite
      const { data: invite, error } = await supabase
        .from("super_admin_invite")
        .select("*")
        .eq("code", code)
        .eq("used", false)
        .maybeSingle();

      if (error || !invite) {
        toast.error("Invalid or used code.");
        setLoading(false);
        return;
      }

      // Check if super admin already exists
      const { data: existing, error: roleErr } = await supabase
        .from("user_roles")
        .select("user_id")
        .eq("role", "super_admin")
        .maybeSingle();

      if (roleErr) {
        toast.error("Error checking existing super admin.");
        setLoading(false);
        return;
      }
      if (existing) {
        toast.error("A super admin already exists.");
        setLoading(false);
        return;
      }

      // Set this user as super_admin
      const { error: upsertError } = await supabase
        .from("user_roles")
        .upsert({ user_id: user?.id, role: "super_admin" }, { onConflict: "user_id" });

      if (upsertError) {
        toast.error("Failed to set super admin role.");
        setLoading(false);
        return;
      }

      // Mark code as used
      const { error: markUsedError } = await supabase
        .from("super_admin_invite")
        .update({
          used: true,
          used_by: user?.id,
          used_at: new Date().toISOString(),
        })
        .eq("id", invite.id);

      if (markUsedError) {
        toast.warning("Role set, but could not mark code used. Contact support.");
      }

      toast.success("You are now the super admin!");
      setTimeout(() => navigate("/admin/dashboard"), 1200);
    } catch (err: any) {
      toast.error("Unexpected error: " + err.message);
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
              Enter your one-time super admin code. Only the first user to redeem this becomes super admin.
            </span>
          </div>
          <form onSubmit={handleRedeem} className="space-y-4">
            <Input
              autoFocus
              placeholder="Enter super admin code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
            />
            <Button type="submit" className="w-full" disabled={loading || !code}>
              {loading ? (
                <>
                  <Loader2 className="animate-spin mr-2 h-4 w-4" />
                  Verifying...
                </>
              ) : (
                "Redeem Code"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
