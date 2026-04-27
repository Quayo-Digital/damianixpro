import { supabase } from '@/integrations/supabase/client';

export type AnnouncementAudience = 'all' | 'residential' | 'commercial';

export interface PropertyAnnouncement {
  id: string;
  property_id: string;
  title: string;
  body: string;
  audience: AnnouncementAudience;
  created_by: string | null;
  published_at: string;
  created_at: string;
  updated_at: string;
}

function isMissingTable(err: { code?: string; message?: string } | null): boolean {
  if (!err) return false;
  if (err.code === '42P01') return true;
  const m = (err.message || '').toLowerCase();
  return m.includes('property_announcements') && m.includes('does not exist');
}

export async function fetchPropertyAnnouncements(
  propertyId: string
): Promise<PropertyAnnouncement[]> {
  if (!propertyId) return [];

  const { data, error } = await supabase
    .from('property_announcements')
    .select('*')
    .eq('property_id', propertyId)
    .order('published_at', { ascending: false })
    .limit(50);

  if (error) {
    if (isMissingTable(error)) return [];
    console.error('[propertyAnnouncements]', error);
    return [];
  }

  return (data ?? []) as PropertyAnnouncement[];
}

export async function createPropertyAnnouncement(params: {
  propertyId: string;
  title: string;
  body: string;
  audience: AnnouncementAudience;
}): Promise<{ ok: boolean; error?: string }> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: 'Not signed in' };

  const { error } = await supabase.from('property_announcements').insert({
    property_id: params.propertyId,
    title: params.title.trim(),
    body: params.body.trim(),
    audience: params.audience,
    created_by: user.id,
    published_at: new Date().toISOString(),
  });

  if (error) {
    if (isMissingTable(error)) {
      return {
        ok: false,
        error: 'Announcements table not installed. Apply latest Supabase migration.',
      };
    }
    return { ok: false, error: error.message };
  }

  return { ok: true };
}
