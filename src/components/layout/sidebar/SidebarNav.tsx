
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/auth';
import { createNavItems } from './navigation-data';
import { NavItem } from './NavItem';

interface SidebarNavProps {
  className?: string;
  isCollapsed: boolean;
}

export function SidebarNav({ className, isCollapsed }: SidebarNavProps) {
  const { userRole, isAdmin, isVendor } = useAuth();

  const navItems = createNavItems(userRole, isAdmin(), isVendor());
  const filteredNavItems = navItems.filter(item => item.isVisible);

  return (
    <div className={cn("flex flex-col py-2 gap-1", className)}>
      {filteredNavItems.map((item, index) => (
        <NavItem key={index} item={item} isCollapsed={isCollapsed} />
      ))}
    </div>
  );
}
