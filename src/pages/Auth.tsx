import { useState, useEffect } from 'react';
import { useLocation, useNavigate, type Location } from 'react-router-dom';
import { completePostAuthRedirect, persistAuthReturnTo } from '@/utils/authRedirect';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import LoginForm from '@/components/auth/LoginForm';
import RegisterForm from '@/components/auth/RegisterForm';
import { useAuthSession } from '@/contexts/auth';

const Auth = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, userRole } = useAuthSession();
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');

  useEffect(() => {
    const from = location.state?.from as Location | undefined;
    if (from) {
      persistAuthReturnTo(from);
    }
  }, [location.state]);

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const tab = searchParams.get('tab');

    // Signed-up users briefly have a session before RegisterForm signs them out and sends them to login.
    // Do not redirect away from the register tab during that window.
    if (user) {
      if (tab === 'register' || authMode === 'register') {
        return;
      }
      completePostAuthRedirect(navigate, location, userRole, { replace: true });
      return;
    }

    if (tab === 'register') {
      setAuthMode('register');
    } else if (tab === 'login') {
      setAuthMode('login');
    }
  }, [location, user, userRole, navigate, authMode]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-secondary/50">
      <div className="w-full max-w-md p-4">
        <Card>
          <CardHeader className="space-y-1">
            <CardTitle className="text-center text-2xl">
              {authMode === 'login' ? 'Sign In' : 'Create an Account'}
            </CardTitle>
            <CardDescription className="text-center">
              {authMode === 'login'
                ? 'Enter your credentials to sign in'
                : 'Enter your information to create an account'}
            </CardDescription>
          </CardHeader>

          <Tabs
            defaultValue="login"
            value={authMode}
            onValueChange={(value) => setAuthMode(value as 'login' | 'register')}
          >
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Sign In</TabsTrigger>
              <TabsTrigger value="register">Register</TabsTrigger>
            </TabsList>
            <TabsContent value="login">
              <LoginForm />
            </TabsContent>
            <TabsContent value="register">
              <RegisterForm />
            </TabsContent>
          </Tabs>
        </Card>
      </div>
    </div>
  );
};

export default Auth;
