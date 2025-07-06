
"use client";

import { useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useInventory } from '@/hooks/use-inventory';
import { useAuth } from '@/contexts/auth-context';
import { useLanguage } from '@/contexts/language-context';
import { Button } from '@/components/ui/button';
import { Loader2, ArrowLeft } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { differenceInDays, formatDistanceToNow } from 'date-fns';
import type { InventoryItem } from '@/lib/types';

interface AgedInventoryItem extends InventoryItem {
    ageInDays: number;
}

function InventoryAgingReport({ inventory }: { inventory: InventoryItem[] }) {
    const { t } = useLanguage();

    const agedData = useMemo(() => {
        const brackets: { [key: string]: AgedInventoryItem[] } = {
            '0-30': [],
            '31-90': [],
            '91-180': [],
            '180+': [],
        };

        inventory.forEach(item => {
            const ageInDays = differenceInDays(new Date(), new Date(item.createdAt));
            const agedItem = { ...item, ageInDays };
            if (ageInDays <= 30) brackets['0-30'].push(agedItem);
            else if (ageInDays <= 90) brackets['31-90'].push(agedItem);
            else if (ageInDays <= 180) brackets['91-180'].push(agedItem);
            else brackets['180+'].push(agedItem);
        });

        for (const key in brackets) {
            brackets[key].sort((a,b) => a.ageInDays - b.ageInDays);
        }

        return brackets;

    }, [inventory]);

    const bracketLabels: {[key: string]: string} = {
        '0-30': t('analysis.inventory_aging.days_0_30'),
        '31-90': t('analysis.inventory_aging.days_31_90'),
        '91-180': t('analysis.inventory_aging.days_91_180'),
        '180+': t('analysis.inventory_aging.days_180_plus'),
    }

    return (
        <div className="space-y-8">
            {Object.entries(agedData).map(([key, items]) => (
                <div key={key}>
                    <h2 className="text-xl font-semibold mb-3 font-headline">
                        {bracketLabels[key]} ({t('analysis.inventory_aging.item_count', { count: items.length })})
                    </h2>
                    {items.length > 0 ? (
                        <Card>
                             <div className="rounded-md border-t">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>{t('analysis.inventory_aging.table.item')}</TableHead>
                                            <TableHead>{t('analysis.inventory_aging.table.age')}</TableHead>
                                            <TableHead className="text-right">{t('analysis.inventory_aging.table.stock')}</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {items.map(item => (
                                            <TableRow key={item.id}>
                                                <TableCell className="font-medium">{item.name}</TableCell>
                                                <TableCell>{formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}</TableCell>
                                                <TableCell className="text-right">{item.quantity}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        </Card>
                    ) : (
                        <div className="flex items-center justify-center rounded-lg border-2 border-dashed border-muted bg-white/50 p-8 text-center">
                            <p className="text-sm text-muted-foreground">{t('analysis.inventory_aging.no_items')}</p>
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
}

export default function InventoryAgingPage() {
    const router = useRouter();
    const { user, isLoading: authLoading } = useAuth();
    const { inventory, isLoading: inventoryLoading } = useInventory();
    const { t } = useLanguage();
    const isLoading = authLoading || inventoryLoading;

    useEffect(() => {
        if (!authLoading && user?.activeRole === 'staff') {
            router.push('/');
        }
    }, [user, authLoading, router]);

    if (isLoading || !user || user.activeRole === 'staff') {
        return <div className="flex h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>;
    }
    
    return (
        <div className="container mx-auto max-w-4xl p-4 sm:p-6 lg:p-8">
            <div className="mb-8 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
                <div>
                    <h1 className="text-3xl font-bold font-headline tracking-tight">
                        {t('analysis.inventory_aging.title')}
                    </h1>
                    <p className="text-muted-foreground">
                        {t('analysis.inventory_aging.desc')}
                    </p>
                </div>
                <Button variant="outline" onClick={() => router.back()}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    {t('general.back')}
                </Button>
            </div>
            <InventoryAgingReport inventory={inventory} />
        </div>
    );
}
