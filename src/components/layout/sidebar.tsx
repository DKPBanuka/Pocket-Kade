"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { useChatContext } from '@/contexts/chat-context';
import { 
    Sidebar,
    SidebarHeader,
    SidebarContent,
    SidebarMenu,
    SidebarMenuItem,
    SidebarMenuButton,
    SidebarFooter
} from '@/components/ui/sidebar';
import Logo from '../logo';
import { Archive, FileText, LayoutDashboard, LineChart, LogOut, MessageSquare, Settings, Truck, Undo2, Users, Wallet, Contact } from 'lucide-react';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { useLanguage } from '@/contexts/language-context';
import { useSidebar } from '@/components/ui/sidebar';

export default function AppSidebar() {
  const pathname = usePathname();
  const { user, signOut } = useAuth();
  const { totalUnreadCount } = useChatContext();
  const { t } = useLanguage();
  const { isMobile, setOpenMobile } = useSidebar();
  
  if (!user) {
      return null;
  }

  const navItems = [
    { href: '/', label: t('sidebar.dashboard'), icon: LayoutDashboard, roles: ['owner', 'admin', 'staff'] },
    { href: '/invoices', label: t('sidebar.invoices'), icon: FileText, roles: ['owner', 'admin', 'staff'] },
    { href: '/customers', label: t('sidebar.customers'), icon: Contact, roles: ['owner', 'admin', 'staff'] },
    { href: '/inventory', label: t('sidebar.inventory'), icon: Archive, roles: ['owner', 'admin', 'staff'] },
    { href: user.activeRole === 'staff' ? '/expenses/new' : '/expenses', label: t('sidebar.expenses'), icon: Wallet, roles: ['owner', 'admin', 'staff'] },
    { href: '/returns', label: t('sidebar.returns'), icon: Undo2, roles: ['owner', 'admin', 'staff'] },
    { href: '/messages', label: t('sidebar.messages'), icon: MessageSquare, roles: ['owner', 'admin', 'staff'] },
    { href: '/suppliers', label: t('sidebar.suppliers'), icon: Truck, roles: ['owner', 'admin'] },
    { href: '/reports', label: t('sidebar.analysis'), icon: LineChart, roles: ['owner', 'admin'] },
    { href: '/users', label: t('sidebar.users'), icon: Users, roles: ['owner'] },
  ];


  const handleLinkClick = () => {
    if (isMobile) {
      setOpenMobile(false);
    }
  };

  const availableNavItems = navItems.filter(item => user.activeRole && item.roles.includes(user.activeRole));
  
  const isLinkActive = (href: string) => {
    if (href === '/') {
        return pathname === '/';
    }
    return pathname.startsWith(href);
  }


  return (
    <Sidebar variant="sidebar" collapsible="icon" className="group-data-[collapsible=icon]:border-r">
        <SidebarHeader>
            <Logo />
        </SidebarHeader>
        <SidebarContent>
            <SidebarMenu>
                {availableNavItems.map((item) => (
                    <SidebarMenuItem key={item.href}>
                        <SidebarMenuButton 
                            asChild
                            isActive={isLinkActive(item.href)}
                            tooltip={{children: item.label}}
                        >
                             <Link href={item.href} onClick={handleLinkClick}>
                                <item.icon />
                                <span>{item.label}</span>
                            </Link>
                        </SidebarMenuButton>
                        {item.href === '/messages' && totalUnreadCount > 0 && (
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none group-data-[collapsible=icon]:right-1.5 group-data-[collapsible=icon]:top-1.5">
                                <div className="relative flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                                </div>
                            </div>
                        )}
                    </SidebarMenuItem>
                ))}
            </SidebarMenu>
        </SidebarContent>

        {/* Desktop Footer */}
        <SidebarFooter className="hidden md:flex flex-col gap-1 border-t p-2">
            <SidebarMenu>
                <SidebarMenuItem>
                     <SidebarMenuButton
                        asChild
                        className="h-auto justify-start p-2"
                        variant="ghost"
                        size="default"
                        isActive={isLinkActive('/settings')}
                      >
                        <Link href="/settings" onClick={handleLinkClick}>
                            <Avatar className="size-8">
                                <AvatarFallback>{user.username.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div className="flex flex-col items-start text-left">
                               <span className="font-medium">{user.username}</span>
                               <span className="text-xs uppercase text-muted-foreground">{user.activeRole}</span>
                            </div>
                        </Link>
                    </SidebarMenuButton>
                </SidebarMenuItem>
                 <SidebarMenuItem>
                    <SidebarMenuButton
                        variant="ghost"
                        className="w-full justify-start"
                        onClick={() => signOut()}
                        tooltip={{children: t('sidebar.logout')}}
                    >
                        <LogOut />
                        <span>{t('sidebar.logout')}</span>
                    </SidebarMenuButton>
                </SidebarMenuItem>
            </SidebarMenu>
        </SidebarFooter>
        
        {/* Mobile Footer */}
        <SidebarFooter className="md:hidden flex flex-col gap-2 border-t p-2">
             <Link href="/settings" className="block rounded-md hover:bg-muted" onClick={handleLinkClick}>
                <div className="flex items-center gap-2 px-2 py-2">
                    <Avatar className="size-8">
                        <AvatarFallback>{user.username.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div>
                        <p className="text-sm font-medium">{user.username}</p>
                        <Badge variant="outline" className="uppercase text-xs">{user.activeRole}</Badge>
                    </div>
                </div>
             </Link>
             <Button variant="ghost" className="w-full justify-start" onClick={() => {
                signOut();
                handleLinkClick();
             }}>
                <LogOut className="mr-2 h-4 w-4"/>
                <span>{t('sidebar.logout')}</span>
             </Button>
        </SidebarFooter>
    </Sidebar>
  );
}
