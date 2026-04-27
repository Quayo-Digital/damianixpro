import React from 'react';
import { ContextualGuide } from '@/components/ui/ContextualGuide';

interface PageContentProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
}

export function PageContent({ title, description, children, actions }: PageContentProps) {
  return (
    <div className="space-y-6">
      <div className="page-header-shell flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="premium-title text-3xl">{title}</h1>
          {description && <p className="text-muted-foreground">{description}</p>}
        </div>
        {actions && <div className="w-full flex-shrink-0 md:w-auto">{actions}</div>}
      </div>
      <ContextualGuide />
      {children}
    </div>
  );
}
