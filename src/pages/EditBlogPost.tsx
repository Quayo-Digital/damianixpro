
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { BlogPostForm } from '@/components/blog/BlogPostForm';
import { getBlogPostBySlug } from '@/services/blog/blogData';
import { toast } from 'sonner';

const EditBlogPost = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    if (slug) {
      const blogPost = getBlogPostBySlug(slug);
      if (blogPost) {
        setPost(blogPost);
      } else {
        toast.error('Blog post not found');
        navigate('/blog');
      }
    }
    setLoading(false);
  }, [slug, navigate]);
  
  if (loading) {
    return (
      <div className="container max-w-3xl py-12 flex justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }
  
  if (!post) return null;
  
  return (
    <div className="container max-w-3xl py-12">
      <BlogPostForm post={post} isEditing={true} />
    </div>
  );
};

export default EditBlogPost;
