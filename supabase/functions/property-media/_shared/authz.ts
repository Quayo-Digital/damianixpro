import type { SupabaseClient, User } from 'https://esm.sh/@supabase/supabase-js@2';

export type UserContext = {
  user: User;
  userId: string;
  isAdmin: boolean;
};

type PropertyOwnerRow = {
  owner_id: string | null;
};

export async function requireUserContext(
  admin: SupabaseClient,
  req: Request
): Promise<UserContext> {
  const authHeader = req.headers.get('authorization') ?? req.headers.get('Authorization') ?? '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
  if (!token) throw new Error('Unauthorized: missing bearer token');

  const { data, error } = await admin.auth.getUser(token);
  if (error || !data?.user) throw new Error('Unauthorized: invalid session');

  const userId = data.user.id;
  const { data: roleRows } = await admin
    .from('user_roles')
    .select('role')
    .eq('user_id', userId)
    .in('role', ['admin', 'super_admin'])
    .limit(1);

  return {
    user: data.user,
    userId,
    isAdmin: Boolean(roleRows && roleRows.length > 0),
  };
}

export async function getOptionalUserContext(
  admin: SupabaseClient,
  req: Request
): Promise<UserContext | null> {
  const authHeader = req.headers.get('authorization') ?? req.headers.get('Authorization') ?? '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
  if (!token) return null;

  const { data, error } = await admin.auth.getUser(token);
  if (error || !data?.user) return null;

  const userId = data.user.id;
  const { data: roleRows } = await admin
    .from('user_roles')
    .select('role')
    .eq('user_id', userId)
    .in('role', ['admin', 'super_admin'])
    .limit(1);

  return {
    user: data.user,
    userId,
    isAdmin: Boolean(roleRows && roleRows.length > 0),
  };
}

export async function assertCanManageProperty(
  admin: SupabaseClient,
  ctx: UserContext,
  propertyId: string
): Promise<{ ownerId: string }> {
  const { data, error } = await admin
    .from('properties')
    .select('owner_id')
    .eq('id', propertyId)
    .maybeSingle<PropertyOwnerRow>();

  if (error) throw new Error(`Failed to fetch property: ${error.message}`);
  if (!data) throw new Error('Property not found');
  if (!data.owner_id) throw new Error('Property owner is missing');
  if (ctx.isAdmin || data.owner_id === ctx.userId) return { ownerId: data.owner_id };

  throw new Error('Forbidden: property access denied');
}
