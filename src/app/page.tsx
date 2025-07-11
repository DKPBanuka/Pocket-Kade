
"use client";

import { useAuth } from '@/contexts/auth-context';
import { Loader2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import LoggedInDashboard from '@/components/logged-in-dashboard';
import GuestDashboard from '@/components/guest-dashboard';
import LoggedInTour from '@/components/logged-in-tour';


export default function DashboardPage() {
    const { user, isLoading: authIsLoading } = useAuth();
    const [isGuest, setIsGuest] = useState(false);

    useEffect(() => {
        if (!authIsLoading) {
            const guestStatus = sessionStorage.getItem('isGuest') === 'true';
            setIsGuest(guestStatus && !user);
        }
    }, [authIsLoading, user]);
    
    if (authIsLoading) {
         return (
            <div className="flex h-screen w-full items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (user) {
        // For logged-in users, only show the LoggedInTour logic.
        return (
            <>
                {!user.onboardingCompleted && <LoggedInTour />}
                <LoggedInDashboard />
            </>
        );
    }
    
    if (isGuest) {
        // For guests, only show the GuestDashboard which contains its own tour.
        return <GuestDashboard />;
    }

    // Fallback for non-logged-in, non-guest users (e.g. should be redirected by AuthContext, but as a safeguard)
    return <GuestDashboard />;
}
