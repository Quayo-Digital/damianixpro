
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { CheckCircle, Home, Clock } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

const TenantApplicationSuccess = () => {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 p-2 rounded-full bg-green-100 w-16 h-16 flex items-center justify-center">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
          <CardTitle className="text-2xl">Application Submitted!</CardTitle>
          <CardDescription>
            Thank you for your rental application
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="border-b pb-4">
            <h3 className="font-medium mb-2">What happens next?</h3>
            <ul className="space-y-3">
              <li className="flex items-start">
                <Clock className="h-5 w-5 mr-2 text-primary shrink-0 mt-0.5" />
                <span>Your application will be reviewed by the property manager within 2-3 business days.</span>
              </li>
              <li className="flex items-start">
                <CheckCircle className="h-5 w-5 mr-2 text-primary shrink-0 mt-0.5" />
                <span>We'll conduct background and credit checks as part of the application process.</span>
              </li>
              <li className="flex items-start">
                <Home className="h-5 w-5 mr-2 text-primary shrink-0 mt-0.5" />
                <span>If approved, we'll contact you to schedule a lease signing and move-in date.</span>
              </li>
            </ul>
          </div>
          
          <p className="text-center text-sm text-muted-foreground">
            You will receive updates about your application status via email and on your account dashboard.
          </p>
        </CardContent>
        <CardFooter className="flex flex-col space-y-2">
          <Button asChild className="w-full">
            <Link to="/dashboard">
              Go to Dashboard
            </Link>
          </Button>
          <Button variant="outline" asChild className="w-full">
            <Link to="/public/properties">
              View More Properties
            </Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default TenantApplicationSuccess;
