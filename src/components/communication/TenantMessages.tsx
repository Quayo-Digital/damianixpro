import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { useAuthSession } from '@/contexts/auth';
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
    timestamp: new Date(msg.created_at).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    }),
  };
};

interface TenantMessagesProps {
  initialUserId?: string;
}

export function TenantMessages({ initialUserId }: TenantMessagesProps) {
  const { toast } = useToast();
  const { user, userRole } = useAuthSession();
  const queryClient = useQueryClient();
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);
  const hasInitializedSelection = useRef(false);

  // Restrict this component to owners/agents/managers only
  const allowedRoles = ['owner', 'agent', 'manager', 'admin', 'super_admin'];
  const isAllowedRole = !userRole || allowedRoles.includes(userRole);

  const { data: tenants = [], isLoading: isLoadingTenants } = useQuery<Tenant[]>({
    queryKey: ['messagingTenants'],
    queryFn: fetchTenants,
    enabled: isAllowedRole,
  });

  // Pre-select tenant when navigating from Tenants page with ?userId=
  useEffect(() => {
    if (initialUserId && tenants.length > 0 && !hasInitializedSelection.current) {
      const tenant = tenants.find((t) => t.user_id === initialUserId);
      if (tenant) {
        setSelectedTenant(tenant);
        hasInitializedSelection.current = true;
      }
    }
  }, [initialUserId, tenants]);

  const { data: dbMessages = [], isLoading: isLoadingMessages } = useQuery<DbMessage[]>({
    queryKey: ['messages', selectedTenant?.user_id],
    queryFn: () => {
      if (!selectedTenant?.user_id || !user) return Promise.resolve([]);
      return fetchMessages(selectedTenant.user_id, user.id);
    },
    enabled: !!selectedTenant?.user_id && !!user && isAllowedRole,
  });

  const sendMessageMutation = useMutation({
    mutationFn: sendMessage,
    onSuccess: () => {
      // The real-time subscription will handle invalidation.
      const tenantName = selectedTenant?.name || 'tenant';
      toast({
        title: 'Message Sent',
        description: `Your message to ${tenantName} has been sent.`,
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: `Failed to send message: ${error.message}`,
        variant: 'destructive',
      });
    },
  });

  useEffect(() => {
    if (!isAllowedRole) return;

    const channel = supabase
      .channel('public:messages')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, (payload) => {
        const newMessage = payload.new as DbMessage;
        if (
          selectedTenant &&
          user &&
          ((newMessage.sender_id === user.id &&
            newMessage.recipient_id === selectedTenant.user_id) ||
            (newMessage.sender_id === selectedTenant.user_id &&
              newMessage.recipient_id === user.id))
        ) {
          queryClient.invalidateQueries({ queryKey: ['messages', selectedTenant.user_id] });
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient, selectedTenant, user, isAllowedRole]);

  // Early return AFTER all hooks
  if (!isAllowedRole) {
    return (
      <div className="flex h-[600px] items-center justify-center">
        <div className="p-8 text-center">
          <p className="text-muted-foreground">
            This page is only available to property owners and agents.
          </p>
        </div>
      </div>
    );
  }

  const handleSendMessage = (messageText: string) => {
    if (!messageText.trim() || !selectedTenant || !user) return;

    sendMessageMutation.mutate({
      content: messageText,
      recipientId: selectedTenant.user_id,
      senderId: user.id,
    });
  };

  const formattedConversations: Record<string, UiMessage[]> = {};
  if (selectedTenant && user) {
    formattedConversations[selectedTenant.id] = dbMessages.map((msg) =>
      formatMessage(msg, user.id)
    );
  }

  return (
    <div className="flex h-[600px] flex-col">
      <div className="mb-4 flex gap-4">
        <TenantList
          tenants={tenants}
          selectedTenant={selectedTenant?.id || ''}
          setSelectedTenant={(id) => {
            const tenant = tenants.find((t) => t.id === id);
            setSelectedTenant(tenant || null);
          }}
          isLoading={isLoadingTenants}
        />

        <div className="flex w-2/3 flex-col rounded-md border">
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
            <div className="flex h-full items-center justify-center">
              <div className="p-8 text-center">
                <p className="text-muted-foreground">Select a tenant to start messaging</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
