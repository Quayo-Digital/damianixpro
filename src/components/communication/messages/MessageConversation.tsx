import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Tenant } from '@/services/messages/types';

export interface Message {
  id: number | string;
  sender: 'manager' | 'tenant';
  text: string;
  timestamp: string;
}

interface MessageConversationProps {
  conversations: Record<string, Message[]>;
  selectedTenant: string;
  tenant?: Tenant;
  isLoading?: boolean;
}

export const MessageConversation = ({
  conversations,
  selectedTenant,
  tenant,
  isLoading,
}: MessageConversationProps) => {
  if (!selectedTenant && !isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="p-8 text-center">
          <p className="text-muted-foreground">Select a tenant to start messaging</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="border-b bg-muted/30 p-4">
        <div className="flex items-center gap-3">
          <Avatar className="h-9 w-9">
            <AvatarFallback className="bg-brand-light text-brand-primary">
              {tenant?.name
                .split(' ')
                .map((n) => n[0])
                .join('') || ''}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="font-medium">{tenant?.name}</p>
            <p className="text-sm text-muted-foreground">{tenant?.property}</p>
          </div>
        </div>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto p-4">
        {isLoading ? (
          <div className="space-y-4">
            <div className="flex justify-end">
              <Skeleton className="h-16 w-3/4 rounded-lg" />
            </div>
            <div className="flex justify-start">
              <Skeleton className="h-20 w-3/4 rounded-lg" />
            </div>
            <div className="flex justify-end">
              <Skeleton className="h-12 w-1/2 rounded-lg" />
            </div>
          </div>
        ) : (
          selectedTenant in conversations &&
          conversations[selectedTenant].map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.sender === 'manager' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-lg p-3 ${
                  msg.sender === 'manager' ? 'bg-brand-primary text-white' : 'border bg-muted'
                }`}
              >
                <p>{msg.text}</p>
                <p
                  className={`mt-1 text-xs ${msg.sender === 'manager' ? 'text-white/70' : 'text-muted-foreground'}`}
                >
                  {msg.timestamp}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </>
  );
};
