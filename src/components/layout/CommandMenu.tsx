import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { Search } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useAuthSession } from '@/contexts/auth';
import { getDefaultDashboardPathForRole } from '@/utils/authRedirect';
import type { UserRole } from '@/contexts/auth/types';

export function CommandMenu() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const { userRole } = useAuthSession();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };
    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  const dashboardPath = getDefaultDashboardPathForRole(userRole as UserRole);

  const items = [
    {
      title: 'Dashboard',
      path: dashboardPath,
      roles: ['admin', 'super_admin', 'owner', 'tenant', 'agent', 'manager', 'vendor'],
    },
    {
      title: 'Properties',
      path: '/properties',
      roles: ['admin', 'super_admin', 'owner', 'agent', 'manager'],
    },
    {
      title: 'Short-Lets',
      path: userRole === 'owner' ? '/owner/shortlets' : '/shortlets',
      roles: ['admin', 'super_admin', 'owner', 'agent', 'manager'],
    },
    {
      title: 'Maintenance',
      path: '/maintenance',
      roles: ['admin', 'super_admin', 'owner', 'tenant', 'agent', 'manager', 'vendor'],
    },
    {
      title: 'Tenants',
      path: '/tenant-management',
      roles: ['admin', 'super_admin', 'owner', 'agent', 'manager'],
    },
    {
      title: 'Documents',
      path: '/documents',
      roles: ['admin', 'super_admin', 'owner', 'tenant', 'agent', 'manager', 'vendor'],
    },
    {
      title: 'Settings',
      path: '/settings',
      roles: ['admin', 'super_admin', 'owner', 'tenant', 'agent', 'manager', 'vendor'],
    },
  ];

  const filteredItems = userRole ? items.filter((item) => item.roles.includes(userRole)) : items;

  return (
    <>
      <Button
        variant="outline"
        className="relative h-9 w-full justify-start rounded-[0.5rem] text-sm text-muted-foreground sm:pr-12 md:w-40 lg:w-64"
        onClick={() => setOpen(true)}
      >
        <Search className="mr-2 h-4 w-4" />
        <span className="hidden lg:inline-flex">Search...</span>
        <span className="inline-flex lg:hidden">Search...</span>
        <kbd className="pointer-events-none absolute right-1.5 top-2 hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
          <span className="text-xs">⌘</span>K
        </kbd>
      </Button>
      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="Type a command or search..." />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>
          <CommandGroup heading="Navigation">
            {filteredItems.map((item) => (
              <CommandItem
                key={item.path}
                onSelect={() => {
                  navigate(item.path);
                  setOpen(false);
                }}
              >
                {item.title}
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  );
}
