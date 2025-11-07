
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import type { NavItem as NavItemType } from './nav-config';
import { isNavItemActive } from './navigation-utils';

interface NavItemProps {
  item: NavItemType;
  isCollapsed: boolean;
}

export function NavItem({ item, isCollapsed }: NavItemProps) {
  const location = useLocation();
  
  const isActive = item.isActive 
    ? item.isActive(location.pathname) 
    : isNavItemActive(location.pathname, item.href);

  return (
    <div>
      <Button
        variant={isActive ? "secondary" : "ghost"}
        className={cn(
          "justify-start gap-2", 
          isCollapsed ? "w-10 h-10 p-0 justify-center" : "w-full"
        )}
        asChild
      >
        <Link to={item.href}>
          {item.icon}
          {!isCollapsed && <span className="ml-2">{item.title}</span>}
        </Link>
      </Button>

      {/* Render sub-items if any */}
      {!isCollapsed && item.children && item.children.length > 0 && isActive && (
        <div className="pl-4 flex flex-col gap-1 mt-1 mb-1">
          {item.children.filter(child => child.isVisible).map((child, childIndex) => {
            const isChildActive = child.isActive 
              ? child.isActive(location.pathname) 
              : isNavItemActive(location.pathname, child.href, true);
              
            return (
              <Button
                key={childIndex}
                variant={isChildActive ? "secondary" : "ghost"}
                className="justify-start w-full"
                size="sm"
                asChild
              >
                <Link to={child.href}>
                  {child.icon}
                  <span className="ml-2">{child.title}</span>
                </Link>
              </Button>
            );
          })}
        </div>
      )}
    </div>
  );
}
