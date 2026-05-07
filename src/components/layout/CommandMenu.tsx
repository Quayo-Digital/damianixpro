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
      roles: [
        'admin',
        'super_admin',
        'owner',
        'tenant',
        'agent',
        'manager',
        'vendor',
        'accountant',
        'facility_manager',
      ],
    },
    {
      title: 'Properties',
      path: '/properties',
      roles: [
        'admin',
        'super_admin',
        'owner',
        'agent',
        'manager',
        'facility_manager',
        'accountant',
      ],
    },
    {
      title: 'Short-Lets',
      path: userRole === 'owner' ? '/owner/shortlets' : '/shortlets',
      roles: ['admin', 'super_admin', 'owner', 'agent', 'manager'],
    },
    {
      title: 'Maintenance',
      path: '/maintenance',
      roles: [
        'admin',
        'super_admin',
        'owner',
        'tenant',
        'agent',
        'manager',
        'vendor',
        'facility_manager',
      ],
    },
    {
      title: 'Service tickets (tenant)',
      path: '/tenant/maintenance-tickets',
      roles: ['tenant'],
    },
    {
      title: 'Service tickets (admin)',
      path: '/admin/maintenance-tickets',
      roles: ['admin', 'super_admin'],
    },
    {
      title: 'Service tickets (portfolio)',
      path: '/maintenance/service-tickets',
      roles: ['owner', 'agent', 'manager'],
    },
    {
      title: 'My assigned tickets',
      path: '/facility-manager/tickets',
      roles: ['facility_manager'],
    },
    {
      title: 'Vendor tickets',
      path: '/vendor/maintenance-tickets',
      roles: ['vendor'],
    },
    {
      title: 'Tenants',
      path: '/tenant-management',
      roles: ['admin', 'super_admin', 'owner', 'agent', 'manager'],
    },
    {
      title: 'Accounting (NG)',
      path: '/accounting',
      roles: ['admin', 'super_admin', 'owner', 'agent', 'manager', 'accountant'],
    },
    {
      title: 'CRM Pipeline',
      path: '/crm/pipeline',
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
        className="relative h-9 w-full max-w-full justify-start rounded-lg border-border/70 bg-muted/30 text-sm text-muted-foreground shadow-sm transition-colors hover:bg-muted/50 sm:pr-12 md:max-w-md lg:max-w-md"
        onClick={() => setOpen(true)}
        aria-label="Open command menu to search and navigate"
      >
        <Search className="mr-2 h-4 w-4 shrink-0 opacity-70" aria-hidden />
        <span className="truncate">Search workspace…</span>
        <kbd className="pointer-events-none absolute right-1.5 top-1/2 hidden h-6 -translate-y-1/2 select-none items-center gap-0.5 rounded-md border border-border/80 bg-background px-1.5 font-mono text-[10px] font-medium shadow-sm sm:inline-flex">
          <span className="text-[11px]">⌘</span>K
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
