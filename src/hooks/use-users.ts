
"use client";

import { useState, useEffect, useCallback } from 'react';
import { useToast } from "@/hooks/use-toast";
import type { AuthUser, UserRole } from '@/lib/types';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, query, where, doc, updateDoc, deleteField } from 'firebase/firestore';
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
  
  const changeUserRole = useCallback(async (targetUid: string, newRole: UserRole) => {
    if (currentUser?.activeRole !== 'owner' || !currentUser.activeTenantId) {
        toast({ title: "Permission Denied", description: "Only the owner can change roles.", variant: "destructive" });
        return;
    }
    if (currentUser.uid === targetUid) {
        toast({ title: "Action Not Allowed", description: "You cannot change your own role.", variant: "destructive"});
        return;
    }

    const userDocRef = doc(db, USERS_COLLECTION, targetUid);
    try {
        await updateDoc(userDocRef, {
            [`tenants.${currentUser.activeTenantId}`]: newRole
        });
        toast({ title: "Role Updated", description: "The user's role has been successfully changed." });
    } catch (error) {
        console.error("Error changing user role:", error);
        toast({ title: "Error", description: "Failed to update the user's role.", variant: "destructive" });
    }
  }, [currentUser, toast]);

  const removeUserFromTenant = useCallback(async (targetUid: string) => {
    if (currentUser?.activeRole !== 'owner' || !currentUser.activeTenantId) {
        toast({ title: "Permission Denied", description: "Only the owner can remove users.", variant: "destructive" });
        return;
    }
    if (currentUser.uid === targetUid) {
        toast({ title: "Action Not Allowed", description: "You cannot remove yourself from the organization.", variant: "destructive"});
        return;
    }
      
    const userDocRef = doc(db, USERS_COLLECTION, targetUid);
    try {
      await updateDoc(userDocRef, {
          [`tenants.${currentUser.activeTenantId}`]: deleteField()
      });
      toast({ title: "User Removed", description: "The user has been removed from the organization." });
    } catch (error) {
        console.error("Error removing user:", error);
        toast({ title: "Error", description: "Failed to remove the user.", variant: "destructive" });
    }
  }, [currentUser, toast]);

  return { users, isLoading, changeUserRole, removeUserFromTenant };
}
