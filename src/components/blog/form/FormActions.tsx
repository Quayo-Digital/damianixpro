
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';

interface FormActionsProps {
  isEditing: boolean;
}

export const FormActions = ({ isEditing }: FormActionsProps) => {
  const navigate = useNavigate();
  
  return (
    <div className="flex items-center justify-end gap-4">
      <Button 
        type="button" 
        variant="outline" 
        onClick={() => navigate('/blog')}
      >
        Cancel
      </Button>
      <Button type="submit">
        {isEditing ? 'Update Post' : 'Create Post'}
      </Button>
    </div>
  );
};
