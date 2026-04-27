import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { UserProfileWithRole } from '@/hooks/useAdminUsers';
import { Badge } from '@/components/ui/badge';
import { getRoleDisplay } from '@/contexts/auth/authUtils';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { ManageUserRolesSheet } from './ManageUserRolesSheet';

interface RolesTableProps {
  users: UserProfileWithRole[];
}

export function RolesTable({ users }: RolesTableProps) {
  const [selectedUser, setSelectedUser] = useState<UserProfileWithRole | null>(null);

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>User</TableHead>
            <TableHead>Roles</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.length > 0 ? (
            users.map((user) => (
              <TableRow key={user.id}>
                <TableCell>
                  <div className="font-medium">{user.full_name || 'N/A'}</div>
                  <div className="text-sm text-muted-foreground">{user.email}</div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {user.user_roles.length > 0 ? (
                      user.user_roles.map((roleInfo) => (
                        <Badge
                          key={roleInfo.role}
                          variant="secondary"
                          className="rounded-full border border-border bg-background dark:bg-muted/30"
                        >
                          {getRoleDisplay(roleInfo.role)}
                        </Badge>
                      ))
                    ) : (
                      <Badge
                        variant="outline"
                        className="rounded-full border-primary/25 bg-primary/5"
                      >
                        User
                      </Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-full border-primary/25 bg-background dark:bg-muted/30"
                    onClick={() => setSelectedUser(user)}
                  >
                    Manage Roles
                  </Button>
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={3} className="h-24 text-center">
                No users found.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
      {selectedUser && (
        <ManageUserRolesSheet
          user={selectedUser}
          isOpen={!!selectedUser}
          onOpenChange={(isOpen) => {
            if (!isOpen) {
              setSelectedUser(null);
            }
          }}
        />
      )}
    </>
  );
}
