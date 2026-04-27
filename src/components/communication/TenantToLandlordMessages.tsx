import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { useAuthSession } from '@/contexts/auth';
import { supabase } from '@/integrations/supabase/client';
import { TenantList } from './messages/TenantList';
import { MessageConversation, Message as UiMessage } from './messages/MessageConversation';
import { MessageInput } from './messages/MessageInput';
import { fetchLandlordsAgents, fetchMessages, sendMessage } from '@/services/messages/messageApi';
import { LandlordAgent, Message as DbMessage } from '@/services/messages/types';
import { Badge } from '@/components/ui/badge';
import { Building2, User } from 'lucide-react';

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

// Custom list component for landlords/agents
const LandlordAgentList = ({
  landlordsAgents,
  selectedId,
  onSelect,
  isLoading,
}: {
  landlordsAgents: LandlordAgent[];
  selectedId: string;
  onSelect: (id: string) => void;
  isLoading: boolean;
}) => {
  if (isLoading) {
    return (
      <div className="w-1/3 rounded-md border p-4">
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 animate-pulse rounded bg-gray-200" />
          ))}
        </div>
      </div>
    );
  }

  if (landlordsAgents.length === 0) {
    return (
      <div className="w-1/3 rounded-md border p-4">
        <div className="py-8 text-center text-muted-foreground">
          <p>No landlords or agents found.</p>
          <p className="mt-2 text-sm">You need an active lease to message property owners.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-1/3 overflow-y-auto rounded-md border">
      <div className="border-b bg-muted/30 p-4">
        <h3 className="font-semibold">Your Contacts</h3>
        <p className="text-sm text-muted-foreground">Landlords & Agents</p>
      </div>
      <div className="divide-y">
        {landlordsAgents.map((contact) => (
          <button
            key={contact.id}
            onClick={() => onSelect(contact.id)}
            className={`w-full p-4 text-left transition-colors hover:bg-muted/50 ${
              selectedId === contact.id ? 'bg-muted' : ''
            }`}
          >
            <div className="flex items-start gap-3">
              <div
                className={`rounded-full p-2 ${
                  contact.role === 'owner'
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-green-100 text-green-700'
                }`}
              >
                {contact.role === 'owner' ? (
                  <Building2 className="h-4 w-4" />
                ) : (
                  <User className="h-4 w-4" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="mb-1 flex items-center gap-2">
                  <p className="truncate font-medium">{contact.name}</p>
                  <Badge
                    variant={contact.role === 'owner' ? 'default' : 'secondary'}
                    className="text-xs"
                  >
                    {contact.role === 'owner' ? 'Owner' : 'Agent'}
                  </Badge>
                </div>
                <p className="truncate text-sm text-muted-foreground">{contact.property}</p>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export function TenantToLandlordMessages() {
  const { toast } = useToast();
  const { user } = useAuthSession();
  const queryClient = useQueryClient();
  const [selectedContact, setSelectedContact] = useState<LandlordAgent | null>(null);

  // Fetch landlords/agents for this tenant
  const { data: landlordsAgents = [], isLoading: isLoadingContacts } = useQuery<LandlordAgent[]>({
    queryKey: ['landlordsAgents', user?.id],
    queryFn: () => {
      if (!user?.id) return Promise.resolve([]);
      return fetchLandlordsAgents(user.id);
    },
    enabled: !!user?.id,
  });

  // Fetch messages between tenant and selected landlord/agent
  const { data: dbMessages = [], isLoading: isLoadingMessages } = useQuery<DbMessage[]>({
    queryKey: ['messages', selectedContact?.id, user?.id],
    queryFn: () => {
      if (!selectedContact?.id || !user?.id) return Promise.resolve([]);
      return fetchMessages(user.id, selectedContact.id);
    },
    enabled: !!selectedContact?.id && !!user?.id,
  });

  const sendMessageMutation = useMutation({
    mutationFn: sendMessage,
    onSuccess: () => {
      const contactName = selectedContact?.name || 'contact';
      toast({
        title: 'Message Sent',
        description: `Your message to ${contactName} has been sent.`,
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

  const handleSendMessage = (messageText: string) => {
    if (!messageText.trim() || !selectedContact || !user) return;

    // Validate: tenant can only message landlords/agents
    if (selectedContact.role !== 'owner' && selectedContact.role !== 'agent') {
      toast({
        title: 'Invalid Recipient',
        description: 'You can only message property owners or agents.',
        variant: 'destructive',
      });
      return;
    }

    sendMessageMutation.mutate({
      content: messageText,
      recipientId: selectedContact.id,
      senderId: user.id,
    });
  };

  // Real-time subscription for new messages
  useEffect(() => {
    if (!selectedContact || !user) return;

    const channel = supabase
      .channel('public:messages')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, (payload) => {
        const newMessage = payload.new as DbMessage;
        if (
          (newMessage.sender_id === user.id && newMessage.recipient_id === selectedContact.id) ||
          (newMessage.sender_id === selectedContact.id && newMessage.recipient_id === user.id)
        ) {
          queryClient.invalidateQueries({ queryKey: ['messages', selectedContact.id, user.id] });
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient, selectedContact, user]);

  // Format messages for display
  const formattedConversations: Record<string, UiMessage[]> = {};
  if (selectedContact && user) {
    formattedConversations[selectedContact.id] = dbMessages.map((msg) =>
      formatMessage(msg, user.id)
    );
  }

  return (
    <div className="flex h-[600px] flex-col">
      <div className="mb-4 flex gap-4">
        <LandlordAgentList
          landlordsAgents={landlordsAgents}
          selectedId={selectedContact?.id || ''}
          onSelect={(id) => {
            const contact = landlordsAgents.find((c) => c.id === id);
            setSelectedContact(contact || null);
          }}
          isLoading={isLoadingContacts}
        />

        <div className="flex w-2/3 flex-col rounded-md border">
          {selectedContact ? (
            <>
              <MessageConversation
                conversations={formattedConversations}
                selectedTenant={selectedContact.id}
                tenant={{
                  id: selectedContact.id,
                  user_id: selectedContact.user_id,
                  name: selectedContact.name,
                  property: selectedContact.property,
                  property_id: selectedContact.property_id,
                }}
                isLoading={isLoadingMessages}
              />

              <MessageInput
                selectedTenant={selectedContact.id}
                tenant={{
                  id: selectedContact.id,
                  user_id: selectedContact.user_id,
                  name: selectedContact.name,
                  property: selectedContact.property,
                  property_id: selectedContact.property_id,
                }}
                onSendMessage={handleSendMessage}
                disabled={sendMessageMutation.isPending}
              />
            </>
          ) : (
            <div className="flex h-full items-center justify-center">
              <div className="p-8 text-center">
                <p className="text-muted-foreground">
                  Select a landlord or agent to start messaging
                </p>
                {landlordsAgents.length === 0 && (
                  <p className="mt-2 text-sm text-muted-foreground">
                    You need an active lease to message property owners or agents.
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
