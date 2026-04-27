import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { CheckCircle, Home, Clock } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

const TenantApplicationSuccess = () => {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 p-2">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
          <CardTitle className="text-2xl">Application Submitted!</CardTitle>
          <CardDescription>Thank you for your rental application</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="border-b pb-4">
            <h3 className="mb-2 font-medium">What happens next?</h3>
            <ul className="space-y-3">
              <li className="flex items-start">
                <Clock className="mr-2 mt-0.5 h-5 w-5 shrink-0 text-primary" />
                <span>
                  Your application will be reviewed by the property manager within 2-3 business
                  days.
                </span>
              </li>
              <li className="flex items-start">
                <CheckCircle className="mr-2 mt-0.5 h-5 w-5 shrink-0 text-primary" />
                <span>
                  We'll conduct background and credit checks as part of the application process.
                </span>
              </li>
              <li className="flex items-start">
                <Home className="mr-2 mt-0.5 h-5 w-5 shrink-0 text-primary" />
                <span>
                  If approved, you will get an in-app notification on your tenant dashboard (and we
                  may follow up about lease signing and move-in).
                </span>
              </li>
            </ul>
          </div>

          <p className="text-center text-sm text-muted-foreground">
            You will see updates on your tenant dashboard when the property manager reviews your
            application. Email updates may also be sent when configured.
          </p>
        </CardContent>
        <CardFooter className="flex flex-col space-y-2">
          <Button asChild className="w-full">
            <Link to="/tenant/dashboard">Go to tenant dashboard</Link>
          </Button>
          <Button variant="outline" asChild className="w-full">
            <Link to="/public/properties">View More Properties</Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default TenantApplicationSuccess;
