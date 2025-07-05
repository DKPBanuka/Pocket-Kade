
"use client";

import type { AuthUser } from '@/lib/types';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface UserListProps {
  users: AuthUser[];
}

export default function UserList({ users }: UserListProps) {
  if (users.length === 0) {
    return (
      <div className="text-center text-muted-foreground py-10">
        <p>No users found.</p>
      </div>
    );
  }

  const getUserPrimaryRole = (user: AuthUser) => {
    const roles = Object.values(user.tenants || {});
    if (roles.includes('owner')) return 'owner';
    if (roles.includes('admin')) return 'admin';
    if (roles.includes('staff')) return 'staff';
    return 'N/A';
  }

  return (
    <Card>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Username</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Role</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user) => {
            const primaryRole = getUserPrimaryRole(user);
            return (
                <TableRow key={user.uid}>
                <TableCell className="font-medium">{user.username}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>
                    <Badge variant={primaryRole === 'owner' || primaryRole === 'admin' ? 'default' : 'secondary'}>
                    {primaryRole}
                    </Badge>
                </TableCell>
                </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </Card>
  );
}
