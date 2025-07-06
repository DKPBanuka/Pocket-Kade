
"use client";

import Logo from '../logo';
import { cn } from '@/lib/utils';
import { WifiOff, Languages } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useOnlineStatus } from '@/hooks/use-online-status';
import { useAuth } from '@/contexts/auth-context';
import { Badge } from '@/components/ui/badge';
import { SidebarTrigger } from '../ui/sidebar';
import Link from 'next/link';
import { NotificationBell } from '../notification-bell';
import { useLanguage } from '@/contexts/language-context';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

function LanguageSwitcher() {
  const { locale, changeLocale } = useLanguage();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-9 w-9">
          <Languages className="h-5 w-5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => changeLocale('en')} disabled={locale === 'en'}>
          English
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => changeLocale('si')} disabled={locale === 'si'}>
          සිංහල
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function SyncStatus() {
  const isOnline = useOnlineStatus();
  const { t } = useLanguage();

  return (
    <div className="flex items-center gap-1.5 text-base font-medium">
    {isOnline ? (
        <>
        <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
        </span>
        <span className="hidden sm:inline text-primary">{t('header.online')}</span>
        </>
    ) : (
        <>
        <WifiOff className="h-4 w-4 text-muted-foreground" />
        <span className="hidden sm:inline text-muted-foreground">{t('header.offline')}</span>
        </>
    )}
    </div>
  )
}


export default function AppHeader() {
  const { user, isLoading, signOut } = useAuth();
  
  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 no-print">
      <div className="flex h-16 items-center px-4 sm:px-6">
        <div className="flex items-center">
            <SidebarTrigger />
        </div>
        <div className="flex items-center gap-2 sm:gap-4 ml-auto">
            {!isLoading && user && (
                <>
                <LanguageSwitcher />
                <NotificationBell />
                <SyncStatus />
                <div className="text-sm text-muted-foreground hidden sm:block">
                    |
                </div>
                <div className="hidden sm:flex items-center gap-2">
                    <p className="text-sm sm:text-base text-muted-foreground">{user.username}</p>
                    <Badge variant="outline" className="uppercase text-xs sm:text-sm">{user.activeRole}</Badge>
                </div>
                </>
            )}
        </div>
      </div>
    </header>
  );
}
