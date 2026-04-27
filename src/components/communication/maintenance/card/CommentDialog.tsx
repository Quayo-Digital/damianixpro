import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form';
import { supabase } from '@/integrations/supabase/client';
import { MaintenanceUpdate, parseUpdatesFromJson, updatesToJson } from '../maintenance-data';
import { toast } from '@/components/ui/sonner';

const commentSchema = z.object({
  comment: z
    .string()
    .min(3, 'Comment must be at least 3 characters')
    .max(500, 'Comment cannot exceed 500 characters'),
});

type CommentFormValues = z.infer<typeof commentSchema>;

interface CommentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  requestId: string;
  onCommentAdded?: () => void;
}

export function CommentDialog({
  open,
  onOpenChange,
  requestId,
  onCommentAdded,
}: CommentDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<CommentFormValues>({
    resolver: zodResolver(commentSchema),
    defaultValues: {
      comment: '',
    },
  });

  const handleSubmit = async (data) => {
    if (!requestId) {
      console.error('No request ID provided');
      return;
    }

    setIsSubmitting(true);
    try {
      // Create a new update object
      const newUpdate: MaintenanceUpdate = {
        message: data.comment,
        date: new Date().toISOString(),
        created_by: 'tenant', // In a real app, get the current user's role
      };

      // First get the current maintenance request
      const { data: requestData, error: fetchError } = await supabase
        .from('maintenance_requests')
        .select('*')
        .eq('id', requestId)
        .single();

      if (fetchError) throw fetchError;

      // Parse existing updates and add the new one
      const currentUpdates = parseUpdatesFromJson(requestData.updates);
      const updatedUpdates = [...currentUpdates, newUpdate];

      // Update the maintenance request with the new update
      // Convert to JSON before sending to Supabase
      const { error } = await supabase
        .from('maintenance_requests')
        .update({
          updates: updatesToJson(updatedUpdates),
        })
        .eq('id', requestId);

      if (error) throw error;

      toast.success('Comment added successfully');
      form.reset();

      if (onCommentAdded) {
        onCommentAdded();
      }

      onOpenChange(false);
    } catch (error) {
      console.error('Error adding comment:', error);
      toast.error('Failed to add comment. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)}>
            <DialogHeader>
              <DialogTitle>Add Comment</DialogTitle>
              <DialogDescription>
                Add a comment or update to this maintenance request.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <FormField
                control={form.control}
                name="comment"
                render={({ field }) => (
                  <FormItem>
                    <Label htmlFor="comment">Comment</Label>
                    <FormControl>
                      <Textarea
                        id="comment"
                        placeholder="Enter your comment here..."
                        className="min-h-[120px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Submitting...' : 'Submit Comment'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
