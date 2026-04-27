import { BlogPost } from '@/types/blog';
import { blogPosts } from './blogData';

// Create a new blog post
export const createBlogPost = async (post: BlogPost): Promise<BlogPost> => {
  // In a real application, this would be an API call to save the post to a database
  // For now, we'll just add it to our in-memory array
  blogPosts.unshift(post);
  return post;
};

// Update an existing blog post
export const updateBlogPost = async (post: BlogPost): Promise<BlogPost> => {
  // In a real application, this would be an API call to update the post in a database
  const index = blogPosts.findIndex((p) => p.id === post.id);
  if (index !== -1) {
    blogPosts[index] = post;
  }
  return post;
};

// Delete a blog post
export const deleteBlogPost = async (id: string): Promise<boolean> => {
  // In a real application, this would be an API call to delete the post from a database
  const index = blogPosts.findIndex((p) => p.id === id);
  if (index !== -1) {
    blogPosts.splice(index, 1);
    return true;
  }
  return false;
};
