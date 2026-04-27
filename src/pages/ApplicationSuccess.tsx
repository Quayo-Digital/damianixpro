import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { CheckCircle } from 'lucide-react';

const ApplicationSuccess = () => {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-6">
      <div className="mx-auto w-full max-w-lg rounded-lg border bg-card p-8 text-center shadow-sm">
        <CheckCircle className="mx-auto mb-4 h-16 w-16 text-primary" />
        <h1 className="mb-2 text-2xl font-bold">Application Submitted!</h1>
        <p className="mb-6 text-muted-foreground">
          Thank you for submitting your rental application. We have received your details and will
          review them shortly.
        </p>

        <div className="mb-6 rounded-md bg-muted p-4 text-left">
          <h3 className="mb-2 font-medium">What happens next?</h3>
          <ol className="list-decimal space-y-1 pl-5 text-sm text-muted-foreground">
            <li>Our team will review your application (typically within 2-3 business days)</li>
            <li>We'll conduct background and reference checks</li>
            <li>You'll receive an email notification with the application result</li>
            <li>If approved, we'll contact you to schedule a lease signing appointment</li>
          </ol>
        </div>

        <p className="mb-6 text-sm text-muted-foreground">
          If you have any questions regarding your application, please contact our support team at
          support@damianixpro.com or call us at +234 801 234 5678.
        </p>

        <div className="space-y-3">
          <Button asChild className="w-full">
            <Link to="/public/properties">Browse More Properties</Link>
          </Button>
          <Button variant="outline" asChild className="w-full">
            <Link to="/">Return to Home</Link>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ApplicationSuccess;
