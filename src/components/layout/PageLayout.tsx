import React from 'react';
import { Outlet } from 'react-router-dom';
import { SidebarProvider } from '@/components/ui/sidebar';
import { GlobalFooter } from './GlobalFooter';
import { Header } from './Header';
import { AppSidebar } from './AppSidebar';
import { ProactiveHelper } from '@/components/ui/ProactiveHelper';

interface PageLayoutProps {
  children?: React.ReactNode;
}

export function PageLayout({ children }: PageLayoutProps) {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        <AppSidebar />
        <div className="flex flex-1 flex-col overflow-hidden">
          <Header />
          <main className="flex-1 overflow-y-auto bg-secondary/50 p-4 md:p-6">
            {children || <Outlet />}
          </main>
          <GlobalFooter />
        </div>
        <ProactiveHelper />
      </div>
    </SidebarProvider>
  );
}
