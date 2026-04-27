import { cn } from '@/lib/utils';
import { useAuthSession } from '@/contexts/auth';
import { createNavItems } from './navigation-data';
import { NavItem } from './NavItem';

interface SidebarNavProps {
  className?: string;
  isCollapsed: boolean;
}

export function SidebarNav({ className, isCollapsed }: SidebarNavProps) {
  const { userRole, isAdmin, isVendor } = useAuthSession();

  const navItems = createNavItems(userRole, isAdmin(), isVendor());
  const filteredNavItems = navItems.filter((item) => item.isVisible);

  return (
    <div className={cn('flex flex-col gap-1 py-2', className)}>
      {filteredNavItems.map((item, index) => (
        <NavItem key={index} item={item} isCollapsed={isCollapsed} />
      ))}
    </div>
  );
}
