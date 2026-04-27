import { useState, type MouseEvent } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Home, MapPin, Building, Phone } from 'lucide-react';

const PUBLIC_PROPERTIES_PATH = '/public/properties';

export type PropertyCTAProps = {
  /** Re-apply filters when a CTA link points at the current URL (navigation may be a no-op). */
  applyFiltersFromSearch?: (search: string) => void;
};

function searchesEquivalent(locSearch: string, targetSearch: string): boolean {
  const a = new URLSearchParams(locSearch.startsWith('?') ? locSearch.slice(1) : locSearch);
  const b = new URLSearchParams(
    targetSearch.startsWith('?') ? targetSearch.slice(1) : targetSearch
  );
  if (a.toString() === b.toString()) return true;
  const keys = new Set<string>([...a.keys(), ...b.keys()]);
  for (const k of keys) {
    if (a.get(k) !== b.get(k)) return false;
  }
  return true;
}

export function PropertyCTA({ applyFiltersFromSearch }: PropertyCTAProps) {
  const [showCityPicker, setShowCityPicker] = useState(false);
  const location = useLocation();

  const handleSameUrlActivate = (e: MouseEvent, search: string) => {
    if (!applyFiltersFromSearch) return;
    const next = search.startsWith('?') ? search : `?${search}`;
    if (location.pathname === PUBLIC_PROPERTIES_PATH && searchesEquivalent(location.search, next)) {
      e.preventDefault();
      applyFiltersFromSearch(next);
    }
  };

  const cardClassName =
    'block cursor-pointer rounded-lg border border-border bg-card p-6 text-left text-card-foreground shadow-sm transition-shadow hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 dark:focus-visible:ring-offset-background';

  return (
    <div className="border-y border-border bg-primary/5 py-16 dark:bg-primary/10">
      <div className="mx-auto max-w-6xl px-4 text-center">
        <h2 className="mb-4 text-3xl font-bold text-foreground">
          Find Your Perfect Property Today
        </h2>
        <p className="mx-auto mb-8 max-w-3xl text-lg text-muted-foreground">
          Whether you're looking for a new home, office space, or investment opportunity, we have a
          wide selection of properties across Nigeria to suit your needs.
        </p>

        <div className="relative z-10 mb-10 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Link
            to={{ pathname: PUBLIC_PROPERTIES_PATH, search: 'type=residential&view=list' }}
            className={cardClassName}
            onClick={(e) => handleSameUrlActivate(e, 'type=residential&view=list')}
          >
            <Home className="mx-auto mb-4 h-10 w-10 text-primary" />
            <h3 className="mb-2 text-lg font-semibold">Residential</h3>
            <p className="mb-4 text-muted-foreground">
              Find apartments, houses, and villas for you and your family
            </p>
            <span className="font-medium text-primary hover:underline">Browse Homes</span>
          </Link>

          <Link
            to={{ pathname: PUBLIC_PROPERTIES_PATH, search: 'type=commercial&view=list' }}
            className={cardClassName}
            onClick={(e) => handleSameUrlActivate(e, 'type=commercial&view=list')}
          >
            <Building className="mx-auto mb-4 h-10 w-10 text-primary" />
            <h3 className="mb-2 text-lg font-semibold">Commercial</h3>
            <p className="mb-4 text-muted-foreground">
              Office spaces, retail shops, and other commercial properties
            </p>
            <span className="font-medium text-primary hover:underline">View Listings</span>
          </Link>

          <div className="rounded-lg border border-border bg-card p-6 text-card-foreground shadow-sm transition-shadow hover:shadow-md">
            <MapPin className="mx-auto mb-4 h-10 w-10 text-primary" />
            <Link
              to={{ pathname: PUBLIC_PROPERTIES_PATH, search: 'location=Abuja&view=list' }}
              className="mb-2 block text-lg font-semibold text-foreground underline-offset-4 hover:text-primary hover:underline"
              onClick={(e) => handleSameUrlActivate(e, 'location=Abuja&view=list')}
            >
              Featured Abuja Locations
            </Link>
            <p className="mb-4 text-muted-foreground">
              Explore premium properties across Abuja&apos;s key districts.
            </p>
            <button
              type="button"
              className="font-medium text-primary hover:underline"
              onClick={() => setShowCityPicker((prev) => !prev)}
            >
              {showCityPicker ? 'Hide Locations' : 'Search by Location'}
            </button>

            {showCityPicker && (
              <div className="mt-3 flex flex-wrap justify-center gap-2">
                <Link
                  to={{ pathname: PUBLIC_PROPERTIES_PATH, search: 'location=Abuja&view=list' }}
                  className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary hover:bg-primary/20"
                  onClick={(e) => handleSameUrlActivate(e, 'location=Abuja&view=list')}
                >
                  Abuja (All)
                </Link>
                <Link
                  to={{ pathname: PUBLIC_PROPERTIES_PATH, search: 'location=Wuse%202&view=list' }}
                  className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary hover:bg-primary/20"
                  onClick={(e) => handleSameUrlActivate(e, 'location=Wuse%202&view=list')}
                >
                  Wuse 2
                </Link>
                <Link
                  to={{ pathname: PUBLIC_PROPERTIES_PATH, search: 'location=Maitama&view=list' }}
                  className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary hover:bg-primary/20"
                  onClick={(e) => handleSameUrlActivate(e, 'location=Maitama&view=list')}
                >
                  Maitama
                </Link>
                <Link
                  to={{ pathname: PUBLIC_PROPERTIES_PATH, search: 'location=Garki&view=list' }}
                  className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary hover:bg-primary/20"
                  onClick={(e) => handleSameUrlActivate(e, 'location=Garki&view=list')}
                >
                  Garki
                </Link>
              </div>
            )}
          </div>

          <a
            href="mailto:support@nigeriahomes.com?subject=Property%20Inquiry"
            className={cardClassName}
          >
            <Phone className="mx-auto mb-4 h-10 w-10 text-primary" />
            <h3 className="mb-2 text-lg font-semibold">Contact Us</h3>
            <p className="mb-4 text-muted-foreground">
              Need help finding your perfect property? Get in touch with our team
            </p>
            <span className="font-medium text-primary hover:underline">Contact an Agent</span>
          </a>
        </div>

        <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Button size="lg" asChild>
            <Link to="/auth">Get Started</Link>
          </Button>
          <Button variant="outline" size="lg" asChild>
            <Link to={PUBLIC_PROPERTIES_PATH}>View All Properties</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
