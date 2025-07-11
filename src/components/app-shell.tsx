
'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import AppHeader from '@/components/layout/header';
import AppSidebar from '@/components/layout/sidebar';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import MobileBottomNav from '@/components/mobile-bottom-nav';
import { useTheme } from 'next-themes';

export default function AppShell({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const { user, organization } = useAuth();
    const { setTheme } = useTheme();

    useEffect(() => {
        if (organization?.selectedTheme) {
            setTheme(organization.selectedTheme);
        }
    }, [organization, setTheme]);

    const unprotectedRoutes = ['/login', '/signup', '/accept-invitation'];
    const isOnboarding = pathname.startsWith('/setup');
    
    // If on a route that shouldn't have the main app shell, just render the children
    if (unprotectedRoutes.some(r => pathname.startsWith(r)) || isOnboarding) {
        return <>{children}</>;
    }
    
    // For all other pages (public demo pages and protected app pages) render the shell
    return (
        <SidebarProvider>
            {user && <AppSidebar />} {/* Only show sidebar for logged-in users */}
            <SidebarInset>
                <AppHeader />
                <main className="pb-16 md:pb-0">{children}</main>
            </SidebarInset>
            {user && <MobileBottomNav />} {/* Only show mobile nav for logged-in users */}
        </SidebarProvider>
    );
}
