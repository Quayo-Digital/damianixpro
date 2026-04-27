import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Building2, ArrowRight, MapPinned, Landmark } from 'lucide-react';

export const SalesSection = () => {
  return (
    <section className="glass-panel rounded-3xl p-8 md:p-10">
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <Badge className="mb-3 rounded-full bg-primary/15 text-primary hover:bg-primary/15">
            New
          </Badge>
          <h2 className="premium-title text-2xl md:text-3xl">Property & Land Sales</h2>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground md:text-base">
            Discover verified properties and land listings for purchase across key Nigerian cities.
          </p>
        </div>
        <Button asChild className="rounded-full">
          <Link to="/sales">
            Explore Sales
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card className="premium-data-card">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Building2 className="h-4 w-4 text-primary" />
              Residential Sales
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Apartments, duplexes, detached homes, and gated community options.
          </CardContent>
        </Card>

        <Card className="premium-data-card">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Landmark className="h-4 w-4 text-primary" />
              Commercial Sales
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Offices, mixed-use properties, retail spaces, and income assets.
          </CardContent>
        </Card>

        <Card className="premium-data-card">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <MapPinned className="h-4 w-4 text-primary" />
              Land Listings
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Verified plots for residential, commercial, and future development.
          </CardContent>
        </Card>
      </div>
    </section>
  );
};
