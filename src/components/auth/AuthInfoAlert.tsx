
import { ShieldCheck } from 'lucide-react';
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";

const AuthInfoAlert = () => {
  return (
    <Alert className="mx-6 mb-2">
      <ShieldCheck className="h-4 w-4" />
      <AlertTitle>Multi-Role Authentication</AlertTitle>
      <AlertDescription>
        This system supports different access levels: Admin, Manager, and User roles.
      </AlertDescription>
    </Alert>
  );
};

export default AuthInfoAlert;
