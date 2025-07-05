
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { useChatContext } from '@/contexts/chat-context';
import { LayoutDashboard, FileText, Archive, LineChart, MessageSquare } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

export default function MobileBottomNav() {
  const pathname = usePathname();
  const { user } = useAuth();
  const { totalUnreadCount } = useChatContext();

  const navItems = [
    { href: '/', label: 'Dashboard', icon: LayoutDashboard, roles: ['owner', 'admin', 'staff'] },
    { href: '/invoices', label: 'Invoices', icon: FileText, roles: ['owner', 'admin', 'staff'] },
    { href: '/inventory', label: 'Inventory', icon: Archive, roles: ['owner', 'admin', 'staff'] },
    { href: '/reports', label: 'Reports', icon: LineChart, roles: ['owner', 'admin'] },
    { href: '/messages', label: 'Messages', icon: MessageSquare, roles: ['owner', 'admin', 'staff'] },
  ];

  if (!user || !user.activeRole) {
    return null;
  }
  
  const availableNavItems = navItems.filter(item => item.roles.includes(user.activeRole!));

  const isLinkActive = (href: string) => {
    if (href === '/') {
        return pathname === '/';
    }
    // Check if the current pathname starts with the link's href.
    return pathname.startsWith(href);
  }

  return (
    <nav className="md:hidden fixed bottom-0 left-0 z-50 w-full h-16 bg-background border-t border-border no-print">
      <div className="flex h-full mx-auto font-medium">
        {availableNavItems.map((item) => (
          <Link
            key={item.href}
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
            <span className="text-xs">{item.label}</span>
          </Link>
        ))}
      </div>
    </nav>
  );
}
