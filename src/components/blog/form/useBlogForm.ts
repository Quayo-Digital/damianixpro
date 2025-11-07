
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { BlogPost } from '@/types/blog';
import { createBlogPost, updateBlogPost } from '@/services/blog/blogService';
import { blogFormSchema, BlogFormValues } from './BlogFormSchema';

interface UseBlogFormProps {
  post?: BlogPost;
  isEditing?: boolean;
}

export const useBlogForm = ({ post, isEditing = false }: UseBlogFormProps) => {
  const navigate = useNavigate();
  
  // Format the default values correctly, handling the tags array
  const defaultValues: BlogFormValues = post ? {
    title: post.title,
    excerpt: post.excerpt,
    content: post.content,
    author: post.author,
    coverImage: post.coverImage,
    tags: post.tags.join(', '),
    readTime: post.readTime,
  } : {
    title: '',
    excerpt: '',
    content: '',
    author: '',
    coverImage: '',
    tags: '',
    readTime: '3 min read',
  };

  const form = useForm<BlogFormValues>({
    resolver: zodResolver(blogFormSchema),
    defaultValues,
  });

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^\w\s]/gi, '')
      .replace(/\s+/g, '-');
  };

  const onSubmit = async (values: BlogFormValues) => {
    try {
      const tagsArray = typeof values.tags === 'string' 
        ? values.tags.split(',').map(tag => tag.trim()) 
        : values.tags;
        
      if (isEditing && post) {
        await updateBlogPost({
          id: post.id,
          slug: post.slug || generateSlug(values.title),
          title: values.title,
          excerpt: values.excerpt,
          content: values.content,
          author: values.author,
          coverImage: values.coverImage,
          tags: tagsArray,
          readTime: values.readTime,
          publishedDate: post.publishedDate || new Date().toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          }),
        });
        toast.success('Blog post updated successfully!');
      } else {
        await createBlogPost({
          id: crypto.randomUUID(),
          slug: generateSlug(values.title),
          title: values.title,
          excerpt: values.excerpt,
          content: values.content,
          author: values.author,
          coverImage: values.coverImage,
          tags: tagsArray,
          readTime: values.readTime,
          publishedDate: new Date().toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          }),
        });
        toast.success('Blog post created successfully!');
      }
      navigate('/blog');
    } catch (error) {
      console.error('Error saving blog post:', error);
      toast.error('Failed to save blog post. Please try again.');
    }
  };

  return {
    form,
    onSubmit,
    isEditing
  };
};
