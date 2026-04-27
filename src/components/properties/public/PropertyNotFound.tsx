import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

export const PropertyNotFound = () => {
  return (
    <div className="container mx-auto px-4 py-8 text-center">
      <h2 className="mb-4 text-2xl font-bold">Property Not Found</h2>
      <p className="mb-6 text-muted-foreground">
        The property you're looking for doesn't exist or has been removed.
      </p>
      <Button asChild>
        <Link to="/public/properties">Back to Properties</Link>
      </Button>
    </div>
  );
};
