
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { useChatContext } from '@/contexts/chat-context';
import { LayoutDashboard, FileText, Archive, LineChart, MessageSquare, Wallet } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { useLanguage } from '@/contexts/language-context';

export default function MobileBottomNav() {
  const pathname = usePathname();
  const { user } = useAuth();
  const { totalUnreadCount } = useChatContext();
  const { t } = useLanguage();

  if (!user || !user.activeRole) {
    return null;
  }

  // Define root paths that have a bottom nav icon.
  const mainNavRoots = ['/', '/invoices', '/inventory', '/expenses', '/reports'];
  
  // The nav should only be visible on these exact root paths.
  // Exception: For staff, the /expenses link points to /expenses/new, so that path should also be visible.
  const isStaffOnTheirExpensePage = user.activeRole === 'staff' && pathname === '/expenses/new';
  if (!mainNavRoots.includes(pathname) && !isStaffOnTheirExpensePage) {
    return null;
  }
  
  const navItems = [
    { href: '/', label: t('sidebar.dashboard'), icon: LayoutDashboard, roles: ['owner', 'admin', 'staff'], id: 'mobile-dashboard-link' },
    { href: '/invoices', label: t('sidebar.invoices'), icon: FileText, roles: ['owner', 'admin', 'staff'], id: 'mobile-invoices-link' },
    { href: '/inventory', label: t('sidebar.inventory'), icon: Archive, roles: ['owner', 'admin', 'staff'], id: 'mobile-inventory-link' },
    { href: user.activeRole === 'staff' ? '/expenses/new' : '/expenses', label: t('sidebar.expenses'), icon: Wallet, roles: ['owner', 'admin', 'staff'], id: 'mobile-expenses-link' },
    { href: '/reports', label: t('sidebar.analysis'), icon: LineChart, roles: ['owner', 'admin'], id: 'mobile-reports-link' },
  ];

  const availableNavItems = navItems.filter(item => item.roles.includes(user.activeRole!));

  const isLinkActive = (href: string) => {
    if (href === '/') {
        return pathname === '/';
    }
    // Check if the current pathname starts with the link's href for highlighting.
    // This allows /invoices/new to highlight the /invoices tab.
    return pathname.startsWith(href);
  }

  return (
    <nav className="md:hidden fixed bottom-0 left-0 z-50 w-full h-16 bg-background border-t border-border no-print">
      <div className="flex h-full mx-auto font-medium">
        {availableNavItems.map((item) => (
          <Link
            key={item.href}
            id={item.id}
            href={item.href}
            className={cn(
                "inline-flex flex-1 flex-col items-center justify-center px-1 text-center hover:bg-muted group",
                isLinkActive(item.href) ? 'text-primary' : 'text-muted-foreground'
            )}
          >
            <div className="relative">
                <item.icon className="w-5 h-5 mb-1" />
                {item.href === '/messages' && totalUnreadCount > 0 && (
                    <Badge className="absolute -top-2 -right-3 h-5 min-w-[1.25rem] justify-center rounded-full p-1 text-xs">
                        {totalUnreadCount > 9 ? '9+' : totalUnreadCount}
                    </Badge>
                )}
            </div>
            <span className="text-xs whitespace-nowrap">{item.label}</span>
          </Link>
        ))}
      </div>
    </nav>
  );
}
