
import React from 'react';
import { Link } from 'react-router-dom';
import { DocGenerator } from '@/components/documentation/DocGenerator';
import { GlobalFooter } from '@/components/layout/GlobalFooter';
import { Home } from 'lucide-react';
import { Button } from '@/components/ui/button';

const PublicDocumentation = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <div className="flex-grow">
        {/* Home link navigation */}
        <div className="bg-muted/40 border-b">
          <div className="container py-2 max-w-7xl mx-auto">
            <Link to="/">
              <Button variant="ghost" size="sm" className="flex items-center gap-1">
                <Home className="h-4 w-4" />
                <span>Back to Home</span>
              </Button>
            </Link>
          </div>
        </div>

        <div className="container py-8 max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-2">DamianixPro Documentation</h1>
            <p className="text-lg text-muted-foreground">
              Find comprehensive guides for all user roles and features of the DamianixPro platform.
            </p>
          </div>
          
          <DocGenerator />
        </div>
      </div>
      <GlobalFooter />
    </div>
  );
};

export default PublicDocumentation;
