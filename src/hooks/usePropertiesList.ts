import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

const fetchPropertiesList = async () => {
  const { data, error } = await supabase.from('properties').select('id, name');

  if (error) {
    console.error('Error fetching properties list:', error);
    throw new Error('Failed to fetch properties list');
  }

  return data;
};

export const usePropertiesList = () => {
  return useQuery({
    queryKey: ['propertiesList'],
    queryFn: fetchPropertiesList,
  });
};
