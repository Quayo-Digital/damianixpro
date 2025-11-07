
import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getBlogPostBySlug, getAllBlogPosts } from '@/services/blog/blogData';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { BlogCardGrid } from '@/components/blog/BlogCardGrid';
import { Button } from '@/components/ui/button';
import { Pencil, Trash } from 'lucide-react';
import { DeleteBlogPostDialog } from '@/components/blog/DeleteBlogPostDialog';

const BlogPost = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  
  const post = slug ? getBlogPostBySlug(slug) : null;
  const relatedPosts = getAllBlogPosts().filter(p => p.slug !== slug).slice(0, 3);
  
  useEffect(() => {
    if (!post && slug) {
      navigate('/blog', { replace: true });
    }
  }, [post, slug, navigate]);
  
  if (!post) {
    return null;
  }
  
  return (
    <div className="min-h-screen pt-8 pb-16">
      <div className="container max-w-4xl">
        {/* Breadcrumbs and Actions */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center text-sm text-muted-foreground">
            <Link to="/blog" className="hover:text-primary">Blog</Link>
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
        <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight mb-4">
          {post.title}
        </h1>
        
        <div className="flex flex-wrap items-center gap-3 mb-8 text-sm text-muted-foreground">
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
              className="object-cover rounded-lg w-full h-full"
            />
          </AspectRatio>
        </div>
        
        {/* Article Content */}
        <div className="prose prose-lg max-w-none">
          <div dangerouslySetInnerHTML={{ __html: post.content.replace(/\n/g, '<br>') }} />
        </div>
        
        {/* Tags */}
        <div className="mt-8 flex flex-wrap gap-2">
          {post.tags.map((tag, index) => (
            <Link 
              key={index} 
              to={`/blog/tag/${tag.toLowerCase().replace(/\s+/g, '-')}`}
              className="text-sm px-3 py-1 bg-secondary rounded-full hover:bg-secondary/80 transition-colors"
            >
              {tag}
            </Link>
          ))}
        </div>
      </div>
      
      {/* Related Articles */}
      <div className="container max-w-5xl mt-16">
        <h2 className="text-2xl font-bold mb-8">Related Articles</h2>
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
