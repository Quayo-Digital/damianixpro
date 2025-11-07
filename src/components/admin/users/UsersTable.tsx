
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { UserProfileWithRole } from '@/hooks/useAdminUsers';
import { Badge } from "@/components/ui/badge";
import { format } from 'date-fns';
import { getRoleDisplay } from "@/contexts/auth/authUtils";

interface UsersTableProps {
  users: UserProfileWithRole[];
}

export function UsersTable({ users }: UsersTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>User</TableHead>
          <TableHead>Role</TableHead>
          <TableHead>Joined Date</TableHead>
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
                <Badge variant="outline">{getRoleDisplay(user.user_roles[0]?.role || 'user')}</Badge>
              </TableCell>
              <TableCell>{format(new Date(user.created_at), 'PPP')}</TableCell>
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
  );
}
