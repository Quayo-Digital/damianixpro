import { supabase } from '@/integrations/supabase/client';
import { MessageTemplate } from './types';

export type MessageTemplatesMap = Record<string, Pick<MessageTemplate, 'title' | 'description'>>;

export const getMessageTemplates = async (): Promise<MessageTemplatesMap> => {
  const { data, error } = await supabase
    .from('message_templates')
    .select('key, title, description');

  if (error) {
    const status = (error as { status?: number }).status;
    const code = String((error as { code?: string }).code || '');
    const message = String((error as { message?: string }).message || '').toLowerCase();
    const isAuthOrPermissionIssue =
      status === 401 ||
      status === 403 ||
      code === '42501' ||
      message.includes('jwt') ||
      message.includes('not authorized') ||
      message.includes('permission denied');

    if (!isAuthOrPermissionIssue) {
      console.error('Error fetching message templates:', error);
    } else if (import.meta.env.DEV) {
      console.warn('message_templates not publicly readable; using built-in defaults.');
    }
    // Return empty object on error to avoid breaking the app
    return {};
  }

  // Transform array into a key-value object for easy access
  const messages = data.reduce((acc, msg) => {
    acc[msg.key] = {
      title: msg.title,
      description: msg.description,
    };
    return acc;
  }, {} as MessageTemplatesMap);

  return messages;
};
