import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { CommunicationTemplate, communicationTemplates } from '@/utils/communicationTemplates';
import { TemplateFilters } from './templates/TemplateFilters';
import { TemplateGrid } from './templates/TemplateGrid';
import { TemplateDialog } from './templates/TemplateDialog';

export function TemplatesManager() {
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<CommunicationTemplate | null>(null);
  const [filter, setFilter] = useState<CommunicationTemplate['category'] | 'all'>('all');

  const filteredTemplates =
    filter === 'all'
      ? communicationTemplates
      : communicationTemplates.filter((t) => t.category === filter);

  const handleOpenDialog = (template?: CommunicationTemplate) => {
    if (template) {
      setEditingTemplate(template);
    } else {
      setEditingTemplate(null);
    }
    setDialogOpen(true);
  };

  const handleSaveTemplate = (templateData: {
    title: string;
    subject: string;
    body: string;
    category: CommunicationTemplate['category'];
  }) => {
    // In a real implementation, this would save to a database
    toast({
      title: editingTemplate ? 'Template Updated' : 'Template Created',
      description: `The template "${templateData.title}" has been ${editingTemplate ? 'updated' : 'created'} successfully.`,
    });

    setDialogOpen(false);
  };

  const handleDuplicateTemplate = (template: CommunicationTemplate) => {
    toast({
      title: 'Template Duplicated',
      description: `A copy of "${template.title}" has been created.`,
    });
  };

  const handleDeleteTemplate = (template: CommunicationTemplate) => {
    toast({
      title: 'Template Deleted',
      description: `The template "${template.title}" has been deleted.`,
    });
  };

  return (
    <div className="space-y-6">
      <TemplateFilters
        filter={filter}
        setFilter={setFilter}
        onCreateNew={() => handleOpenDialog()}
      />

      <TemplateGrid
        templates={filteredTemplates}
        onEdit={handleOpenDialog}
        onDuplicate={handleDuplicateTemplate}
        onDelete={handleDeleteTemplate}
      />

      <TemplateDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        editingTemplate={editingTemplate}
        onSave={handleSaveTemplate}
      />
    </div>
  );
}
