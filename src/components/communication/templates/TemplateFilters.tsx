
import { useState, useEffect } from 'react';
import {
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { CommunicationTemplate } from '@/utils/communicationTemplates';
import { supabase } from '@/integrations/supabase/client';

interface TemplateFiltersProps {
  filter: CommunicationTemplate['category'] | 'all';
  setFilter: (value: CommunicationTemplate['category'] | 'all') => void;
  onCreateNew: () => void;
}

export function TemplateFilters({ filter, setFilter, onCreateNew }: TemplateFiltersProps) {
  // In a full implementation, we could fetch categories from Supabase
  // This would make the filters dynamic based on what's in the database
  
  /* Example implementation with Supabase:
  const [categories, setCategories] = useState<string[]>(['all']);
  
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const { data, error } = await supabase
          .from('communication_templates')
          .select('category')
          .distinct();
          
        if (error) throw error;
        if (data) {
          const uniqueCategories = ['all', ...data.map(item => item.category)];
          setCategories(uniqueCategories);
        }
      } catch (error) {
        console.error('Error fetching categories:', error);
      }
    };
    
    fetchCategories();
  }, []);
  */

  return (
    <div className="flex justify-between items-center">
      <Select value={filter} onValueChange={(value) => setFilter(value as any)}>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Filter by category" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Categories</SelectItem>
          <SelectItem value="payment">Payment</SelectItem>
          <SelectItem value="maintenance">Maintenance</SelectItem>
          <SelectItem value="announcement">Announcements</SelectItem>
          <SelectItem value="general">General</SelectItem>
        </SelectContent>
      </Select>
      
      <Button onClick={onCreateNew}>
        <Plus className="mr-2 h-4 w-4" />
        New Template
      </Button>
    </div>
  );
}
