
"use client";

import { useAuth } from "@/contexts/auth-context";
import { useRouter } from "next/navigation";
import { useUsers } from "@/hooks/use-users";
import { Button } from "@/components/ui/button";
import { Loader2, Plus } from "lucide-react";
import UserList from "@/components/user-list";
import { AddUserDialog } from "@/components/add-user-dialog";
import { useEffect } from "react";
import { useLanguage } from "@/contexts/language-context";

export default function UsersPage() {
    const router = useRouter();
    const { user, isLoading: authLoading } = useAuth();
    const { users, isLoading: usersLoading, changeUserRole, removeUserFromTenant } = useUsers();
    const { t } = useLanguage();

    const isLoading = authLoading || usersLoading;

    useEffect(() => {
      // Redirection logic is now primarily handled by AuthContext
      if (!authLoading && user?.activeRole !== 'owner') {
        router.push('/');
      }
    }, [user, authLoading, router]);

    if (isLoading || !user || user.activeRole !== 'owner') {
        return (
            <div className="flex justify-center items-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="container mx-auto max-w-4xl p-4 sm:p-6 lg:p-8">
            <div className="mb-8 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
                <div>
                <h1 className="text-3xl font-bold font-headline tracking-tight">
                    {t('users.title')}
                </h1>
                <p className="text-muted-foreground">
                    {t('users.desc')}
                </p>
                </div>
                <AddUserDialog>
                    <Button>
                        <Plus className="mr-2 h-4 w-4" />
                        {t('users.add_user')}
                    </Button>
                </AddUserDialog>
            </div>

            <UserList 
                users={users} 
                currentUser={user}
                changeUserRole={changeUserRole}
                removeUserFromTenant={removeUserFromTenant}
            />
        </div>
    );
}
