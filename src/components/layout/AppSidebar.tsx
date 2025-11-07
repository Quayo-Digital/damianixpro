
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarFooter,
  useSidebar,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { SidebarNav } from "./sidebar/SidebarNav";
import { Logo } from "@/components/ui/logo";
import { UserNav } from './UserNav';
import { ThemeToggle } from "./ThemeToggle";
import { Link } from "react-router-dom";

export function AppSidebar() {
  const { state } = useSidebar();
  const isCollapsed = state === 'collapsed';

  return (
    <Sidebar>
      <SidebarHeader className="justify-between">
        <Link className="flex items-center gap-2 flex-1" to="/dashboard">
          <Logo />
          {!isCollapsed && <span className="font-bold text-xl whitespace-nowrap">DamianixPro</span>}
        </Link>
        <div className="hidden md:block">
            <SidebarTrigger />
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarNav isCollapsed={isCollapsed} />
      </SidebarContent>
      <SidebarFooter className="flex flex-col items-stretch gap-2">
        <ThemeToggle/>
        <UserNav />
      </SidebarFooter>
    </Sidebar>
  );
}
