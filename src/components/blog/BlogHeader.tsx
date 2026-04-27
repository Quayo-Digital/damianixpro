import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import { useAuthSession } from '@/contexts/auth';

export function BlogHeader() {
  const { userRole } = useAuthSession();
  const canEditBlog = userRole === 'admin' || userRole === 'super_admin';

  return (
    <div className="bg-muted py-16">
      <div className="container max-w-5xl">
        <div className="space-y-6 text-center">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
            Property Management Blog
          </h1>
          <p className="mx-auto max-w-3xl text-xl text-muted-foreground">
            Expert insights and advice for property owners, managers, and tenants
          </p>
          <div className="flex flex-wrap justify-center gap-4 pt-4">
            <Button asChild variant="default">
              <Link to="/blog/category/property-management">Property Management</Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/blog/category/tenant-tips">Tenant Tips</Link>
            </Button>
            {canEditBlog ? (
              <Button asChild variant="default" className="gap-2">
                <Link to="/blog/new">
                  <PlusCircle size={18} />
                  Create Post
                </Link>
              </Button>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
