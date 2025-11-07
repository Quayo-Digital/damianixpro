import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CardContent, CardFooter } from "@/components/ui/card";
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/auth';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { toast } from "sonner";
import { Link, useNavigate } from "react-router-dom";

// Simple placeholder for SocialLogin
const SocialLogin = ({ onGoogleSignIn }: { onGoogleSignIn: () => void }) => (
  <Button variant="outline" type="button" onClick={onGoogleSignIn} className="w-full">
    Continue with Google
  </Button>
);

const LoginForm = () => {
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [authMethod, setAuthMethod] = useState<"email" | "phone">("email");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const { signIn, signInWithGoogle, signInWithPhone, verifyOtp, resetPassword } = useAuth();
  const navigate = useNavigate();

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const result = await signIn(email, password);
      
      if (result && !result.error) {
        toast.success("Login successful!");
        // Redirect to the dashboard dispatcher, it will handle role-based routing
        navigate('/dashboard');
      }
    } catch (error: any) {
      setError(error.message || "Authentication failed");
    } finally {
      setIsLoading(false);
    }
  };
  
  const redirectToDashboard = () => {
    // This function is now simpler, always goes to the dispatcher.
    navigate('/dashboard');
  };
  
  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);
    
    try {
      if (!signInWithPhone) {
        throw new Error("Phone sign in not available");
      }
      
      if (!otpSent) {
        await signInWithPhone(phone);
        setOtpSent(true);
        toast.success("OTP sent to your phone. Please verify.");
      } else {
        // Verify OTP
        if (!verifyOtp) {
          throw new Error("OTP verification not available");
        }
        
        if (otp.length !== 6) {
          throw new Error("Please enter a valid 6-digit OTP");
        }
        
        await verifyOtp(phone, otp);
        toast.success("Login successful!");
        
        // Redirect to the dashboard dispatcher
        redirectToDashboard();
      }
    } catch (error: any) {
      console.error("Phone authentication failed:", error);
      setError(error.message || "Phone authentication failed");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError("");
    try {
      if (signInWithGoogle) {
        await signInWithGoogle();
        // After google sign-in, redirect to the dashboard dispatcher
        setTimeout(() => {
          navigate('/dashboard');
        }, 1000);
      }
    } catch (error: any) {
      setError(error.message || "Google sign in failed");
    }
  };
  
  const handlePasswordReset = async () => {
    if (!email) {
      toast.error("Please enter your email address first");
      return;
    }
    
    try {
      setIsLoading(true);
      if (resetPassword) {
        await resetPassword(email);
        toast.success("Password reset link sent to your email");
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to send password reset email");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Tabs 
        defaultValue="email" 
        value={authMethod} 
        onValueChange={(value) => setAuthMethod(value as "email" | "phone")}
        className="w-full"
      >
        <TabsList className="grid w-full grid-cols-2 mb-4">
          <TabsTrigger value="email">Email</TabsTrigger>
          <TabsTrigger value="phone">Phone</TabsTrigger>
        </TabsList>
        
        <TabsContent value="email">
          <form onSubmit={handleEmailSubmit}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input 
                  id="email" 
                  type="email" 
                  placeholder="your@email.com" 
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                  <Button type="button" variant="link" size="sm" onClick={handlePasswordReset} className="p-0 h-auto text-xs">
                    Forgot password?
                  </Button>
                </div>
                <Input 
                  id="password" 
                  type="password" 
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              {error && (
                <div className="text-red-500 text-sm">{error}</div>
              )}
            </CardContent>
            <CardFooter className="flex flex-col space-y-4">
              <Button 
                type="submit" 
                className="w-full" 
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  "Sign In"
                )}
              </Button>
              <SocialLogin onGoogleSignIn={handleGoogleSignIn} />
            </CardFooter>
          </form>
        </TabsContent>
        
        <TabsContent value="phone">
          <form onSubmit={handlePhoneSubmit}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input 
                  id="phone" 
                  type="tel" 
                  placeholder="08012345678" 
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  disabled={otpSent}
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
              {error && (
                <div className="text-red-500 text-sm">{error}</div>
              )}
            </CardContent>
            <CardFooter className="flex flex-col space-y-4">
              <Button 
                type="submit" 
                className="w-full" 
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {otpSent ? "Verifying OTP..." : "Sending OTP..."}
                  </>
                ) : (
                  otpSent ? "Verify OTP" : "Send OTP"
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

export default LoginForm;
