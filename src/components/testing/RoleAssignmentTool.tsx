import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { UserRole } from '@/contexts/auth/types';

export function RoleAssignmentTool() {
  const [email, setEmail] = useState('');
  const [selectedRole, setSelectedRole] = useState<UserRole>('agent');
  const [isLoading, setIsLoading] = useState(false);
  const [users, setUsers] = useState<any[]>([]);

  const roles: UserRole[] = [
    'admin',
    'owner',
    'agent',
    'tenant',
    'vendor',
    'user',
    'manager',
    'accountant',
    'facility_manager',
  ];

  const searchUsers = async () => {
    if (!email.trim()) {
      toast.error('Please enter an email to search');
      return;
    }

    setIsLoading(true);
    try {
      // Search for users by email
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select(
          `
          id,
          email,
          full_name,
          user_roles:user_roles(role)
        `
        )
        .ilike('email', `%${email}%`);

      if (error) throw error;

      console.log('Found users:', profiles);
      setUsers(profiles || []);

      if (!profiles || profiles.length === 0) {
        toast.info('No users found with that email');
      } else {
        toast.success(`Found ${profiles.length} user(s)`);
      }
    } catch (error: any) {
      console.error('Error searching users:', error);
      toast.error(`Failed to search users: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const assignRole = async (userId: string, userEmail: string) => {
    setIsLoading(true);
    try {
      console.log(`Assigning role '${selectedRole}' to user ${userId} (${userEmail})`);

      // First, delete existing roles for this user
      const { error: deleteError } = await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', userId);

      if (deleteError) {
        console.error('Error deleting old roles:', deleteError);
        throw deleteError;
      }

      // Then insert the new role
      const { error: insertError } = await supabase
        .from('user_roles')
        .insert([{ user_id: userId, role: selectedRole }]);

      if (insertError) {
        console.error('Error inserting new role:', insertError);
        throw insertError;
      }

      toast.success(`Successfully assigned '${selectedRole}' role to ${userEmail}`);

      // Refresh the search to show updated roles
      await searchUsers();
    } catch (error: any) {
      console.error('Error assigning role:', error);
      toast.error(`Failed to assign role: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>🔧 Role Assignment Tool</CardTitle>
        <p className="text-sm text-muted-foreground">
          Quick utility to assign roles to users (especially for fixing agent dropdown)
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div>
            <Label htmlFor="email">Search User by Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="abdul@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && searchUsers()}
            />
          </div>

          <div>
            <Label htmlFor="role">Role to Assign</Label>
            <Select
              value={selectedRole}
              onValueChange={(value) => setSelectedRole(value as UserRole)}
            >
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

          <div className="flex items-end">
            <Button onClick={searchUsers} disabled={isLoading} className="w-full">
              {isLoading ? 'Searching...' : 'Search Users'}
            </Button>
          </div>
        </div>

        {users.length > 0 && (
          <div className="mt-6">
            <h4 className="mb-3 font-semibold">Found Users:</h4>
            <div className="space-y-2">
              {users.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div>
                    <p className="font-medium">{user.full_name || 'No name'}</p>
                    <p className="text-sm text-muted-foreground">{user.email}</p>
                    <p className="text-xs text-muted-foreground">
                      Current roles: {user.user_roles?.map((r: any) => r.role).join(', ') || 'None'}
                    </p>
                  </div>
                  <Button
                    onClick={() => assignRole(user.id, user.email)}
                    disabled={isLoading}
                    size="sm"
                  >
                    Assign {selectedRole}
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm">
          <p className="mb-2 font-semibold text-blue-800">How to use:</p>
          <ol className="list-inside list-decimal space-y-1 text-blue-700">
            <li>Enter the email of the user you want to assign a role to</li>
            <li>Select the role you want to assign (e.g., "agent" for Abdul Himma)</li>
            <li>Click "Search Users" to find the user</li>
            <li>Click "Assign [role]" button next to the user</li>
            <li>Go back to Add Property form and check if agent appears in dropdown</li>
          </ol>
        </div>
      </CardContent>
    </Card>
  );
}
