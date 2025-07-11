
"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { onAuthStateChanged, signOut, type User as FirebaseUser } from 'firebase/auth';
import { doc, getDoc, onSnapshot, writeBatch, collection, serverTimestamp, setDoc } from 'firebase/firestore';
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
        let userDocSnap = await getDoc(userDocRef);

        // Handle first-time Google Sign-In
        if (!userDocSnap.exists()) {
            const batch = writeBatch(db);
            const orgRef = doc(collection(db, 'organizations'));
            const orgName = firebaseUser.displayName ? `${firebaseUser.displayName.split(' ')[0]}'s Store` : "My New Store";
            batch.set(orgRef, {
                name: orgName,
                ownerUid: firebaseUser.uid,
                createdAt: serverTimestamp(),
                onboardingCompleted: false,
                selectedTheme: 'system',
            });
            const tenantId = orgRef.id;

            batch.set(userDocRef, {
                username: firebaseUser.displayName || `user_${firebaseUser.uid.substring(0,5)}`,
                email: firebaseUser.email,
                onboardingCompleted: false,
                tenants: { [tenantId]: 'owner' },
                createdAt: serverTimestamp(),
            });
            await batch.commit();
            userDocSnap = await getDoc(userDocRef); // Re-fetch the newly created doc
        }
        
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
    if (isLoading) return;

    const isOnboardingRoute = pathname.startsWith('/setup');
    const isGuestSession = typeof window !== 'undefined' && sessionStorage.getItem('isGuest') === 'true';

    // --- LOGGED IN User Logic ---
    if (user) {
      if (isGuestSession) sessionStorage.removeItem('isGuest');

      // 1. Redirect to onboarding if not completed.
      if (!user.onboardingCompleted && !isOnboardingRoute) {
        if(user.activeRole !== 'staff') {
            router.push('/setup/welcome');
        } else { 
            router.push('/setup/language');
        }
        return;
      }

      // 2. Redirect to org details if user is done but org isn't
      if (user.onboardingCompleted && user.activeRole !== 'staff' && organization && !organization.onboardingCompleted && !isOnboardingRoute) {
        router.push('/setup/details');
        return;
      }
      
      // 3. Redirect away from onboarding if everything is complete.
      if (user.onboardingCompleted && (organization?.onboardingCompleted || user.activeRole === 'staff') && isOnboardingRoute) {
        router.push('/');
        return;
      }
      
      // 4. Redirect logged-in users from public pages.
      if (unprotectedRoutes.some(r => pathname.startsWith(r))) {
        router.push('/');
        return;
      }

      // 5. Role-based route protection
      if (pathname.startsWith('/users') && user.activeRole !== 'owner') router.push('/');
      if (pathname.startsWith('/reports') && user.activeRole === 'staff') router.push('/');
      if (pathname.startsWith('/suppliers') && user.activeRole === 'staff') router.push('/');
      if (pathname.match(/^\/inventory\/.+\/edit$/) && user.activeRole === 'staff') router.push('/inventory');
      if (pathname.startsWith('/expenses') && user.activeRole === 'staff' && !pathname.endsWith('/new')) router.push('/expenses/new');
    
    // --- GUEST User Logic ---
    } else {
      const isAllowedGuestRoute = unprotectedRoutes.some(r => pathname.startsWith(r)) || isOnboardingRoute;

      if (isGuestSession) {
        const protectedRoutes = ['/settings', '/users', '/messages', '/profile', '/returns/new'];
        if (protectedRoutes.some(p => pathname.startsWith(p)) || pathname.includes('/edit')) {
            router.push('/login');
        }
        return;
      }
      
      if (!isAllowedGuestRoute) {
        router.push('/login');
      }
    }
  }, [user, organization, isLoading, pathname, router]);

  const handleSignOut = async () => {
    await signOut(auth);
    if (typeof window !== 'undefined') {
        sessionStorage.removeItem('isGuest');
    }
    setUser(null);
    setOrganization(null);
    router.push('/login');
  };

  const FullScreenLoader = () => (
    <div className="flex h-screen w-full items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );
  
  // This logic ensures that even on a page refresh, we show a loader until auth state is confirmed.
  if (isLoading) {
    return <FullScreenLoader />;
  }
  
  const isPublicRoute = unprotectedRoutes.some(r => pathname.startsWith(r));
  if (!user && !isPublicRoute && !(typeof window !== 'undefined' && sessionStorage.getItem('isGuest') === 'true')) {
    return <FullScreenLoader />;
  }


  return (
    <AuthContext.Provider value={{ user, organization, isLoading, signOut: handleSignOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
