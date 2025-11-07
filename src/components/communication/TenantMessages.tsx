
import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/auth';
import { supabase } from '@/integrations/supabase/client';
import { TenantList } from './messages/TenantList';
import { MessageConversation, Message as UiMessage } from './messages/MessageConversation';
import { MessageInput } from './messages/MessageInput';
import { fetchTenants, fetchMessages, sendMessage } from '@/services/messages/messageApi';
import { Tenant, Message as DbMessage } from '@/services/messages/types';

// Helper to format DB message to component message
const formatMessage = (msg: DbMessage, currentUserId: string): UiMessage => {
  const senderType = msg.sender_id === currentUserId ? 'manager' : 'tenant';
  return {
    id: msg.id,
    sender: senderType,
    text: msg.content,
    timestamp: new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  };
};

export function TenantMessages() {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);

  const { data: tenants = [], isLoading: isLoadingTenants } = useQuery<Tenant[]>({
    queryKey: ['messagingTenants'],
    queryFn: fetchTenants,
  });

  const { data: dbMessages = [], isLoading: isLoadingMessages } = useQuery<DbMessage[]>({
    queryKey: ['messages', selectedTenant?.user_id],
    queryFn: () => {
        if (!selectedTenant?.user_id || !user) return Promise.resolve([]);
        return fetchMessages(selectedTenant.user_id, user.id);
    },
    enabled: !!selectedTenant?.user_id && !!user,
  });

  const sendMessageMutation = useMutation({
    mutationFn: sendMessage,
    onSuccess: () => {
      // The real-time subscription will handle invalidation.
      const tenantName = selectedTenant?.name || 'tenant';
      toast({
        title: "Message Sent",
        description: `Your message to ${tenantName} has been sent.`
      });
    },
    onError: (error) => {
        toast({
            title: "Error",
            description: `Failed to send message: ${error.message}`,
            variant: "destructive"
        })
    }
  });

  const handleSendMessage = (messageText: string) => {
    if (!messageText.trim() || !selectedTenant || !user) return;
    
    sendMessageMutation.mutate({
      content: messageText,
      recipientId: selectedTenant.user_id,
      senderId: user.id,
    });
  };

  useEffect(() => {
    const channel = supabase
      .channel('public:messages')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'messages' },
        (payload) => {
          const newMessage = payload.new as DbMessage;
          if (
            selectedTenant && user &&
            ((newMessage.sender_id === user.id && newMessage.recipient_id === selectedTenant.user_id) ||
             (newMessage.sender_id === selectedTenant.user_id && newMessage.recipient_id === user.id))
          ) {
            queryClient.invalidateQueries({ queryKey: ['messages', selectedTenant.user_id] });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient, selectedTenant, user]);
  
  const formattedConversations: Record<string, UiMessage[]> = {};
  if (selectedTenant && user) {
    formattedConversations[selectedTenant.id] = dbMessages.map(msg => formatMessage(msg, user.id));
  }
  
  return (
    <div className="flex flex-col h-[600px]">
      <div className="flex gap-4 mb-4">
        <TenantList 
          tenants={tenants} 
          selectedTenant={selectedTenant?.id || ''} 
          setSelectedTenant={(id) => {
            const tenant = tenants.find(t => t.id === id);
            setSelectedTenant(tenant || null);
          }} 
          isLoading={isLoadingTenants}
        />
        
        <div className="w-2/3 flex flex-col border rounded-md">
          {selectedTenant ? (
            <>
              <MessageConversation 
                conversations={formattedConversations} 
                selectedTenant={selectedTenant.id} 
                tenant={selectedTenant}
                isLoading={isLoadingMessages}
              />
              
              <MessageInput 
                selectedTenant={selectedTenant.id}
                tenant={selectedTenant}
                onSendMessage={handleSendMessage}
                disabled={sendMessageMutation.isPending}
              />
            </>
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center p-8">
                <p className="text-muted-foreground">Select a tenant to start messaging</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
