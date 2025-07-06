
"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { onAuthStateChanged, signOut, type User as FirebaseUser } from 'firebase/auth';
import { doc, getDoc, onSnapshot, writeBatch, collection, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import type { AuthUser, UserRole, Organization } from '@/lib/types';
import { usePathname, useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

interface AuthContextType {
  user: AuthUser | null;
  organization: Organization | null;
  isLoading: boolean;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  organization: null,
  isLoading: true,
  signOut: () => {},
});

const unprotectedRoutes = ['/login', '/signup', '/accept-invitation'];

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    let orgUnsubscribe: (() => void) | null = null;

    const authUnsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
      // Clean up previous org listener on user change
      if (orgUnsubscribe) {
        orgUnsubscribe();
        orgUnsubscribe = null;
      }
      
      setIsLoading(true);

      if (firebaseUser) {
        const userDocRef = doc(db, 'users', firebaseUser.uid);
        const userDocSnap = await getDoc(userDocRef);
        
        if (userDocSnap.exists()) {
          const userData = userDocSnap.data();
          const tenants = userData.tenants || {};
          const tenantIds = Object.keys(tenants);
          let activeTenantId = tenantIds.length > 0 ? tenantIds[0] : null;

          const currentUser: AuthUser = {
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            username: userData.username,
            tenants: tenants,
            activeTenantId: activeTenantId,
            activeRole: activeTenantId ? tenants[activeTenantId] : null,
            onboardingCompleted: userData.onboardingCompleted || false,
          };
          setUser(currentUser);

          if (currentUser.activeTenantId) {
            const orgDocRef = doc(db, 'organizations', currentUser.activeTenantId);
            orgUnsubscribe = onSnapshot(orgDocRef, (orgDocSnap) => {
                if (orgDocSnap.exists()) {
                    setOrganization({ id: orgDocSnap.id, ...orgDocSnap.data() } as Organization);
                } else {
                    setOrganization(null);
                }
                setIsLoading(false);
            }, (error) => {
                console.error("Error listening to organization:", error);
                setOrganization(null);
                setIsLoading(false);
            });
          } else {
            setOrganization(null);
            setIsLoading(false);
          }
        } else {
          setUser(null);
          setOrganization(null);
          setIsLoading(false);
        }
      } else {
        setUser(null);
        setOrganization(null);
        setIsLoading(false);
      }
    });

    return () => {
        authUnsubscribe();
        if (orgUnsubscribe) {
            orgUnsubscribe();
        }
    };
  }, []);

  useEffect(() => {
    if (isLoading) {
      return;
    }
    
    const isOnboardingRoute = pathname.startsWith('/setup');
    const isProtectedRoute = !unprotectedRoutes.some(route => pathname.startsWith(route)) && !isOnboardingRoute;

    if (!user) {
      if (isProtectedRoute) {
        router.push('/login');
      }
      return;
    }

    if (unprotectedRoutes.some(route => pathname.startsWith(route))) {
      router.push('/');
      return;
    }

    // Onboarding redirection logic
    if (!user.onboardingCompleted && !isOnboardingRoute) {
      router.push('/setup/welcome');
      return;
    }

    if (user.onboardingCompleted && user.activeRole !== 'staff' && organization && !organization.onboardingCompleted && !isOnboardingRoute) {
      router.push('/setup/details');
      return;
    }
    
    if ((organization?.onboardingCompleted || user.activeRole === 'staff') && user.onboardingCompleted && isOnboardingRoute) {
        router.push('/');
        return;
    }

    // Role-based route protection
    if (pathname.startsWith('/users') && user.activeRole !== 'owner') {
      router.push('/');
    }
    if (pathname.startsWith('/reports') && user.activeRole === 'staff') {
        router.push('/');
    }
    if (pathname.startsWith('/suppliers') && user.activeRole === 'staff') {
        router.push('/');
    }
    // Staff can't edit inventory items
    if (pathname.match(/^\/inventory\/.+\/edit$/) && user.activeRole === 'staff') {
        router.push('/inventory');
    }
    // Staff can only create expenses, not view the list or edit
     if (pathname.startsWith('/expenses') && user.activeRole === 'staff' && !pathname.endsWith('/new')) {
        router.push('/expenses/new');
    }

  }, [user, organization, isLoading, pathname, router]);

  const handleSignOut = async () => {
    await signOut(auth);
    setUser(null);
    setOrganization(null);
    router.push('/login');
  };

  const FullScreenLoader = () => (
    <div className="flex h-screen w-full items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );

  if (isLoading) {
    return <FullScreenLoader />;
  }
  
  if (!user && !unprotectedRoutes.some(route => pathname.startsWith(route)) && !pathname.startsWith('/setup')) {
     return <FullScreenLoader />;
  }

  return (
    <AuthContext.Provider value={{ user, organization, isLoading, signOut: handleSignOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
