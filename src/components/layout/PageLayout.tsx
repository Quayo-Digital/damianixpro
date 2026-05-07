import React from 'react';
import { Outlet } from 'react-router-dom';
import { SidebarProvider } from '@/components/ui/sidebar';
import { GlobalFooter } from './GlobalFooter';
import { Header } from './Header';
import { AppSidebar } from './AppSidebar';
import { ProactiveHelper } from '@/components/ui/ProactiveHelper';
import { AppContentContainer } from './AppContentContainer';

interface PageLayoutProps {
  children?: React.ReactNode;
}

export function PageLayout({ children }: PageLayoutProps) {
  return (
    <SidebarProvider>
      <div className="relative flex min-h-screen w-full bg-background">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[100] focus:rounded-md focus:bg-primary focus:px-4 focus:py-2.5 focus:text-sm focus:font-medium focus:text-primary-foreground focus:shadow-md focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
        >
          Skip to main content
        </a>
        <AppSidebar />
        <div className="flex flex-1 flex-col overflow-hidden">
          <Header />
          <main
            id="main-content"
            tabIndex={-1}
            className="flex-1 overflow-y-auto bg-muted/25 px-4 py-6 outline-none md:px-6 md:py-8 lg:px-8 lg:py-10"
          >
            <AppContentContainer>{children || <Outlet />}</AppContentContainer>
          </main>
          <GlobalFooter />
        </div>
        <ProactiveHelper />
      </div>
    </SidebarProvider>
  );
}
