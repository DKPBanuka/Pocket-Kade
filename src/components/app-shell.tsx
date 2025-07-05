
'use client';

import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import AppHeader from '@/components/layout/header';
import AppSidebar from '@/components/layout/sidebar';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import MobileBottomNav from '@/components/mobile-bottom-nav';

const unprotectedRoutes = ['/login', '/signup'];

export default function AppShell({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const { user } = useAuth();

    // On unprotected routes, just render the page content without the shell
    if (unprotectedRoutes.includes(pathname)) {
        return <>{children}</>;
    }

    // If user is logged in, show the full app shell
    if (user) {
        return (
            <SidebarProvider>
                <AppSidebar />
                <SidebarInset>
                    <AppHeader />
                    <main className="pb-16 md:pb-0">{children}</main>
                </SidebarInset>
                <MobileBottomNav />
            </SidebarProvider>
        );
    }
    
    // On protected routes without a user, AuthProvider shows a loader/redirects.
    // We don't render anything here while that happens.
    return null;
}
