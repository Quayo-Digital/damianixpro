import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuthSession } from '@/contexts/auth';
import { Logo } from '@/components/ui/logo';
import { BrandText } from '@/components/ui/brand-text';

export function Header() {
  const { user } = useAuthSession();

  return (
    <header className="sticky top-0 z-20 w-full border-b border-border bg-background/90 text-foreground shadow-sm backdrop-blur-xl dark:bg-background/95">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-6">
          <Link to="/" className="flex items-center space-x-2">
            <Logo />
            <BrandText className="premium-title text-xl text-foreground" />
          </Link>
          <nav className="hidden gap-6 md:flex">
            <Link
              to="/properties"
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              Properties
            </Link>
            <Link
              to="/shortlets"
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              Short-Lets
            </Link>
            <Link
              to="/blog"
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              Blog
            </Link>
          </nav>
        </div>
        <div className="flex items-center gap-2">
          {user ? (
            <Button asChild className="rounded-full">
              <Link to="/dashboard">Dashboard</Link>
            </Button>
          ) : (
            <>
              <Button variant="ghost" className="rounded-full" asChild>
                <Link to="/auth">Sign In</Link>
              </Button>
              <Button asChild className="rounded-full">
                <Link to="/auth?tab=register">Register</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
