
import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';

export function BlogHeader() {
  return (
    <div className="bg-muted py-16">
      <div className="container max-w-5xl">
        <div className="text-center space-y-6">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
            Property Management Blog
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Expert insights and advice for property owners, managers, and tenants
          </p>
          <div className="flex flex-wrap gap-4 justify-center pt-4">
            <Button asChild variant="default">
              <Link to="/blog/category/property-management">
                Property Management
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/blog/category/tenant-tips">
                Tenant Tips
              </Link>
            </Button>
            <Button asChild variant="default" className="gap-2">
              <Link to="/blog/new">
                <PlusCircle size={18} />
                Create Post
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
