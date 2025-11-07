
import React from 'react';
import { Outlet } from 'react-router-dom';
import { SidebarProvider } from '@/components/ui/sidebar';
import { GlobalFooter } from './GlobalFooter';
import { Header } from './Header';
import { AppSidebar } from './AppSidebar';

interface PageLayoutProps {
  children?: React.ReactNode;
}

export function PageLayout({ children }: PageLayoutProps) {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        <AppSidebar />
        <div className="flex flex-col flex-1 overflow-hidden">
          <Header />
          <main className="flex-1 p-4 md:p-6 bg-secondary/50 overflow-y-auto">
            {children || <Outlet />}
          </main>
          <GlobalFooter />
        </div>
      </div>
    </SidebarProvider>
  );
}
