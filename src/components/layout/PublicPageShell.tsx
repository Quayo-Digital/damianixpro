import { useEffect, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { LogIn, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { GlobalFooter } from '@/components/layout/GlobalFooter';
import { useAuthSession } from '@/contexts/auth';
import { Logo } from '@/components/ui/logo';
import { BrandText } from '@/components/ui/brand-text';
import { useWhiteLabel } from '@/contexts/WhiteLabelContext';
import { BodyText, PageTitle } from '@/components/ui/typography';

type PublicPageShellProps = {
  title: string;
  description?: string;
  children: ReactNode;
};

export function PublicPageShell({ title, description, children }: PublicPageShellProps) {
  const { user } = useAuthSession();
  const { brandName } = useWhiteLabel();

  useEffect(() => {
    document.title = `${title} | ${brandName}`;
    return () => {
      document.title = brandName;
    };
  }, [title, brandName]);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="sticky top-0 z-10 border-b border-border bg-background/95 text-foreground shadow-sm backdrop-blur-xl supports-[backdrop-filter]:bg-background/80">
        <div className="mx-auto flex h-14 w-full max-w-screen-2xl flex-wrap items-center justify-between gap-2 px-4 sm:h-16 sm:px-6 lg:px-8">
          <div className="flex min-w-0 flex-1 items-center gap-4">
            <Link to="/" className="flex shrink-0 items-center space-x-2">
              <Logo />
              <BrandText className="text-lg font-semibold" />
            </Link>
            <nav className="hidden flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground sm:flex">
              <Link to="/blog" className="hover:text-foreground">
                Blog
              </Link>
              <Link to="/about" className="hover:text-foreground">
                About
              </Link>
              <Link to="/help" className="hover:text-foreground">
                Help
              </Link>
              <Link to="/contact" className="hover:text-foreground">
                Contact
              </Link>
            </nav>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            {user ? (
              <Button variant="outline" size="sm" asChild>
                <Link to="/properties" className="flex items-center gap-1">
                  <User className="h-4 w-4" />
                  Dashboard
                </Link>
              </Button>
            ) : (
              <Button variant="default" size="sm" asChild>
                <Link to="/auth" className="flex items-center gap-1">
                  <LogIn className="h-4 w-4" />
                  Login / Register
                </Link>
              </Button>
            )}
          </div>
        </div>
      </header>

      <main className="flex-grow">
        <div className="mx-auto w-full max-w-screen-lg px-4 py-8 sm:px-6 sm:py-10 md:py-14 lg:px-8">
          <div className="mb-8 space-y-2 sm:mb-10">
            <PageTitle>{title}</PageTitle>
            {description ? <BodyText>{description}</BodyText> : null}
          </div>
          <div className="space-y-5 leading-relaxed sm:space-y-6">{children}</div>
        </div>
      </main>

      <GlobalFooter />
    </div>
  );
}
