
import React from 'react';

interface PageContentProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
}

export function PageContent({ title, description, children, actions }: PageContentProps) {
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">{title}</h1>
          {description && <p className="text-muted-foreground">{description}</p>}
        </div>
        {actions && <div className="flex-shrink-0 w-full md:w-auto">{actions}</div>}
      </div>
      {children}
    </div>
  );
}
