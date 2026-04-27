import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';

// Function to send an announcement notification to all relevant tenants
export async function sendAnnouncementNotification(
  title: string,
  message: string,
  audience: 'all' | 'residential' | 'commercial' | string[],
  propertyIds?: string[]
): Promise<boolean> {
  try {
    let userIds: string[] = [];

    if (Array.isArray(audience)) {
      userIds = audience;
    } else if (audience === 'all') {
      const { data, error } = await supabase
        .from('tenants')
        .select('user_id')
        .not('user_id', 'is', null);
      if (error) throw error;
      userIds = data.map((t) => t.user_id!);
    } else {
      console.warn(`Audience type '${audience}' not fully implemented for announcements.`);
      return false;
    }

    if (userIds.length === 0) {
      toast.warning('No recipients found for this announcement.');
      return false;
    }

    const notificationsToInsert = userIds.map((userId) => ({
      user_id: userId,
      title: title,
      description: message,
      type: 'announcement' as const,
      link: '/notifications', // Changed to /notifications
      metadata: { propertyIds },
    }));

    const { error } = await supabase.from('notifications').insert(notificationsToInsert);

    if (error) throw error;

    toast.success('Announcement sent successfully.');

    return true;
  } catch (error) {
    console.error('Error sending announcement notification:', error);
    toast.error('Failed to send announcement.');
    return false;
  }
}
