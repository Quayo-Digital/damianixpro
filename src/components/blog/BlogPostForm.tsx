
import React from 'react';
import { Form } from '@/components/ui/form';
import { BlogPost } from '@/types/blog';
import { BasicInfoFields } from './form/BasicInfoFields';
import { ContentFields } from './form/ContentFields';
import { MetadataFields } from './form/MetadataFields';
import { FormActions } from './form/FormActions';
import { useBlogForm } from './form/useBlogForm';

interface BlogPostFormProps {
  post?: BlogPost;
  isEditing?: boolean;
}

export function BlogPostForm({ post, isEditing = false }: BlogPostFormProps) {
  const { form, onSubmit, isEditing: editing } = useBlogForm({ post, isEditing });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">
          {editing ? 'Edit Blog Post' : 'Create New Blog Post'}
        </h2>
        <p className="text-muted-foreground">
          {editing 
            ? 'Update your blog post with the form below.' 
            : 'Fill out the form below to create a new blog post.'}
        </p>
      </div>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <ContentFields form={form} />
          <BasicInfoFields form={form} />
          <MetadataFields form={form} />
          <FormActions isEditing={editing} />
        </form>
      </Form>
    </div>
  );
}
