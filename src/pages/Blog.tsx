
import React from 'react';
import { Link } from 'react-router-dom';
import { BlogHeader } from '@/components/blog/BlogHeader';
import { BlogCardGrid } from '@/components/blog/BlogCardGrid';
import { getAllBlogPosts } from '@/services/blog/blogData';
import { GlobalFooter } from '@/components/layout/GlobalFooter';
import { Home } from 'lucide-react';
import { Button } from '@/components/ui/button';

const Blog = () => {
  const allPosts = getAllBlogPosts();
  
  return (
    <div className="min-h-screen flex flex-col">
      <div className="flex-grow">
        {/* Home link navigation */}
        <div className="bg-muted/40 border-b">
          <div className="container py-2 max-w-5xl">
            <Link to="/">
              <Button variant="ghost" size="sm" className="flex items-center gap-1">
                <Home className="h-4 w-4" />
                <span>Back to Home</span>
              </Button>
            </Link>
          </div>
        </div>

        <BlogHeader />
        <div className="container py-12 max-w-5xl">
          <h2 className="text-3xl font-bold mb-8">Latest Articles</h2>
          <BlogCardGrid posts={allPosts} />
        </div>
      </div>
      <GlobalFooter />
    </div>
  );
};

export default Blog;
