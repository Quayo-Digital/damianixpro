
import React from 'react';
import { Toaster } from '@/components/ui/sonner';
import AppRoutes from './App.routes';

export function AppContent() {
  return (
    <div className="min-h-screen bg-background">
      <Toaster richColors />
      <AppRoutes />
    </div>
  );
}
