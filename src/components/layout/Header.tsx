import { CommandMenu } from './CommandMenu';
import { NotificationCenter } from '@/components/notifications/NotificationCenter';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Separator } from '@/components/ui/separator';
import { UserNav } from './UserNav';

export function Header() {
  return (
    <header className="sticky top-0 z-30 w-full shrink-0 border-b border-border/60 bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/70">
      <div className="flex h-14 items-center gap-2 px-3 sm:gap-3 sm:px-4 lg:h-[3.5rem] lg:px-6">
        <SidebarTrigger
          className="h-9 w-9 shrink-0 text-muted-foreground hover:bg-muted hover:text-foreground"
          aria-label="Open or close sidebar"
        />
        <Separator orientation="vertical" className="hidden h-6 md:block" />
        <div className="flex min-w-0 flex-1 items-center">
          <CommandMenu />
        </div>
        <div className="flex shrink-0 items-center gap-0.5 sm:gap-1.5">
          <NotificationCenter />
          <UserNav />
        </div>
      </div>
    </header>
  );
}
