import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { UserRole } from '@/contexts/auth/types';

export function ManualUserCreation() {
  const [fullName, setFullName] = useState('Abdul Himma');
  const [email, setEmail] = useState('abdul.himma@example.com');
  const [selectedRole, setSelectedRole] = useState<UserRole>('agent');
  const [isLoading, setIsLoading] = useState(false);

  const roles: UserRole[] = ['admin', 'owner', 'agent', 'tenant', 'vendor', 'user', 'manager'];

  const createUserManually = async () => {
    if (!fullName.trim() || !email.trim()) {
      toast.error('Please enter both name and email');
      return;
    }

    setIsLoading(true);
    try {
      console.log(`Creating user via Supabase Auth: ${fullName} (${email}) with role: ${selectedRole}`);

      // Use Supabase Auth to create a real user
      const { data, error } = await supabase.auth.signUp({
        email: email,
        password: 'TempPassword123!', // Temporary password
        options: {
          data: {
            full_name: fullName,
            role: selectedRole
          }
        }
      });

      if (error) {
        console.error('Error creating user via Auth:', error);
        throw error;
      }

      if (data.user) {
        console.log('User created successfully via Auth:', data.user.id);
        
        // The handle_new_user trigger should automatically create profile and role
        toast.success(`Successfully created user: ${fullName} with role: ${selectedRole}`);
        toast.info('User created with temporary password: TempPassword123!');
        
        // Clear form
        setFullName('');
        setEmail('');
        setSelectedRole('user');
      } else {
        throw new Error('User creation returned no data');
      }

    } catch (error: any) {
      console.error('Error creating user:', error);
      toast.error(`Failed to create user: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>👤 Manual User Creation</CardTitle>
        <p className="text-sm text-muted-foreground">
          Create users directly in the database (bypass signup process)
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="fullName">Full Name</Label>
            <Input
              id="fullName"
              placeholder="Abdul Himma"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />
          </div>
          
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="abdul.himma@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
        </div>

        <div>
          <Label htmlFor="role">Role</Label>
          <Select value={selectedRole} onValueChange={(value) => setSelectedRole(value as UserRole)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {roles.map((role) => (
                <SelectItem key={role} value={role}>
                  {role.charAt(0).toUpperCase() + role.slice(1)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Button onClick={createUserManually} disabled={isLoading} className="w-full">
          {isLoading ? 'Creating User...' : 'Create User Manually'}
        </Button>

        <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-sm">
          <p className="font-semibold text-green-800 mb-2">✅ How This Works:</p>
          <ul className="list-disc list-inside text-green-700 space-y-1">
            <li>Creates real authenticated users via Supabase Auth</li>
            <li>Users can log in with the temporary password: TempPassword123!</li>
            <li>Automatically creates profile and assigns role via database trigger</li>
            <li>Users will appear in all admin interfaces and dropdowns</li>
            <li>This is the proper way to create users in Supabase</li>
          </ul>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm">
          <p className="font-semibold text-blue-800 mb-2">How to use:</p>
          <ol className="list-decimal list-inside text-blue-700 space-y-1">
            <li>Enter the user's full name and email</li>
            <li>Select their role (e.g., "agent" for Abdul Himma)</li>
            <li>Click "Create User Manually"</li>
            <li>User will be created with temporary password: TempPassword123!</li>
            <li>Check User Database tab to verify creation</li>
            <li>Test Agent Dropdown in Add Property form</li>
            <li>User can log in and change password if needed</li>
          </ol>
        </div>
      </CardContent>
    </Card>
  );
}
