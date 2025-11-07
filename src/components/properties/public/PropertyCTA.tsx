
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Home, MapPin, Building, Phone } from "lucide-react";

export function PropertyCTA() {
  return (
    <div className="bg-primary/5 py-16">
      <div className="max-w-6xl mx-auto px-4 text-center">
        <h2 className="text-3xl font-bold mb-4">Find Your Perfect Property Today</h2>
        <p className="text-lg text-muted-foreground mb-8 max-w-3xl mx-auto">
          Whether you're looking for a new home, office space, or investment opportunity, 
          we have a wide selection of properties across Nigeria to suit your needs.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <Home className="h-10 w-10 text-primary mb-4 mx-auto" />
            <h3 className="font-semibold text-lg mb-2">Residential</h3>
            <p className="text-muted-foreground mb-4">Find apartments, houses, and villas for you and your family</p>
            <Link to="/public/properties?type=residential" className="text-primary hover:underline font-medium">
              Browse Homes
            </Link>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <Building className="h-10 w-10 text-primary mb-4 mx-auto" />
            <h3 className="font-semibold text-lg mb-2">Commercial</h3>
            <p className="text-muted-foreground mb-4">Office spaces, retail shops, and other commercial properties</p>
            <Link to="/public/properties?type=commercial" className="text-primary hover:underline font-medium">
              View Listings
            </Link>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <MapPin className="h-10 w-10 text-primary mb-4 mx-auto" />
            <h3 className="font-semibold text-lg mb-2">Featured Locations</h3>
            <p className="text-muted-foreground mb-4">Explore properties in Lagos, Abuja, Port Harcourt and more</p>
            <Link to="/public/properties" className="text-primary hover:underline font-medium">
              Search by Location
            </Link>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <Phone className="h-10 w-10 text-primary mb-4 mx-auto" />
            <h3 className="font-semibold text-lg mb-2">Contact Us</h3>
            <p className="text-muted-foreground mb-4">Need help finding your perfect property? Get in touch with our team</p>
            <Link to="/auth" className="text-primary hover:underline font-medium">
              Contact an Agent
            </Link>
          </div>
        </div>
        
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Button size="lg" asChild>
            <Link to="/auth">Get Started</Link>
          </Button>
          <Button variant="outline" size="lg" asChild>
            <Link to="/public/properties">View All Properties</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
