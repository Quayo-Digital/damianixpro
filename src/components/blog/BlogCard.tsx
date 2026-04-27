import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { BlogPost } from '@/types/blog';
import { cn } from '@/lib/utils';

interface BlogCardProps {
  post: BlogPost;
  className?: string;
  featured?: boolean;
}

export function BlogCard({ post, className, featured = false }: BlogCardProps) {
  return (
    <Card
      className={cn(
        'overflow-hidden transition-all hover:shadow-md',
        featured ? 'md:grid md:grid-cols-2 md:items-stretch' : '',
        className
      )}
    >
      <div className={cn('relative', featured ? '' : '')}>
        <Link to={`/blog/${post.slug}`}>
          <AspectRatio ratio={16 / 9}>
            <img
              src={post.coverImage}
              alt={post.title}
              className="h-full w-full rounded-t-lg object-cover"
            />
          </AspectRatio>
        </Link>
      </div>
      <div className="flex h-full flex-col">
        <CardHeader className="p-4 pb-2">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>{post.publishedDate}</span>
              <span>•</span>
              <span>{post.readTime}</span>
            </div>
            <Link to={`/blog/${post.slug}`} className="hover:underline">
              <h3
                className={cn(
                  'line-clamp-2 font-semibold text-foreground hover:text-primary',
                  featured ? 'text-2xl' : 'text-lg'
                )}
              >
                {post.title}
              </h3>
            </Link>
          </div>
        </CardHeader>
        <CardContent className="flex-1 p-4 pt-0">
          <p className={cn('text-muted-foreground', featured ? 'line-clamp-3' : 'line-clamp-2')}>
            {post.excerpt}
          </p>
        </CardContent>
        <CardFooter className="flex items-center gap-2 p-4 pt-0">
          <div className="flex flex-wrap gap-2">
            {post.tags.slice(0, 2).map((tag, index) => (
              <Link
                key={index}
                to={`/blog/tag/${tag.toLowerCase().replace(/\s+/g, '-')}`}
                className="rounded-full bg-secondary px-2 py-1 text-xs transition-colors hover:bg-secondary/80"
              >
                {tag}
              </Link>
            ))}
          </div>
          <div className="ml-auto text-sm text-muted-foreground">By {post.author}</div>
        </CardFooter>
      </div>
    </Card>
  );
}
