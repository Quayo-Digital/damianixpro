import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getBlogPostBySlug, getAllBlogPosts } from '@/services/blog/blogData';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { BlogCardGrid } from '@/components/blog/BlogCardGrid';
import { Button } from '@/components/ui/button';
import { Pencil, Trash } from 'lucide-react';
import { DeleteBlogPostDialog } from '@/components/blog/DeleteBlogPostDialog';
import { sanitizeHtml } from '@/utils/sanitize';

const BlogPost = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const post = slug ? getBlogPostBySlug(slug) : null;
  const relatedPosts = getAllBlogPosts()
    .filter((p) => p.slug !== slug)
    .slice(0, 3);

  useEffect(() => {
    if (!post && slug) {
      navigate('/blog', { replace: true });
    }
  }, [post, slug, navigate]);

  if (!post) {
    return null;
  }

  return (
    <div className="min-h-screen pb-16 pt-8">
      <div className="container max-w-4xl">
        {/* Breadcrumbs and Actions */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center text-sm text-muted-foreground">
            <Link to="/blog" className="hover:text-primary">
              Blog
            </Link>
            <span className="mx-2">/</span>
            <span>{post.title}</span>
          </div>

          <div className="flex gap-2">
            <Button asChild size="sm" variant="outline" className="gap-2">
              <Link to={`/blog/edit/${slug}`}>
                <Pencil size={16} />
                Edit
              </Link>
            </Button>

            <Button
              size="sm"
              variant="outline"
              className="gap-2 text-destructive hover:text-destructive"
              onClick={() => setDeleteDialogOpen(true)}
            >
              <Trash size={16} />
              Delete
            </Button>
          </div>
        </div>

        {/* Article Header */}
        <h1 className="mb-4 text-3xl font-bold tracking-tight md:text-4xl lg:text-5xl">
          {post.title}
        </h1>

        <div className="mb-8 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
          <span>By {post.author}</span>
          <span>•</span>
          <span>{post.publishedDate}</span>
          <span>•</span>
          <span>{post.readTime}</span>
        </div>

        {/* Cover Image */}
        <div className="mb-8">
          <AspectRatio ratio={16 / 9}>
            <img
              src={post.coverImage}
              alt={post.title}
              className="h-full w-full rounded-lg object-cover"
            />
          </AspectRatio>
        </div>

        {/* Article Content */}
        <div className="prose prose-lg max-w-none">
          <div
            dangerouslySetInnerHTML={{ __html: sanitizeHtml(post.content.replace(/\n/g, '<br>')) }}
          />
        </div>

        {/* Tags */}
        <div className="mt-8 flex flex-wrap gap-2">
          {post.tags.map((tag, index) => (
            <Link
              key={index}
              to={`/blog/tag/${tag.toLowerCase().replace(/\s+/g, '-')}`}
              className="rounded-full bg-secondary px-3 py-1 text-sm transition-colors hover:bg-secondary/80"
            >
              {tag}
            </Link>
          ))}
        </div>
      </div>

      {/* Related Articles */}
      <div className="container mt-16 max-w-5xl">
        <h2 className="mb-8 text-2xl font-bold">Related Articles</h2>
        <BlogCardGrid posts={relatedPosts} featuredPost={false} />
      </div>

      <DeleteBlogPostDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        postId={post.id}
        postTitle={post.title}
      />
    </div>
  );
};

export default BlogPost;
