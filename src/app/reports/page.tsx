
"use client";

import { useMemo, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2, TrendingDown, AlertTriangle, TrendingUp, PackageCheck, ChevronRight, Wallet, Banknote, Clock, Scale, Hourglass } from 'lucide-react';
import { useInventory } from '@/hooks/use-inventory';
import { useInvoices } from '@/hooks/use-invoices';
import { useExpenses } from '@/hooks/use-expenses';
import type { InventoryItem, Invoice, Expense } from '@/lib/types';
import { useAuth } from '@/contexts/auth-context';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useLanguage } from '@/contexts/language-context';

const formatCurrency = (amount: number) => `Rs.${amount.toFixed(2)}`;

function ReportsDisplay({ inventory }: { inventory: InventoryItem[] }) {
    const { t } = useLanguage();
    const summaryStats = useMemo(() => {
        const totalCostValue = inventory.reduce((sum, item) => sum + item.costPrice * item.quantity, 0);
        const totalRetailValue = inventory.reduce((sum, item) => sum + item.price * item.quantity, 0);
        const potentialProfit = totalRetailValue - totalCostValue;
        const lowStockItemsCount = inventory.filter(item => item.quantity <= item.reorderPoint && item.quantity > 0).length;
        
        return { totalCostValue, totalRetailValue, lowStockItemsCount, potentialProfit };
    }, [inventory]);

    const reportCards = [
        {
            title: t('analysis.pl_card.title'),
            desc: t('analysis.pl_card.desc'),
            href: "/reports/profit-loss",
            icon: Scale
        },
        {
            title: t('analysis.aging.title'),
            desc: t('analysis.aging.desc'),
            href: "/reports/aging-report",
            icon: Clock
        },
        {
            title: t('analysis.inventory_aging.card_title'),
            desc: t('analysis.inventory_aging.card_desc'),
            href: "/reports/inventory-aging",
            icon: Hourglass
        },
        {
            title: t('analysis.expense.title'),
            desc: t('analysis.expense.desc'),
            href: "/reports/expense-analysis",
            icon: Wallet
        }
    ];

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{t('analysis.dashboard.cost_value')}</CardTitle>
                <Wallet className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(summaryStats.totalCostValue)}</div>
            </CardContent>
        </Card>
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{t('analysis.dashboard.retail_value')}</CardTitle>
                <Banknote className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(summaryStats.totalRetailValue)}</div>
            </CardContent>
        </Card>
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{t('analysis.dashboard.profit_value')}</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(summaryStats.potentialProfit)}</div>
            </CardContent>
        </Card>
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{t('analysis.dashboard.low_stock')}</CardTitle>
                <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{summaryStats.lowStockItemsCount}</div>
            </CardContent>
        </Card>
      </div>
      
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
             {reportCards.map((card) => {
                const Icon = card.icon;
                return (
                    <Link href={card.href} className="group block" key={card.href}>
                        <Card className="h-full transition-all duration-300 group-hover:shadow-lg group-hover:-translate-y-1">
                             <CardHeader className="flex flex-row items-center gap-4 space-y-0">
                                <div className="p-3 rounded-full bg-primary/10 text-primary">
                                    <Icon className="h-6 w-6" />
                                </div>
                                <div>
                                    <CardTitle>{card.title}</CardTitle>
                                    <CardDescription>{card.desc}</CardDescription>
                                </div>
                            </CardHeader>
                        </Card>
                    </Link>
                );
             })}
        </div>
    </div>
  );
}


export default function ReportsPage() {
  const router = useRouter();
  const { inventory, isLoading: inventoryLoading } = useInventory();
  const { user, isLoading: authLoading } = useAuth();
  const { t } = useLanguage();

  const isLoading = inventoryLoading || authLoading;

  useEffect(() => {
    if (!authLoading && user?.activeRole === 'staff') {
      router.push('/');
    }
  }, [user, authLoading, router]);

  if (isLoading || !user || user.activeRole === 'staff') {
    return <div className="flex h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  return (
    <div className="container mx-auto max-w-7xl p-4 sm:p-6 lg:p-8">
      <div className="mb-8 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-3xl font-bold font-headline tracking-tight">
            {t('analysis.title')}
          </h1>
          <p className="text-muted-foreground">
            {t('analysis.desc')}
          </p>
        </div>
        <Button variant="outline" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          {t('general.back')}
        </Button>
      </div>
      <ReportsDisplay inventory={inventory} />
    </div>
  );
}
