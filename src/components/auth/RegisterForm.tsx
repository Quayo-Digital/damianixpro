import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2 } from 'lucide-react';
import { useAuthActions } from '@/contexts/auth';
import { UserRole } from '@/contexts/auth/types';
import { useNavigate, useLocation, type Location } from 'react-router-dom';
import { persistAuthReturnTo } from '@/utils/authRedirect';
import { toast } from 'sonner';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { supabase } from '@/integrations/supabase/client';
import { SmartRoleSelection } from '@/components/auth/SmartRoleSelection';
import SocialLogin from '@/components/auth/SocialLogin';
import { logger } from '@/utils/logger';

const RegisterForm = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const fromState = location.state?.from as Location | undefined;
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [company, setCompany] = useState('');
  const [role, setRole] = useState<UserRole>('tenant');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [authMethod, setAuthMethod] = useState<'email' | 'phone'>('email');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);

  const { signUp, signInWithGoogle, signInWithPhone, verifyOtp, refreshUserRole, signOut } =
    useAuthActions();

  const handleSubmitEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      if (!signUp) {
        throw new Error('Sign up function not available');
      }

      logger.debug('Registering user with role', { role });

      // Combine first and last name for full_name (for backward compatibility)
      const fullName = `${firstName} ${lastName}`.trim();

      if (fromState) {
        persistAuthReturnTo(fromState);
      }

      // Pass the first_name, last_name, full_name, company, and role as user metadata
      const result = await signUp(email, password, {
        first_name: firstName,
        last_name: lastName,
        full_name: fullName, // Keep for backward compatibility
        company: company || undefined,
        role,
        onboarded: false, // Mark as not onboarded yet
      });

      // After successful registration, show success message and redirect to login
      toast.success(`Registration successful! Please sign in with your credentials.`);

      // Clear Supabase session so they sign in explicitly (email sign-up may create a session first).
      if (signOut) {
        try {
          await signOut();
        } catch {
          /* still send to login; Auth may redirect if session remains */
        }
      }

      navigate('/auth?tab=login', {
        replace: true,
        state: {
          ...(typeof location.state === 'object' && location.state !== null ? location.state : {}),
          fromRegistration: true,
        },
      });
    } catch (error: any) {
      logger.error('Registration failed', error);
      setError(error.message || 'Registration failed');
      toast.error(error.message || 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitPhone = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      if (!signInWithPhone) {
        throw new Error('Phone sign in not available');
      }

      if (!otpSent) {
        await signInWithPhone(phone);
        setOtpSent(true);
        toast.success('OTP sent to your phone. Please verify.');
      } else {
        // Verify OTP
        if (!verifyOtp) {
          throw new Error('OTP verification not available');
        }

        if (otp.length !== 6) {
          throw new Error('Please enter a valid 6-digit OTP');
        }

        const response = await verifyOtp(phone, otp);

        if (fromState) {
          persistAuthReturnTo(fromState);
        }

        // Update user metadata after verification
        await supabase.auth.updateUser({
          data: {
            full_name: `${firstName} ${lastName}`.trim(),
            role,
            onboarded: false,
            phone,
          },
        });

        toast.success('Registration successful! Please sign in with your credentials.');

        if (signOut) {
          try {
            await signOut();
          } catch {
            /* still send to login */
          }
        }

        navigate('/auth?tab=login', {
          replace: true,
          state: {
            ...(typeof location.state === 'object' && location.state !== null
              ? location.state
              : {}),
            fromRegistration: true,
          },
        });
      }
    } catch (error: any) {
      logger.error('Phone authentication failed', error);
      setError(error.message || 'Phone authentication failed');
      toast.error(error.message || 'Phone authentication failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError('');
    setGoogleLoading(true);
    try {
      if (signInWithGoogle) {
        persistAuthReturnTo(fromState);
        await signInWithGoogle();
        // OAuth redirect will happen automatically
        // The callback handler will check if user needs onboarding or redirect to dashboard
      }
    } catch (error: any) {
      setError(error.message || 'Google sign in failed');
      toast.error(error.message || 'Google sign in failed');
      setGoogleLoading(false);
    }
  };

  return (
    <>
      <Tabs
        defaultValue="email"
        value={authMethod}
        onValueChange={(value) => setAuthMethod(value as 'email' | 'phone')}
        className="w-full"
      >
        <TabsList className="mb-4 grid w-full grid-cols-2">
          <TabsTrigger value="email">Email</TabsTrigger>
          <TabsTrigger value="phone">Phone</TabsTrigger>
        </TabsList>

        <TabsContent value="email">
          <form onSubmit={handleSubmitEmail}>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    placeholder="John"
                    required
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    placeholder="Doe"
                    required
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="emailRegister">Email</Label>
                <Input
                  id="emailRegister"
                  type="email"
                  placeholder="your@email.com"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="company">Company (Optional)</Label>
                <Input
                  id="company"
                  placeholder="Your Company Name"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="passwordRegister">Password</Label>
                <Input
                  id="passwordRegister"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>

              <SmartRoleSelection
                selectedRole={role}
                onRoleChange={(newRole) => setRole(newRole)}
                context={{
                  email,
                  fullName: `${firstName} ${lastName}`.trim(),
                  company,
                  selectedRole: role,
                }}
              />

              {error && <div className="text-sm text-red-500">{error}</div>}
            </CardContent>
            <CardFooter className="flex flex-col space-y-4">
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating account...
                  </>
                ) : (
                  'Create Account'
                )}
              </Button>
              <SocialLogin onGoogleSignIn={handleGoogleSignIn} />
            </CardFooter>
          </form>
        </TabsContent>

        <TabsContent value="phone">
          <form onSubmit={handleSubmitPhone}>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstNamePhone">First Name</Label>
                  <Input
                    id="firstNamePhone"
                    placeholder="John"
                    required
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastNamePhone">Last Name</Label>
                  <Input
                    id="lastNamePhone"
                    placeholder="Doe"
                    required
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="phoneRegister">Phone Number</Label>
                <Input
                  id="phoneRegister"
                  type="tel"
                  placeholder="08012345678"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">Nigerian format (e.g., 08012345678)</p>
              </div>

              {otpSent && (
                <div className="space-y-2">
                  <Label htmlFor="otp">Enter OTP sent to your phone</Label>
                  <InputOTP maxLength={6} value={otp} onChange={setOtp}>
                    <InputOTPGroup>
                      <InputOTPSlot index={0} />
                      <InputOTPSlot index={1} />
                      <InputOTPSlot index={2} />
                      <InputOTPSlot index={3} />
                      <InputOTPSlot index={4} />
                      <InputOTPSlot index={5} />
                    </InputOTPGroup>
                  </InputOTP>
                </div>
              )}

              <SmartRoleSelection
                selectedRole={role}
                onRoleChange={(newRole) => setRole(newRole)}
                context={{
                  email: phone, // Use phone as identifier for phone registration
                  fullName: `${firstName} ${lastName}`.trim(),
                  firstName,
                  lastName,
                  company,
                  phone,
                  selectedRole: role,
                }}
              />

              {error && <div className="text-sm text-red-500">{error}</div>}
            </CardContent>
            <CardFooter className="flex flex-col space-y-4">
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {otpSent ? 'Verifying OTP...' : 'Sending OTP...'}
                  </>
                ) : otpSent ? (
                  'Verify OTP'
                ) : (
                  'Send OTP'
                )}
              </Button>
              {otpSent && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setOtpSent(false)}
                  className="w-full"
                >
                  Resend OTP
                </Button>
              )}
            </CardFooter>
          </form>
        </TabsContent>
      </Tabs>
    </>
  );
};

export default RegisterForm;
