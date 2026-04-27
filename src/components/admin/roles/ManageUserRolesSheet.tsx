import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { UserProfileWithRole } from '@/hooks/useAdminUsers';
import { UserRole } from '@/contexts/auth/types';
import { getRoleDisplay, isValidUserRole } from '@/contexts/auth/authUtils';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface ManageUserRolesSheetProps {
  user: UserProfileWithRole;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

const allRoles: UserRole[] = ['admin', 'owner', 'agent', 'tenant', 'vendor', 'user', 'manager'];

async function updateUserRoles({ userId, roles }: { userId: string; roles: UserRole[] }) {
  const rolesToSet: UserRole[] = roles.length > 0 ? roles : ['user'];

  const { error: deleteError } = await supabase.from('user_roles').delete().eq('user_id', userId);

  if (deleteError) {
    throw new Error(`Failed to delete old roles: ${deleteError.message}`);
  }

  const newRoles = rolesToSet.map((role) => ({ user_id: userId, role }));
  const { error: insertError } = await supabase.from('user_roles').insert(newRoles);

  if (insertError) {
    throw new Error(`Failed to insert new roles: ${insertError.message}`);
  }

  return null;
}

export function ManageUserRolesSheet({ user, isOpen, onOpenChange }: ManageUserRolesSheetProps) {
  const queryClient = useQueryClient();
  const [selectedRoles, setSelectedRoles] = useState<UserRole[]>([]);

  useEffect(() => {
    if (user) {
      setSelectedRoles(user.user_roles.map((r) => r.role).filter(isValidUserRole));
    }
  }, [user]);

  const mutation = useMutation({
    mutationFn: updateUserRoles,
    onSuccess: () => {
      toast.success('User roles updated successfully.');
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      onOpenChange(false);
    },
    onError: (error) => {
      toast.error(`Error updating roles: ${error.message}`);
    },
  });

  const handleRoleToggle = (role: UserRole) => {
    setSelectedRoles((prev) =>
      prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role]
    );
  };

  const handleSaveChanges = () => {
    mutation.mutate({ userId: user.id, roles: selectedRoles });
  };

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent className="flex flex-col">
        <SheetHeader>
          <SheetTitle>Manage Roles for {user.full_name || user.email}</SheetTitle>
          <SheetDescription>
            Assign or remove roles for this user. Changes will take effect immediately.
          </SheetDescription>
        </SheetHeader>
        <div className="flex-grow space-y-4 overflow-y-auto py-4">
          <h4 className="font-medium">Available Roles</h4>
          <div className="grid grid-cols-2 gap-4">
            {allRoles.map((role) => (
              <div key={role} className="flex items-center space-x-2">
                <Checkbox
                  id={`role-${role}-${user.id}`}
                  checked={selectedRoles.includes(role)}
                  onCheckedChange={() => handleRoleToggle(role)}
                />
                <Label htmlFor={`role-${role}-${user.id}`} className="w-full cursor-pointer">
                  {getRoleDisplay(role)}
                </Label>
              </div>
            ))}
          </div>
        </div>
        <SheetFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSaveChanges} disabled={mutation.isPending}>
            {mutation.isPending ? 'Saving...' : 'Save Changes'}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
