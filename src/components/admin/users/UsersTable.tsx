import { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { format, isValid, parseISO } from 'date-fns';
import { MoreHorizontal, ShieldCheck, Copy, Mail } from 'lucide-react';
import { toast } from 'sonner';

import { UserProfileWithRole } from '@/hooks/useAdminUsers';
import { getRoleDisplay } from '@/contexts/auth/authUtils';
import { useRole } from '@/hooks/useRole';
import { ManageUserRolesSheet } from '@/components/admin/roles/ManageUserRolesSheet';

interface UsersTableProps {
  users: UserProfileWithRole[];
  /** Optional: shown when a search/filter has been applied and produced no rows. */
  filteredEmptyMessage?: string;
}

function formatJoinedDate(value: string): string {
  if (!value) return '—';
  const parsed = parseISO(value);
  if (!isValid(parsed)) return '—';
  return format(parsed, 'PPP');
}

async function copyToClipboard(value: string, label: string) {
  try {
    await navigator.clipboard.writeText(value);
    toast.success(`${label} copied`);
  } catch {
    toast.error(`Could not copy ${label.toLowerCase()}`);
  }
}

export function UsersTable({ users, filteredEmptyMessage = 'No users found.' }: UsersTableProps) {
  const { can } = useRole();
  const canManageRoles = can('roles.assign') || can('users.write');

  const [sheetUser, setSheetUser] = useState<UserProfileWithRole | null>(null);

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>User</TableHead>
            <TableHead>Roles</TableHead>
            <TableHead>Joined</TableHead>
            <TableHead className="w-12 text-right">
              <span className="sr-only">Actions</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.length === 0 ? (
            <TableRow>
              <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                {filteredEmptyMessage}
              </TableCell>
            </TableRow>
          ) : (
            users.map((user) => {
              const roles = user.user_roles?.length ? user.user_roles : [{ role: 'user' as const }];
              return (
                <TableRow key={user.id}>
                  <TableCell>
                    <div className="font-medium">{user.full_name || 'Unnamed user'}</div>
                    <div className="text-sm text-muted-foreground">{user.email || '—'}</div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1.5">
                      {roles.map(({ role }) => (
                        <Badge
                          key={role}
                          variant="outline"
                          className="rounded-full border-primary/25 bg-primary/5"
                        >
                          {getRoleDisplay(role)}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>{formatJoinedDate(user.created_at)}</TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label={`Actions for ${user.full_name || user.email || 'user'}`}
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-56">
                        <DropdownMenuLabel>User actions</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          disabled={!canManageRoles}
                          onSelect={(event) => {
                            event.preventDefault();
                            setSheetUser(user);
                          }}
                        >
                          <ShieldCheck className="mr-2 h-4 w-4" />
                          Manage roles
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          disabled={!user.email}
                          onSelect={(event) => {
                            event.preventDefault();
                            if (user.email) void copyToClipboard(user.email, 'Email');
                          }}
                        >
                          <Mail className="mr-2 h-4 w-4" />
                          Copy email
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onSelect={(event) => {
                            event.preventDefault();
                            void copyToClipboard(user.id, 'User ID');
                          }}
                        >
                          <Copy className="mr-2 h-4 w-4" />
                          Copy user ID
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>

      {sheetUser ? (
        <ManageUserRolesSheet
          user={sheetUser}
          isOpen
          onOpenChange={(open) => {
            if (!open) setSheetUser(null);
          }}
        />
      ) : null}
    </>
  );
}
