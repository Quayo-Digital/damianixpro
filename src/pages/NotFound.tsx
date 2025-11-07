import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

// Changed from named export to default export
const NotFound = () => {
  const navigate = useNavigate();
  
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-secondary/50 p-4">
      <div className="bg-background rounded-lg shadow-lg p-8 max-w-md w-full text-center">
        <h1 className="text-3xl font-bold mb-4">404 - Not Found</h1>
        <p className="mb-6 text-muted-foreground">
          The page you are looking for doesn't exist or has been moved.
        </p>
        <Button onClick={() => navigate('/')} className="w-full">
          Go to Home
        </Button>
      </div>
    </div>
  );
}

// Export the component as default
export default NotFound;

// Keep the named export for backward compatibility
export { NotFound };
