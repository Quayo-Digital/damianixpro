import { Link } from 'react-router-dom';
import { Facebook, Twitter, Instagram, Linkedin, Mail, Globe, Copyright } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { BrandText } from '@/components/ui/brand-text';
import { Logo } from '@/components/ui/logo';

export const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="mesh-surface w-full border-t border-border px-6 py-12 text-foreground">
      <div className="glass-panel mx-auto max-w-5xl rounded-3xl p-8 md:p-10">
        <div className="grid gap-8 md:grid-cols-4">
          <div>
            <div className="mb-4 flex items-center">
              <Logo />
              <BrandText className="premium-title text-2xl text-primary" />
            </div>
            <p className="mb-4 text-muted-foreground">
              Revolutionizing property management in Nigeria with technology-driven solutions for
              landlords, tenants, and property managers.
            </p>
            <div className="mb-4 rounded-xl border border-emerald-200/90 bg-emerald-50/95 p-3 backdrop-blur-sm dark:border-emerald-800/70 dark:bg-emerald-950/55">
              <p className="mb-1 text-xs font-semibold text-emerald-900 dark:text-emerald-200">
                REDAN Certified
              </p>
              <p className="text-xs text-emerald-950/85 dark:text-emerald-50/90">
                Damianix Systems Ltd is a registered member of the Real Estate Developers'
                Association of Nigeria (REDAN)
              </p>
              <p className="mt-1 text-xs font-medium text-emerald-800 dark:text-emerald-300">
                Membership No: NC/25/4428/DAM
              </p>
            </div>
            <div className="mt-4 flex space-x-4">
              <Button
                variant="ghost"
                size="icon"
                className="rounded-full bg-muted/80 hover:bg-muted dark:bg-muted/50 dark:hover:bg-muted"
                aria-label="Facebook"
              >
                <Facebook className="h-5 w-5 text-muted-foreground transition-colors hover:text-primary" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="rounded-full bg-muted/80 hover:bg-muted dark:bg-muted/50 dark:hover:bg-muted"
                aria-label="Twitter"
              >
                <Twitter className="h-5 w-5 text-muted-foreground transition-colors hover:text-primary" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="rounded-full bg-muted/80 hover:bg-muted dark:bg-muted/50 dark:hover:bg-muted"
                aria-label="Instagram"
              >
                <Instagram className="h-5 w-5 text-muted-foreground transition-colors hover:text-primary" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="rounded-full bg-muted/80 hover:bg-muted dark:bg-muted/50 dark:hover:bg-muted"
                aria-label="LinkedIn"
              >
                <Linkedin className="h-5 w-5 text-muted-foreground transition-colors hover:text-primary" />
              </Button>
            </div>
          </div>

          <div>
            <h3 className="mb-4 font-semibold">Solutions</h3>
            <ul className="space-y-2">
              <li>
                <Link
                  to="/solutions/landlords"
                  className="flex items-center gap-2 text-muted-foreground transition-colors hover:text-green-600"
                >
                  For Landlords
                </Link>
              </li>
              <li>
                <Link
                  to="/solutions/tenants"
                  className="flex items-center gap-2 text-muted-foreground transition-colors hover:text-green-600"
                >
                  For Tenants
                </Link>
              </li>
              <li>
                <Link
                  to="/solutions/property-managers"
                  className="flex items-center gap-2 text-muted-foreground transition-colors hover:text-green-600"
                >
                  For Property Managers
                </Link>
              </li>
              <li>
                <Link
                  to="/public/properties"
                  className="flex items-center gap-2 text-muted-foreground transition-colors hover:text-green-600"
                >
                  Browse Properties
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="mb-4 font-semibold">Company</h3>
            <ul className="space-y-2">
              <li>
                <Link
                  to="/blog"
                  className="flex items-center gap-2 text-muted-foreground transition-colors hover:text-green-600"
                >
                  Blog
                </Link>
              </li>
              <li>
                <Link
                  to="/about"
                  className="flex items-center gap-2 text-muted-foreground transition-colors hover:text-green-600"
                >
                  About Us
                </Link>
              </li>
              <li>
                <Link
                  to="/careers"
                  className="flex items-center gap-2 text-muted-foreground transition-colors hover:text-green-600"
                >
                  Careers
                </Link>
              </li>
              <li>
                <Link
                  to="/contact"
                  className="flex items-center gap-2 text-muted-foreground transition-colors hover:text-green-600"
                >
                  Contact
                </Link>
              </li>
              <li>
                <Link
                  to="/#pricing"
                  className="flex items-center gap-2 text-muted-foreground transition-colors hover:text-green-600"
                >
                  Pricing & plans
                </Link>
              </li>
              <li>
                <Link
                  to="/pricing/agents"
                  className="flex items-center gap-2 text-muted-foreground transition-colors hover:text-green-600"
                >
                  Agents & partners pricing
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="mb-4 font-semibold">Support</h3>
            <ul className="space-y-2">
              <li>
                <Link
                  to="/help"
                  className="flex items-center gap-2 text-muted-foreground transition-colors hover:text-green-600"
                >
                  Help Center
                </Link>
              </li>
              <li>
                <Link
                  to="/privacy"
                  className="flex items-center gap-2 text-muted-foreground transition-colors hover:text-green-600"
                >
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link
                  to="/terms"
                  className="flex items-center gap-2 text-muted-foreground transition-colors hover:text-green-600"
                >
                  Terms of Service
                </Link>
              </li>
              <li>
                <a
                  href="mailto:contact@damianixpro.com"
                  className="flex items-center gap-2 text-muted-foreground transition-colors hover:text-green-600"
                >
                  <Mail className="h-4 w-4" />
                  contact@damianixpro.com
                </a>
              </li>
              <li>
                <a
                  href="https://damianixpro.com"
                  className="flex items-center gap-2 text-muted-foreground transition-colors hover:text-green-600"
                >
                  <Globe className="h-4 w-4" />
                  www.damianixpro.com
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between border-t border-border pt-8 text-muted-foreground md:flex-row">
          <div className="mb-4 flex flex-col md:mb-0">
            <div className="mb-2 flex items-center">
              <Copyright className="mr-2 h-4 w-4" />
              <span>
                {currentYear} <BrandText />. All rights reserved.
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              Promoted by Damianix Systems Ltd | REDAN Member: NC/25/4428/DAM
            </p>
          </div>
          <div className="flex space-x-4">
            <Link
              to="/privacy"
              className="text-sm text-muted-foreground transition-colors hover:text-primary"
            >
              Privacy
            </Link>
            <Link
              to="/terms"
              className="text-sm text-muted-foreground transition-colors hover:text-primary"
            >
              Terms
            </Link>
            <Link
              to="/privacy#cookies"
              className="text-sm text-muted-foreground transition-colors hover:text-primary"
            >
              Cookies
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};
