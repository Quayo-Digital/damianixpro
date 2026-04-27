import { supabase } from '@/integrations/supabase/client';

export interface ResidentCommunityPost {
  id: string;
  property_id: string;
  author_id: string;
  body: string;
  pinned: boolean;
  created_at: string;
  updated_at: string;
}

function isMissingTable(err: { code?: string; message?: string } | null): boolean {
  if (!err) return false;
  if (err.code === '42P01') return true;
  const m = (err.message || '').toLowerCase();
  return m.includes('resident_community_posts') && m.includes('does not exist');
}

export async function fetchCommunityPosts(propertyId: string): Promise<ResidentCommunityPost[]> {
  if (!propertyId) return [];

  const { data, error } = await supabase
    .from('resident_community_posts')
    .select('*')
    .eq('property_id', propertyId)
    .order('pinned', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(80);

  if (error) {
    if (isMissingTable(error)) return [];
    console.error('[communityPosts]', error);
    return [];
  }

  return (data ?? []) as ResidentCommunityPost[];
}

export async function createCommunityPost(
  propertyId: string,
  body: string
): Promise<{ ok: boolean; error?: string }> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: 'Not signed in' };

  const trimmed = body.trim();
  if (!trimmed) return { ok: false, error: 'Message cannot be empty' };

  const { error } = await supabase.from('resident_community_posts').insert({
    property_id: propertyId,
    author_id: user.id,
    body: trimmed,
  });

  if (error) {
    if (isMissingTable(error)) {
      return {
        ok: false,
        error: 'Community board not installed. Apply latest Supabase migration.',
      };
    }
    return { ok: false, error: error.message };
  }

  return { ok: true };
}

export async function deleteCommunityPost(
  postId: string
): Promise<{ ok: boolean; error?: string }> {
  const { error } = await supabase.from('resident_community_posts').delete().eq('id', postId);

  if (error) {
    return { ok: false, error: error.message };
  }
  return { ok: true };
}
