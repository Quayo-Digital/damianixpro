import { CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuthSession } from '@/contexts/AuthContext';

export const AccountInfo = () => {
  const { getRoleDisplay } = useAuthSession();

  return (
    <>
      <CardHeader>
        <CardTitle>Account Information</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <h3 className="text-sm font-medium">Account Type</h3>
          <p className="text-muted-foreground">{getRoleDisplay()}</p>
        </div>
        <div>
          <h3 className="text-sm font-medium">Member Since</h3>
          <p className="text-muted-foreground">January 2023</p>
        </div>
        <div>
          <h3 className="text-sm font-medium">Last Login</h3>
          <p className="text-muted-foreground">May 7, 2025</p>
        </div>
        <div className="pt-4">
          <Button variant="outline" className="w-full">
            Change Password
          </Button>
        </div>
      </CardContent>
    </>
  );
};
