import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { profileFullName } from '@/lib/profileDisplayName';

export function UserDatabaseCheck() {
  const [users, setUsers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const checkUsers = async () => {
    setIsLoading(true);
    try {
      console.log('Checking users in database...');

      // Check profiles table
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, email, created_at')
        .order('created_at', { ascending: false });

      if (profilesError) {
        console.error('Error fetching profiles:', profilesError);
        throw profilesError;
      }

      console.log('Profiles found:', profiles);

      // Check user_roles table
      const { data: roles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role');

      if (rolesError) {
        console.error('Error fetching user roles:', rolesError);
        throw rolesError;
      }

      console.log('User roles found:', roles);

      // Combine data
      const rolesByUserId =
        roles?.reduce((acc: any, roleItem: any) => {
          const { user_id, role } = roleItem;
          if (!acc[user_id]) {
            acc[user_id] = [];
          }
          acc[user_id].push(role);
          return acc;
        }, {}) || {};

      const usersWithRoles =
        profiles?.map((profile) => ({
          ...profile,
          full_name: profileFullName(profile),
          roles: rolesByUserId[profile.id] || ['No role assigned'],
        })) || [];

      console.log('Users with roles:', usersWithRoles);
      setUsers(usersWithRoles);

      toast.success(`Found ${usersWithRoles.length} users in database`);
    } catch (error: any) {
      console.error('Error checking users:', error);
      toast.error(`Failed to check users: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const checkSpecificUser = async () => {
    setIsLoading(true);
    try {
      console.log('Searching for Abdul Himma...');

      // Search for Abdul Himma specifically
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, email, created_at')
        .or(
          'first_name.ilike.%abdul%,last_name.ilike.%himma%,first_name.ilike.%himma%,last_name.ilike.%abdul%'
        );

      if (profilesError) {
        console.error('Error searching for Abdul Himma:', profilesError);
        throw profilesError;
      }

      console.log('Abdul Himma search results:', profiles);

      if (profiles && profiles.length > 0) {
        // Get roles for found users
        const userIds = profiles.map((p) => p.id);
        const { data: roles, error: rolesError } = await supabase
          .from('user_roles')
          .select('user_id, role')
          .in('user_id', userIds);

        if (rolesError) {
          console.error('Error fetching roles for Abdul Himma:', rolesError);
        }

        console.log('Abdul Himma roles:', roles);

        const usersWithRoles = profiles.map((profile) => ({
          ...profile,
          full_name: profileFullName(profile),
          roles: roles?.filter((r) => r.user_id === profile.id).map((r) => r.role) || [
            'No role assigned',
          ],
        }));

        setUsers(usersWithRoles);
        toast.success(`Found ${profiles.length} user(s) matching "Abdul Himma"`);
      } else {
        setUsers([]);
        toast.info('No users found matching "Abdul Himma"');
      }
    } catch (error: any) {
      console.error('Error searching for Abdul Himma:', error);
      toast.error(`Failed to search: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>🔍 User Database Check</CardTitle>
        <p className="text-sm text-muted-foreground">
          Check what users actually exist in the database and their roles
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Button onClick={checkUsers} disabled={isLoading}>
            {isLoading ? 'Checking...' : 'Check All Users'}
          </Button>
          <Button onClick={checkSpecificUser} disabled={isLoading} variant="outline">
            {isLoading ? 'Searching...' : 'Find Abdul Himma'}
          </Button>
        </div>

        {users.length > 0 && (
          <div className="mt-6">
            <h4 className="mb-3 font-semibold">Users Found in Database:</h4>
            <div className="space-y-2">
              {users.map((user) => (
                <div key={user.id} className="rounded-lg border p-3">
                  <p className="font-medium">{user.full_name || 'No name'}</p>
                  <p className="text-sm text-muted-foreground">{user.email}</p>
                  <p className="text-xs text-muted-foreground">ID: {user.id}</p>
                  <p className="text-xs text-blue-600">
                    Roles: {Array.isArray(user.roles) ? user.roles.join(', ') : user.roles}
                  </p>
                  <p className="text-xs text-gray-500">
                    Created: {new Date(user.created_at).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm">
          <p className="mb-2 font-semibold text-blue-800">What this tool does:</p>
          <ul className="list-inside list-disc space-y-1 text-blue-700">
            <li>
              <strong>Check All Users:</strong> Shows all users in profiles table with their roles
            </li>
            <li>
              <strong>Find Abdul Himma:</strong> Specifically searches for Abdul Himma by name
            </li>
            <li>Results show user ID, name, email, roles, and creation date</li>
            <li>Console logs provide detailed debugging information</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
