import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { CommunicationTemplate } from '@/utils/communicationTemplates';

interface TemplateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingTemplate: CommunicationTemplate | null;
  onSave: (templateData: {
    title: string;
    subject: string;
    body: string;
    category: CommunicationTemplate['category'];
  }) => void;
}

export function TemplateDialog({
  open,
  onOpenChange,
  editingTemplate,
  onSave,
}: TemplateDialogProps) {
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [category, setCategory] = useState<CommunicationTemplate['category']>('general');

  // Reset form when dialog opens with a template or empty
  useEffect(() => {
    if (open) {
      if (editingTemplate) {
        setTitle(editingTemplate.title);
        setSubject(editingTemplate.subject || '');
        setBody(editingTemplate.body);
        setCategory(editingTemplate.category);
      } else {
        setTitle('');
        setSubject('');
        setBody('');
        setCategory('general');
      }
    }
  }, [open, editingTemplate]);

  const handleSave = () => {
    onSave({
      title,
      subject,
      body,
      category,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{editingTemplate ? 'Edit Template' : 'Create New Template'}</DialogTitle>
          <DialogDescription>
            {editingTemplate
              ? 'Update the template details below.'
              : 'Create a reusable communication template for tenant communications.'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Title</label>
            <Input
              placeholder="Enter template title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Subject (Optional)</label>
            <Input
              placeholder="Enter email subject line"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              This will be used as the subject line for email communications
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Message Body</label>
            <Textarea
              placeholder="Enter template message"
              className="min-h-[150px]"
              value={body}
              onChange={(e) => setBody(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Use placeholder tags like [Tenant Name], [Amount], [Due Date], etc. These will be
              replaced with actual values when using the template.
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Category</label>
            <Select
              value={category}
              onValueChange={(value) => setCategory(value as CommunicationTemplate['category'])}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="payment">Payment</SelectItem>
                <SelectItem value="maintenance">Maintenance</SelectItem>
                <SelectItem value="announcement">Announcement</SelectItem>
                <SelectItem value="general">General</SelectItem>
                <SelectItem value="onboarding">Onboarding</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!title || !body}>
            {editingTemplate ? 'Update Template' : 'Save Template'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
