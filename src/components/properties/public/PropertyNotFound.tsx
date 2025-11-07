
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

export const PropertyNotFound = () => {
  return (
    <div className="container mx-auto px-4 py-8 text-center">
      <h2 className="text-2xl font-bold mb-4">Property Not Found</h2>
      <p className="text-muted-foreground mb-6">The property you're looking for doesn't exist or has been removed.</p>
      <Button asChild>
        <Link to="/public/properties">Back to Properties</Link>
      </Button>
    </div>
  );
};
