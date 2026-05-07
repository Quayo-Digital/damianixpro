/**
 * Loads `public.user_roles.role` for `req.auth.sub` (Supabase user id).
 * Requires `requireSupabaseJwt` first. Sets `req.userRole` (string | null).
 *
 * @param {import('@supabase/supabase-js').SupabaseClient | null} supabaseAdmin
 */
export function createAttachUserRole(supabaseAdmin) {
  return async function attachUserRole(req, res, next) {
    if (!supabaseAdmin) {
      return res.status(500).json({ error: 'Supabase service client is not configured' });
    }
    if (!req.auth?.sub) {
      return res.status(500).json({ error: 'attachUserRole requires req.auth.sub' });
    }
    const { data, error } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', req.auth.sub)
      .maybeSingle();

    if (error) {
      return res.status(500).json({ error: error.message });
    }
    req.userRole = data?.role ?? null;
    next();
  };
}
