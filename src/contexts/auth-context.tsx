
"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { onAuthStateChanged, signOut, type User as FirebaseUser } from 'firebase/auth';
import { doc, getDoc, writeBatch, collection, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import type { AuthUser, UserRole } from '@/lib/types';
import { usePathname, useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
  signOut: () => void;
  // TODO: Add a function to switch tenants
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  signOut: () => {},
});

const unprotectedRoutes = ['/login', '/signup'];

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
      if (firebaseUser) {
        const userDocRef = doc(db, 'users', firebaseUser.uid);
        const userDocSnap = await getDoc(userDocRef);
        
        if (userDocSnap.exists()) {
          const userData = userDocSnap.data();
          const tenants = userData.tenants || {};
          const tenantIds = Object.keys(tenants);

          if (tenantIds.length === 0) {
            // This is a legacy user without a tenant. Let's create one for them.
            const batch = writeBatch(db);

            // 1. Create a new organization for the user
            const orgRef = doc(collection(db, 'organizations'));
            const orgName = `${userData.username}'s Workspace`;
            batch.set(orgRef, {
                name: orgName,
                ownerUid: firebaseUser.uid,
                createdAt: serverTimestamp(),
            });
            const tenantId = orgRef.id;

            // 2. Update the user's document with the new tenant and 'owner' role
            const roleForMigratedUser: UserRole = 'owner';
            batch.update(userDocRef, {
                tenants: {
                    [tenantId]: roleForMigratedUser,
                },
            });
            
            await batch.commit();

            // 3. Set the user state in the app with the newly created tenant info
            setUser({
                uid: firebaseUser.uid,
                email: firebaseUser.email,
                username: userData.username,
                tenants: { [tenantId]: roleForMigratedUser },
                activeTenantId: tenantId,
                activeRole: roleForMigratedUser,
            });

          } else {
            // This is a regular user with one or more tenants.
            let activeTenantId: string | null = null;
            let activeRole: UserRole | null = null;
            
            // Auto-select the first tenant if one exists
            if (tenantIds.length > 0) {
                activeTenantId = tenantIds[0];
                activeRole = tenants[activeTenantId];
            }

            setUser({
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              username: userData.username || firebaseUser.email?.split('@')[0] || `user_${firebaseUser.uid.substring(0,5)}`,
              tenants: tenants,
              activeTenantId: activeTenantId,
              activeRole: activeRole,
            });
          }
        } else {
          // User exists in Auth but not in Firestore. This is expected during
          // the signup process while the user document is being created.
          // We set the user to null and let the signup page complete its logic.
          // On the next login, the document will exist.
          setUser(null);
        }
      } else {
        setUser(null);
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
      if (!isLoading) {
        const isProtectedRoute = !unprotectedRoutes.includes(pathname);
        if (!user && isProtectedRoute) {
          router.push('/login');
        }
        if (user && unprotectedRoutes.includes(pathname)) {
          router.push('/');
        }
        
        // Role-based route protection
        if (user && user.activeRole === 'staff') {
            const staffForbiddenRoutes = ['/users', '/reports', '/suppliers'];
            if (staffForbiddenRoutes.some(route => pathname.startsWith(route))) {
                 router.push('/');
            }
        }
      }
  }, [user, isLoading, pathname, router]);


  const handleSignOut = async () => {
    await signOut(auth);
    setUser(null);
    router.push('/login');
  };

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  // To avoid flicker on protected routes before redirect
  if (!user && !unprotectedRoutes.includes(pathname)) {
     return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, isLoading, signOut: handleSignOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
