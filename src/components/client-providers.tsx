
'use client';

import { ThemeProvider } from '@/components/theme-provider';
import { AuthProvider } from '@/contexts/auth-context';
import { LanguageProvider } from '@/contexts/language-context';
import { ChatProvider } from '@/contexts/chat-context';
import AppShell from '@/components/app-shell';
import { Toaster } from '@/components/ui/toaster';

export default function ClientProviders({ children }: { children: React.ReactNode }) {
    return (
        <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
        >
            <AuthProvider>
              <LanguageProvider>
                <ChatProvider>
                  <AppShell>{children}</AppShell>
                  <Toaster />
                </ChatProvider>
              </LanguageProvider>
            </AuthProvider>
        </ThemeProvider>
    );
}
