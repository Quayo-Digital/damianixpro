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
    <div className="flex min-h-screen flex-col">
      <div className="flex-grow">
        {/* Home link navigation */}
        <div className="border-b bg-muted/40">
          <div className="container max-w-5xl py-2">
            <Link to="/">
              <Button variant="ghost" size="sm" className="flex items-center gap-1">
                <Home className="h-4 w-4" />
                <span>Back to Home</span>
              </Button>
            </Link>
          </div>
        </div>

        <BlogHeader />
        <div className="container max-w-5xl py-12">
          <h2 className="mb-8 text-3xl font-bold">Latest Articles</h2>
          <BlogCardGrid posts={allPosts} />
        </div>
      </div>
      <GlobalFooter />
    </div>
  );
};

export default Blog;
