import React from 'react';
import { cn } from '@/lib/utils';

type AppContentContainerProps = {
  children: React.ReactNode;
  className?: string;
};

/**
 * Constrains authenticated page width and keeps horizontal alignment consistent with the design system.
 * Used inside {@link PageLayout} `<main>` so all routed pages share the same content column.
 */
export function AppContentContainer({ children, className }: AppContentContainerProps) {
  return (
    <div className={cn('mx-auto w-full max-w-screen-2xl px-4 pb-1 sm:px-6 lg:px-8', className)}>
      {children}
    </div>
  );
}
