import { useState, useEffect } from 'react';
import { useLocation, useNavigate, type Location } from 'react-router-dom';
import { completePostAuthRedirect, persistAuthReturnTo } from '@/utils/authRedirect';

type AuthLocationState = { from?: Location; fromRegistration?: boolean };
import { Card, CardHeader } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import LoginForm from '@/components/auth/LoginForm';
import RegisterForm from '@/components/auth/RegisterForm';
import { useAuthSession } from '@/contexts/auth';
import { PageTitle, BodyText } from '@/components/ui/typography';

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
    const state = location.state as AuthLocationState | null | undefined;
    const fromRegistration = state?.fromRegistration === true;

    if (tab === 'register') {
      setAuthMode('register');
    } else if (tab === 'login') {
      setAuthMode('login');
    }

    if (user) {
      if (tab === 'register') {
        return;
      }
      if (tab === 'login' && fromRegistration) {
        return;
      }
      completePostAuthRedirect(navigate, location, userRole, { replace: true });
      return;
    }

    if (fromRegistration) {
      navigate(
        { pathname: location.pathname, search: location.search },
        { replace: true, state: state?.from ? { from: state.from } : undefined }
      );
    }
  }, [location, user, userRole, navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-secondary/40 px-4 py-8 sm:py-12">
      <div className="w-full max-w-md">
        <Card className="shadow-card">
          <CardHeader className="space-y-1.5">
            <PageTitle as="h1" className="text-center text-2xl sm:text-3xl">
              {authMode === 'login' ? 'Sign In' : 'Create an Account'}
            </PageTitle>
            <BodyText className="text-center">
              {authMode === 'login'
                ? 'Enter your credentials to sign in'
                : 'Enter your information to create an account'}
            </BodyText>
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
