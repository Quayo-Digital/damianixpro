import React from 'react';
import { BlogPost } from '@/types/blog';
import { BlogCard } from './BlogCard';

interface BlogCardGridProps {
  posts: BlogPost[];
  featuredPost?: boolean;
}

export function BlogCardGrid({ posts, featuredPost = true }: BlogCardGridProps) {
  if (posts.length === 0) {
    return (
      <div className="py-12 text-center">
        <h3 className="text-xl font-medium text-muted-foreground">No posts found</h3>
      </div>
    );
  }

  const [firstPost, ...remainingPosts] = posts;

  return (
    <div className="space-y-8">
      {featuredPost && firstPost && <BlogCard post={firstPost} featured />}

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {(featuredPost ? remainingPosts : posts).map((post) => (
          <BlogCard key={post.id} post={post} />
        ))}
      </div>
    </div>
  );
}
