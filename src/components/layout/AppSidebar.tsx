import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarFooter,
  useSidebar,
} from '@/components/ui/sidebar';
import { SidebarNav } from './sidebar/SidebarNav';
import { Logo } from '@/components/ui/logo';
import { ThemeToggle } from './ThemeToggle';
import { Link } from 'react-router-dom';
import { useAuthSession } from '@/contexts/auth';
import { getDefaultDashboardPathForRole } from '@/utils/authRedirect';
import type { UserRole } from '@/contexts/auth/types';
import { BrandText } from '@/components/ui/brand-text';

export function AppSidebar() {
  const { state } = useSidebar();
  const isCollapsed = state === 'collapsed';
  const { userRole } = useAuthSession();
  const homeDashboardPath = getDefaultDashboardPathForRole(userRole as UserRole);

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border/80 px-2 py-3">
        <Link
          className="flex min-w-0 flex-1 items-center gap-2 overflow-hidden rounded-lg px-1.5 py-1 outline-none ring-sidebar-ring transition-colors hover:bg-sidebar-accent/80 focus-visible:ring-2"
          to={homeDashboardPath}
        >
          <Logo />
          {!isCollapsed && (
            <BrandText className="truncate text-base font-semibold tracking-tight text-sidebar-foreground" />
          )}
        </Link>
      </SidebarHeader>
      <SidebarContent className="px-2 py-3">
        <SidebarNav isCollapsed={isCollapsed} />
      </SidebarContent>
      <SidebarFooter className="border-t border-sidebar-border/80 p-2">
        <ThemeToggle />
      </SidebarFooter>
    </Sidebar>
  );
}
