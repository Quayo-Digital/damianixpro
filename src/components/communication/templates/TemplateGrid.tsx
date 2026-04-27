import { useState, useEffect } from 'react';
import { CommunicationTemplate } from '@/utils/communicationTemplates';
import { TemplateCard } from './TemplateCard';
import { supabase } from '@/integrations/supabase/client';

interface TemplateGridProps {
  templates: CommunicationTemplate[];
  onEdit: (template: CommunicationTemplate) => void;
  onDuplicate: (template: CommunicationTemplate) => void;
  onDelete: (template: CommunicationTemplate) => void;
}

export function TemplateGrid({ templates, onEdit, onDuplicate, onDelete }: TemplateGridProps) {
  // In a full implementation, this component would fetch templates from Supabase
  // We're keeping the current implementation for now to avoid breaking changes
  // Example of how we'd fetch from Supabase:
  /*
  const [loadedTemplates, setLoadedTemplates] = useState<CommunicationTemplate[]>([]);
  const [loading, setLoading] = useState(false);
  
  useEffect(() => {
    const fetchTemplates = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('communication_templates')
          .select('*');
          
        if (error) throw error;
        setLoadedTemplates(data || []);
      } catch (error) {
        console.error('Error fetching templates:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchTemplates();
  }, []);
  */

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      {templates.map((template) => (
        <TemplateCard
          key={template.id}
          template={template}
          onEdit={onEdit}
          onDuplicate={onDuplicate}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}
