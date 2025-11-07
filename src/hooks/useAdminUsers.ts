
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { UserRole } from '@/contexts/auth';

export interface UserProfileWithRole {
  id: string;
  full_name: string | null;
  email: string | null;
  created_at: string;
  user_roles: { role: UserRole }[];
}

const fetchUsers = async (): Promise<UserProfileWithRole[]> => {
  // 1. Fetch all profiles
  const { data: profiles, error: profilesError } = await supabase
    .from('profiles')
    .select('id, full_name, email, created_at');

  if (profilesError) {
    console.error('Error fetching profiles:', profilesError);
    throw new Error(profilesError.message);
  }
  if (!profiles) return [];

  // 2. Fetch all user roles
  const { data: roles, error: rolesError } = await supabase
    .from('user_roles')
    .select('user_id, role');

  if (rolesError) {
    console.error('Error fetching user roles:', rolesError);
    throw new Error(rolesError.message);
  }
  
  const rolesByUserId = roles 
    ? roles.reduce((acc, roleItem) => {
        const { user_id, role } = roleItem;
        if (!user_id || !role) return acc;
        if (!acc[user_id]) {
          acc[user_id] = [];
        }
        acc[user_id].push({ role: role as UserRole });
        return acc;
      }, {} as Record<string, { role: UserRole }[]>)
    : {};

  const usersWithRoles = profiles.map(profile => ({
    ...profile,
    user_roles: rolesByUserId[profile.id] || [],
  }));

  return usersWithRoles;
};

export const useAdminUsers = () => {
  return useQuery({
    queryKey: ['admin-users'],
    queryFn: fetchUsers,
  });
};
