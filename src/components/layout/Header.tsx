import { CommandMenu } from './CommandMenu';
import { NotificationCenter } from '@/components/notifications/NotificationCenter';
import { SidebarTrigger } from '@/components/ui/sidebar';

export function Header() {
  return (
    <header className="supports-backdrop-blur:bg-background/60 sticky top-0 z-30 w-full border-b bg-background/95 backdrop-blur">
      <div className="container flex h-14 items-center">
        <div className="md:hidden">
          <SidebarTrigger />
        </div>

        <div className="flex flex-1 items-center justify-end space-x-2">
          <div className="w-full flex-1 md:w-auto md:flex-none">
            <CommandMenu />
          </div>

          <div className="flex items-center gap-2">
            <NotificationCenter />
          </div>
        </div>
      </div>
    </header>
  );
}
