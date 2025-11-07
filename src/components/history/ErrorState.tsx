
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

interface ErrorStateProps {
  error: unknown;
  refetch: () => void;
}

export const ErrorState = ({ error, refetch }: ErrorStateProps) => {
  let errorMessage = 'An error occurred while loading activities.';
  if (error instanceof Error) {
    errorMessage = error.message;
  }
  
  return (
    <div className="my-8">
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>
          {errorMessage}
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => refetch()} 
            className="mt-2"
          >
            Try Again
          </Button>
        </AlertDescription>
      </Alert>
    </div>
  );
};
