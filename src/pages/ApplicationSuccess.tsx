
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { CheckCircle } from 'lucide-react';

const ApplicationSuccess = () => {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="max-w-lg w-full mx-auto rounded-lg border bg-card shadow-sm p-8 text-center">
        <CheckCircle className="h-16 w-16 text-primary mx-auto mb-4" />
        <h1 className="text-2xl font-bold mb-2">Application Submitted!</h1>
        <p className="text-muted-foreground mb-6">
          Thank you for submitting your rental application. We have received your details and will review them shortly.
        </p>
        
        <div className="bg-muted rounded-md p-4 text-left mb-6">
          <h3 className="font-medium mb-2">What happens next?</h3>
          <ol className="list-decimal pl-5 text-sm text-muted-foreground space-y-1">
            <li>Our team will review your application (typically within 2-3 business days)</li>
            <li>We'll conduct background and reference checks</li>
            <li>You'll receive an email notification with the application result</li>
            <li>If approved, we'll contact you to schedule a lease signing appointment</li>
          </ol>
        </div>
        
        <p className="text-sm text-muted-foreground mb-6">
          If you have any questions regarding your application, please contact our support team at support@damianixpro.com or call us at +234 801 234 5678.
        </p>
        
        <div className="space-y-3">
          <Button asChild className="w-full">
            <Link to="/public/properties">
              Browse More Properties
            </Link>
          </Button>
          <Button variant="outline" asChild className="w-full">
            <Link to="/">
              Return to Home
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ApplicationSuccess;
