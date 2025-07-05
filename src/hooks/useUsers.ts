
"use client";

import { useState, useEffect } from 'react';
import { useToast } from "@/hooks/use-toast";
import type { AuthUser } from '@/lib/types';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { useAuth } from '@/contexts/auth-context';

const USERS_COLLECTION = 'users';

export function useUsers() {
  const [users, setUsers] = useState<AuthUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const { user: currentUser } = useAuth();

  useEffect(() => {
    if (!currentUser?.activeTenantId) {
      setIsLoading(false);
      setUsers([]);
      return;
    }

    const usersQuery = query(
      collection(db, USERS_COLLECTION),
      where(`tenants.${currentUser.activeTenantId}`, 'in', ['owner', 'admin', 'staff'])
    );

    const unsubscribe = onSnapshot(usersQuery, 
      (snapshot) => {
        const usersData: AuthUser[] = snapshot.docs.map(doc => {
          const data = doc.data();
          return {
            uid: doc.id,
            email: data.email,
            username: data.username,
            tenants: data.tenants || {},
            // This hook returns a list of users in the tenant, so their active roles aren't relevant here.
            activeRole: data.tenants[currentUser.activeTenantId!], 
            activeTenantId: currentUser.activeTenantId,
          } as AuthUser;
        });
        setUsers(usersData);
        setIsLoading(false);
      },
      (error) => {
        console.error("Firebase snapshot error fetching users:", error);
        toast({ title: "Error loading users", description: "Could not fetch users from the database.", variant: "destructive" });
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, [toast, currentUser]);
  
  return { users, isLoading };
}
