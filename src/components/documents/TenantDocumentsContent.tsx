import { useState } from 'react';
import { TenantDocumentsView } from './TenantDocumentsView';
import { TooltipProvider } from '@/components/ui/tooltip';

export function TenantDocumentsContent() {
  return (
    <TooltipProvider>
      <div className="space-y-6">
        <TenantDocumentsView />
      </div>
    </TooltipProvider>
  );
}
