import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  Card, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import LoginForm from '@/components/auth/LoginForm';
import RegisterForm from '@/components/auth/RegisterForm';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { InfoIcon } from "lucide-react";
import { useAuth } from '@/contexts/auth';

// Enhanced AuthInfoAlert component
const AuthInfoAlert = () => {
  return (
    <div className="mx-6 mb-4">
      <Alert variant="default" className="bg-blue-50 text-blue-800 border-blue-200">
        <InfoIcon className="h-4 w-4" />
        <AlertDescription>
          For demo purposes, register with a role or login with existing credentials.
        </AlertDescription>
      </Alert>
    </div>
  );
};

const Auth = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [authMode, setAuthMode] = useState<"login" | "register">("login");

  useEffect(() => {
    // Check if user is already authenticated
    if (user) {
      const from = location.state?.from?.pathname || '/dashboard';
      navigate(from, { replace: true });
      return;
    }
    
    // Check for tab parameter in URL
    const searchParams = new URLSearchParams(location.search);
    const tab = searchParams.get('tab');
    if (tab === 'register') {
      setAuthMode('register');
    } else if (tab === 'login') {
      setAuthMode('login');
    }
  }, [location, user, navigate]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-secondary/50">
      <div className="w-full max-w-md p-4">
        <Card>
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl text-center">
              {authMode === "login" ? "Sign In" : "Create an Account"}
            </CardTitle>
            <CardDescription className="text-center">
              {authMode === "login" 
                ? "Enter your credentials to sign in" 
                : "Enter your information to create an account"}
            </CardDescription>
          </CardHeader>

          <AuthInfoAlert />

          <Tabs 
            defaultValue="login" 
            value={authMode} 
            onValueChange={(value) => setAuthMode(value as "login" | "register")}
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
