
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Pencil, Copy, Trash2, FileText } from 'lucide-react';
import { CommunicationTemplate } from '@/utils/communicationTemplates';

interface TemplateCardProps {
  template: CommunicationTemplate;
  onEdit: (template: CommunicationTemplate) => void;
  onDuplicate: (template: CommunicationTemplate) => void;
  onDelete: (template: CommunicationTemplate) => void;
}

export function TemplateCard({ template, onEdit, onDuplicate, onDelete }: TemplateCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
        <div>
          <CardTitle className="text-lg font-bold">{template.title}</CardTitle>
          {template.subject && (
            <p className="text-sm text-muted-foreground mt-1">{template.subject}</p>
          )}
        </div>
        <Badge>{template.category}</Badge>
      </CardHeader>
      <CardContent>
        <p className="text-sm line-clamp-3">{template.body}</p>
      </CardContent>
      <CardFooter className="border-t pt-4 flex justify-between">
        <div className="flex items-center text-sm text-muted-foreground">
          <FileText className="h-4 w-4 mr-2" />
          <span>Template</span>
        </div>
        <div className="flex space-x-2">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => onDuplicate(template)}
          >
            <Copy className="h-4 w-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => onEdit(template)}
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => onDelete(template)}
          >
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}
