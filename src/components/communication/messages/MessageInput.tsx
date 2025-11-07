
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { SendHorizontal, FileText } from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { CommunicationTemplate, communicationTemplates, getTemplateById } from '@/utils/communicationTemplates';
import { Tenant } from '@/services/messages/types';

interface MessageInputProps {
  selectedTenant: string;
  tenant?: Tenant;
  onSendMessage: (message: string) => void;
  disabled?: boolean;
}

export const MessageInput = ({ selectedTenant, tenant, onSendMessage, disabled }: MessageInputProps) => {
  const { toast } = useToast();
  const [message, setMessage] = useState<string>('');
  const [templateSelectorOpen, setTemplateSelectorOpen] = useState(false);

  const handleSendMessage = () => {
    if (!message.trim() || !selectedTenant) return;
    
    onSendMessage(message);
    setMessage('');
  };

  const applyTemplate = (templateId: string) => {
    const template = getTemplateById(templateId);
    if (template && selectedTenant) {
      const tenantName = tenant?.name || "Tenant";
      let customizedMessage = template.body
        .replace("[Tenant Name]", tenantName)
        .replace("[Property Manager]", "Property Manager");
      
      setMessage(customizedMessage);
      setTemplateSelectorOpen(false);
      
      toast({
        title: "Template Applied",
        description: `${template.title} template has been applied.`,
      });
    }
  };
  
  return (
    <div className="p-4 border-t">
      <div className="flex gap-2 mb-2">
        <Popover open={templateSelectorOpen} onOpenChange={setTemplateSelectorOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm">
              <FileText className="h-4 w-4 mr-2" /> Templates
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-96 p-0" align="start">
            <div className="p-4 border-b">
              <h4 className="text-sm font-medium">Message Templates</h4>
              <p className="text-xs text-muted-foreground mt-1">
                Select a template to quickly insert a pre-written message
              </p>
            </div>
            <div className="max-h-[300px] overflow-y-auto">
              {communicationTemplates.map((template) => (
                <div
                  key={template.id}
                  className="p-3 hover:bg-muted cursor-pointer border-b last:border-0"
                  onClick={() => applyTemplate(template.id)}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{template.title}</span>
                    <Badge variant="outline" className="text-xs">
                      {template.category}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                    {template.body.substring(0, 80)}...
                  </p>
                </div>
              ))}
            </div>
          </PopoverContent>
        </Popover>
      </div>
      <div className="flex gap-2">
        <Input 
          placeholder="Type your message..." 
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSendMessage();
            }
          }}
          className="min-h-[80px] resize-none"
        />
        <Button onClick={handleSendMessage} disabled={!message.trim() || disabled}>
          <SendHorizontal className="h-4 w-4 mr-2" /> Send
        </Button>
      </div>
    </div>
  );
};
