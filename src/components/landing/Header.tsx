
import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/auth';
import { Logo } from '@/components/ui/logo';

export function Header() {
  const { user } = useAuth();

  return (
    <header className="w-full border-b bg-background">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-6">
          <Link to="/" className="flex items-center space-x-2">
            <Logo />
            <span className="font-bold text-xl">DamianixPro</span>
          </Link>
          <nav className="hidden md:flex gap-6">
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
            <Button asChild>
              <Link to="/dashboard">Dashboard</Link>
            </Button>
          ) : (
            <>
              <Button variant="ghost" asChild>
                <Link to="/auth">Sign In</Link>
              </Button>
              <Button asChild>
                <Link to="/auth?tab=register">Register</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
