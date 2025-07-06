
"use client";

import type { AuthUser, UserRole } from '@/lib/types';
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
import { Button } from './ui/button';
import { MoreHorizontal, Shield, User, Trash2 } from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuSub,
    DropdownMenuSubContent,
    DropdownMenuSubTrigger,
    DropdownMenuTrigger,
    DropdownMenuRadioGroup,
    DropdownMenuRadioItem,
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

interface UserListProps {
  users: AuthUser[];
  currentUser: AuthUser;
  changeUserRole: (targetUid: string, newRole: UserRole) => Promise<void>;
  removeUserFromTenant: (targetUid: string) => Promise<void>;
}

export default function UserList({ users, currentUser, changeUserRole, removeUserFromTenant }: UserListProps) {
  if (users.length === 0) {
    return (
      <div className="text-center text-muted-foreground py-10">
        <p>No other users found in this organization.</p>
      </div>
    );
  }

  const handleRoleChange = (uid: string, role: string) => {
    changeUserRole(uid, role as UserRole);
  }

  return (
    <Card>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Username</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Role</TableHead>
            <TableHead className="text-right w-16"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user) => {
            const role = user.activeRole;
            return (
                <TableRow key={user.uid}>
                    <TableCell className="font-medium">{user.username}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                        <Badge variant={role === 'owner' || role === 'admin' ? 'default' : 'secondary'}>
                        {role}
                        </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                        {currentUser.uid !== user.uid && currentUser.activeRole === 'owner' && (
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-8 w-8">
                                        <MoreHorizontal className="h-4 w-4" />
                                        <span className="sr-only">Manage user</span>
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuLabel>Manage User</DropdownMenuLabel>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuSub>
                                        <DropdownMenuSubTrigger>
                                            <Shield className="mr-2 h-4 w-4" />
                                            <span>Change Role</span>
                                        </DropdownMenuSubTrigger>
                                        <DropdownMenuSubContent>
                                            <DropdownMenuRadioGroup value={role || 'staff'} onValueChange={(value) => handleRoleChange(user.uid, value)}>
                                                <DropdownMenuRadioItem value="admin">Admin</DropdownMenuRadioItem>
                                                <DropdownMenuRadioItem value="staff">Staff</DropdownMenuRadioItem>
                                            </DropdownMenuRadioGroup>
                                        </DropdownMenuSubContent>
                                    </DropdownMenuSub>
                                    <DropdownMenuSeparator />
                                    <AlertDialog>
                                      <AlertDialogTrigger asChild>
                                        <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-destructive focus:bg-destructive/10 focus:text-destructive">
                                          <Trash2 className="mr-2 h-4 w-4" />
                                          <span>Remove User</span>
                                        </DropdownMenuItem>
                                      </AlertDialogTrigger>
                                      <AlertDialogContent>
                                        <AlertDialogHeader>
                                          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                          <AlertDialogDescription>
                                            This will remove '{user.username}' from the organization. They will no longer have access. This action cannot be undone.
                                          </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                                          <AlertDialogAction onClick={() => removeUserFromTenant(user.uid)} className="bg-destructive hover:bg-destructive/90">
                                            Confirm & Remove
                                          </AlertDialogAction>
                                        </AlertDialogFooter>
                                      </AlertDialogContent>
                                    </AlertDialog>

                                </DropdownMenuContent>
                            </DropdownMenu>
                        )}
                    </TableCell>
                </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </Card>
  );
}
