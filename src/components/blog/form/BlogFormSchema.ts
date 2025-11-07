
import * as z from 'zod';

export const blogFormSchema = z.object({
  title: z.string().min(5, {
    message: 'Title must be at least 5 characters.',
  }),
  excerpt: z.string().min(10, {
    message: 'Excerpt must be at least 10 characters.',
  }),
  content: z.string().min(50, {
    message: 'Content must be at least 50 characters.',
  }),
  author: z.string().min(2, {
    message: 'Author name is required.',
  }),
  coverImage: z.string().url({
    message: 'Please provide a valid URL for the cover image.',
  }),
  tags: z.string(),
  readTime: z.string(),
});

export type BlogFormValues = z.infer<typeof blogFormSchema>;
