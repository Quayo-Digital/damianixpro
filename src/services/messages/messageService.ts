
import { supabase } from '@/integrations/supabase/client';
import { MessageTemplate } from './types';

export type MessageTemplatesMap = Record<string, Pick<MessageTemplate, 'title' | 'description'>>;

export const getMessageTemplates = async (): Promise<MessageTemplatesMap> => {
  const { data, error } = await supabase
    .from('message_templates')
    .select('key, title, description');

  if (error) {
    console.error('Error fetching message templates:', error);
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
