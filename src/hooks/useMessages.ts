import { useQuery } from '@tanstack/react-query';
import { getMessageTemplates, MessageTemplatesMap } from '@/services/messages/messageService';

export const useMessages = () => {
  const {
    data: messages,
    isLoading,
    isError,
  } = useQuery<MessageTemplatesMap>({
    queryKey: ['message_templates'],
    queryFn: getMessageTemplates,
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchOnWindowFocus: false,
    retry: false, // Don't retry on failure, we have fallbacks
  });

  const getMessage = (key: string, defaultTitle: string, defaultDescription?: string | null) => {
    if (isLoading || isError || !messages || !messages[key]) {
      return { title: defaultTitle, description: defaultDescription ?? null };
    }
    const message = messages[key];
    return {
      title: message.title || defaultTitle,
      description: message.description,
    };
  };

  return { getMessage, isLoading };
};
