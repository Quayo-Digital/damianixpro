import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2 } from 'lucide-react';
import { useAuth } from "@/contexts/auth/AuthProvider";
import { UserRole } from "@/contexts/auth/types";
import { useNavigate } from 'react-router-dom';
import { toast } from "sonner";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { supabase } from '@/integrations/supabase/client';
import { SmartRoleSelection } from "@/components/auth/SmartRoleSelection";

// Simple placeholder for SocialLogin
const SocialLogin = ({ onGoogleSignIn }: { onGoogleSignIn: () => void }) => (
  <Button variant="outline" type="button" onClick={onGoogleSignIn} className="w-full">
    Continue with Google
  </Button>
);

const RegisterForm = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [company, setCompany] = useState("");
  const [role, setRole] = useState<UserRole>("tenant");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [authMethod, setAuthMethod] = useState<"email" | "phone">("email");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  
  const { signUp, signInWithGoogle, signInWithPhone, verifyOtp, refreshUserRole } = useAuth();

  const handleSubmitEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      if (!signUp) {
        throw new Error("Sign up function not available");
      }
      
      console.log(`Registering user with role: ${role}`);
      
      // Pass the full_name, company, and role as user metadata
      const result = await signUp(email, password, { 
        full_name: fullName, 
        company: company || undefined,
        role,
        onboarded: false // Mark as not onboarded yet
      });
      
      // After successful registration, show success message
      toast.success(`Registration successful! Welcome, ${fullName}!`);
      
      // Fetch the user role immediately to ensure it's available for redirection
      if (result && !result.error) {
        await refreshUserRole();
      }
      
      // Redirect to onboarding page for profile completion
      navigate('/onboarding');
      
    } catch (error: any) {
      console.error("Registration failed:", error);
      setError(error.message || "Registration failed");
      toast.error(error.message || "Registration failed");
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleSubmitPhone = async (e: React.FormEvent) => {
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
        
        const response = await verifyOtp(phone, otp);
        
        // Update user metadata after verification
        await supabase.auth.updateUser({
          data: {
            full_name: fullName,
            role,
            onboarded: false,
            phone
          }
        });
        
        toast.success("Phone verified successfully!");
        
        // Refresh role then redirect to onboarding page
        await refreshUserRole();
        navigate('/onboarding');
      }
    } catch (error: any) {
      console.error("Phone authentication failed:", error);
      setError(error.message || "Phone authentication failed");
      toast.error(error.message || "Phone authentication failed");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError("");
    try {
      if (signInWithGoogle) {
        await signInWithGoogle();
        // Google sign-in will be handled by the auth state change event
      }
    } catch (error: any) {
      setError(error.message || "Google sign in failed");
      toast.error(error.message || "Google sign in failed");
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
          <form onSubmit={handleSubmitEmail}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name</Label>
                <Input 
                  id="fullName" 
                  placeholder="John Doe" 
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                />
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
                  fullName,
                  company,
                  selectedRole: role
                }}
              />
              
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
                    Creating account...
                  </>
                ) : (
                  "Create Account"
                )}
              </Button>
              <SocialLogin onGoogleSignIn={handleGoogleSignIn} />
            </CardFooter>
          </form>
        </TabsContent>
        
        <TabsContent value="phone">
          <form onSubmit={handleSubmitPhone}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="fullNamePhone">Full Name</Label>
                <Input 
                  id="fullNamePhone" 
                  placeholder="John Doe" 
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                />
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
                  fullName,
                  company,
                  phone,
                  selectedRole: role
                }}
              />
              
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

export default RegisterForm;
