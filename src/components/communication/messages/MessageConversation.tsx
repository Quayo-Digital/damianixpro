
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
  isLoading
}: MessageConversationProps) => {
  if (!selectedTenant && !isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center p-8">
          <p className="text-muted-foreground">Select a tenant to start messaging</p>
        </div>
      </div>
    );
  }
  
  return (
    <>
      <div className="p-4 border-b bg-muted/30">
        <div className="flex items-center gap-3">
          <Avatar className="h-9 w-9">
            <AvatarFallback className="bg-brand-light text-brand-primary">
              {tenant?.name.split(' ').map(n => n[0]).join('') || ''}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="font-medium">{tenant?.name}</p>
            <p className="text-sm text-muted-foreground">{tenant?.property}</p>
          </div>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
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
        ) : (selectedTenant in conversations && conversations[selectedTenant].map((msg) => (
          <div 
            key={msg.id} 
            className={`flex ${msg.sender === 'manager' ? 'justify-end' : 'justify-start'}`}
          >
            <div 
              className={`max-w-[80%] p-3 rounded-lg ${
                msg.sender === 'manager' 
                  ? 'bg-brand-primary text-white' 
                  : 'bg-muted border'
              }`}
            >
              <p>{msg.text}</p>
              <p className={`text-xs mt-1 ${msg.sender === 'manager' ? 'text-white/70' : 'text-muted-foreground'}`}>
                {msg.timestamp}
              </p>
            </div>
          </div>
        )))}
      </div>
    </>
  );
};
