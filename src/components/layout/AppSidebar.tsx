import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarFooter,
  useSidebar,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import { SidebarNav } from './sidebar/SidebarNav';
import { Logo } from '@/components/ui/logo';
import { UserNav } from './UserNav';
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
    <Sidebar>
      <SidebarHeader className="justify-between">
        <Link className="flex flex-1 items-center gap-2" to={homeDashboardPath}>
          <Logo />
          {!isCollapsed && <BrandText className="whitespace-nowrap text-xl font-bold" />}
        </Link>
        <div className="hidden md:block">
          <SidebarTrigger />
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarNav isCollapsed={isCollapsed} />
      </SidebarContent>
      <SidebarFooter className="flex flex-col items-stretch gap-2">
        <ThemeToggle />
        <UserNav />
      </SidebarFooter>
    </Sidebar>
  );
}
